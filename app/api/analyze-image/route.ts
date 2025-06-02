import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { analyzeImageWithGPT } from '@/app/lib/openai-utils';
import { sanitizeObject } from '@/utils/json-helpers';
import { Buffer } from 'buffer';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('[api/analyze-image] Processing request');
    
    // Get the authenticated user if available
    let userId: string | null = null;
    let userGoal = 'General Health';
    
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userId = user.id;
        console.log(`[api/analyze-image] Authenticated user: ${userId}`);
        
        // Get user profile for health goals
        const { data: profileData } = await supabase
          .from('profiles')
          .select('health_goals')
          .eq('id', userId)
          .single();
          
        if (profileData?.health_goals) {
          userGoal = profileData.health_goals;
          console.log(`[api/analyze-image] User goal: ${userGoal}`);
        }
      }
    } catch (authError) {
      console.error('[api/analyze-image] Auth error:', authError);
      // Continue without user authentication
    }

    // Check if this is a JSON or form-data request
    const contentType = request.headers.get('content-type') || '';
    
    // Process the request based on content type
    let imageBase64 = '';
    let formGoal = userGoal;
    
    // Handle form-data request (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Get the image from form data - accept either 'image' or 'file' field name for compatibility
      let imageFile = formData.get('image') as File;
      if (!imageFile) {
        imageFile = formData.get('file') as File;
      }
      
      if (!imageFile) {
        return NextResponse.json({ 
          success: false, 
          error: 'No image provided' 
        }, { status: 400 });
      }
      
      // Get goal from form data if provided
      const goalFromForm = formData.get('goal') as string;
      if (goalFromForm) {
        formGoal = goalFromForm;
      }
      
      // Convert image to base64
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageBase64 = buffer.toString('base64');
      
      console.log(`[api/analyze-image] Processing uploaded image: ${imageFile.name} (${imageFile.size} bytes)`);
    } 
    // Handle JSON request
    else {
      // Parse request body
      const body = await request.json();
      const { imageUrl, imageBase64: base64Data, goal } = body;

      if (goal) {
        formGoal = goal;
      }

      if (base64Data) {
        imageBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      } else if (imageUrl) {
        // We would need to fetch the image from URL and convert to base64
        // This is a simplified implementation
        return NextResponse.json({ 
          success: false, 
          error: 'Direct imageUrl not supported. Please provide base64 image data.' 
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'No image data provided' 
        }, { status: 400 });
      }
    }

    // Now we have imageBase64 and formGoal, analyze the image
    console.log('[api/analyze-image] Analyzing image with GPT');
    
    const analysisData = await analyzeImageWithGPT(imageBase64, formGoal);
    
    // Create a meal ID for this analysis
    const mealId = uuidv4();
    
    // Save to database if user is authenticated
    if (userId) {
      try {
        const supabase = createRouteHandlerClient({ cookies });
        await supabase
          .from('meals')
          .insert({
            id: mealId,
            user_id: userId,
            meal_name: analysisData.mealName,
            name: analysisData.mealName,
            caption: analysisData.mealName,
            calories: analysisData.calories || 0,
            analysis: analysisData,
            goal: formGoal,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        console.log(`[api/analyze-image] Saved analysis to database with ID: ${mealId}`);
      } catch (dbError) {
        console.error('[api/analyze-image] Database error:', dbError);
        // Continue without database storage
      }
    }
    
    // Return the standardized response
    const response = {
      success: true,
      mealId,
      mealAnalysis: analysisData,
      data: {
        mealId,
        mealAnalysis: analysisData
      }
    };
    
    // Sanitize the response to prevent JSON issues
    return NextResponse.json(sanitizeObject(response));
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze image',
      errorDetails: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
} 