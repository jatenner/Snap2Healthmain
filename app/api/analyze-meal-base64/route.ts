import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('[analyze-meal-base64] 🚀 Starting meal analysis with base64 approach...');
    console.log('[analyze-meal-base64] Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('[analyze-meal-base64] Request URL:', request.url);
    console.log('[analyze-meal-base64] Request method:', request.method);
    console.log('[analyze-meal-base64] User-Agent:', request.headers.get('user-agent'));
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mealName = (formData.get('mealName') as string) || 'Analyzed Meal';
    const goal = (formData.get('goal') as string) || 'General Wellness';

    console.log('[analyze-meal-base64] Form data parsed:', {
      hasFile: !!file,
      fileType: file?.type,
      fileSize: file?.size,
      mealName,
      goal
    });

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'Your image is too large. Please try a smaller image (under 10MB)' },
        { status: 400 }
      );
    }

    // Convert file to buffer and base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const base64Image = `data:${mimeType};base64,${base64Data}`;
    
    console.log('[analyze-meal-base64] File converted to base64, length:', base64Image.length);

    // Create unique filename for storage
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filename = `base64-test/${timestamp}-${randomId}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    
    console.log('[analyze-meal-base64] Uploading image to storage:', filename);

    // Upload to Supabase storage
    let publicUrl: string;
    try {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('meal-images')
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.warn('[analyze-meal-base64] Supabase storage upload failed:', uploadError);
        throw new Error('Supabase storage failed');
      }

      // Get public URL
      const { data: { publicUrl: supabaseUrl } } = supabaseAdmin.storage
        .from('meal-images')
        .getPublicUrl(filename);

      publicUrl = supabaseUrl;
      console.log('[analyze-meal-base64] Image uploaded to Supabase successfully:', publicUrl);

    } catch (storageError) {
      console.warn('[analyze-meal-base64] Supabase storage unavailable, using data URL fallback');
      publicUrl = base64Image;
    }

    // Generate unique meal ID  
    const mealId = uuidv4();

    // Run OpenAI analysis with base64 image
    console.log('[analyze-meal-base64] Running OpenAI analysis with base64 image...');
    
    try {
      // Import the analyzeImageWithGPT function directly
      const { analyzeImageWithGPT } = await import('../../lib/openai-utils');
      
      // Create a basic user profile for analysis
      const userProfile = {
        goal: goal,
        age: 30,
        weight: 70,
        weight_unit: 'kg' as 'kg',
        height: 170,
        height_unit: 'cm' as 'cm',
        gender: 'male',
        activity_level: 'moderate'
      };
      
      analysisResult = await analyzeImageWithGPT(base64Data, userProfile);
      console.log('[analyze-meal-base64] OpenAI analysis completed successfully');
    } catch (openaiError: any) {
      console.error('[analyze-meal-base64] OpenAI analysis failed:', openaiError);
      
      // Provide specific error messages based on the type of OpenAI error
      let errorMessage = 'OpenAI vision analysis failed to process your meal image';
      let errorDetails = '';
      
      if (openaiError.message) {
        const errorMsg = openaiError.message.toLowerCase();
        
        if (errorMsg.includes('unsupported image')) {
          errorMessage = 'The uploaded image format is not supported by our analysis system';
          errorDetails = 'Please try uploading a JPEG or PNG image of your meal';
        } else if (errorMsg.includes('rate limit')) {
          errorMessage = 'Our analysis system is currently busy';
          errorDetails = 'Please try again in a few moments';
        } else if (errorMsg.includes('timeout')) {
          errorMessage = 'Analysis took too long to complete';
          errorDetails = 'Please try uploading a smaller image or try again';
        } else if (errorMsg.includes('content policy')) {
          errorMessage = 'The image could not be analyzed due to content restrictions';
          errorDetails = 'Please ensure the image shows food items only';
        } else if (errorMsg.includes('invalid api key') || errorMsg.includes('authentication')) {
          errorMessage = 'Analysis service configuration error';
          errorDetails = 'Please contact support if this issue persists';
        } else {
          errorDetails = `Technical details: ${openaiError.message}`;
        }
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: errorDetails,
        debugInfo: process.env.NODE_ENV === 'development' ? {
          originalError: openaiError.message,
          stack: openaiError.stack,
          timestamp: new Date().toISOString()
        } : undefined
      }, { status: 422 });
    }

    // Prepare meal record for database
    const analysis = analysisResult as any;
    const mealRecord = {
      user_id: '11111111-1111-1111-1111-111111111111', // Default user for testing
      name: analysis?.mealName || mealName,
      caption: analysis?.mealName || mealName,
      meal_name: analysis?.mealName || mealName,
      description: analysis?.mealDescription || '',
      image_url: publicUrl,
      calories: analysis?.calories || 0,
      protein: analysis?.protein || 0,
      fat: analysis?.fat || 0,
      carbs: analysis?.carbs || 0,
      macronutrients: Array.isArray(analysis?.macronutrients) ? analysis.macronutrients : [],
      micronutrients: Array.isArray(analysis?.micronutrients) ? analysis.micronutrients : [],
      ingredients: Array.isArray(analysis?.ingredients) ? analysis.ingredients : [],
      benefits: Array.isArray(analysis?.benefits) ? analysis.benefits : [],
      concerns: Array.isArray(analysis?.concerns) ? analysis.concerns : [],
      suggestions: Array.isArray(analysis?.suggestions) ? analysis.suggestions : [],
      foods_identified: Array.isArray(analysis?.foods) ? analysis.foods : [],
      foods: Array.isArray(analysis?.foods) ? analysis.foods : [],
      tags: [],
      analysis: analysisResult || {},
      raw_analysis: analysisResult || {},
      personalized_insights: analysis?.personalizedHealthInsights || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to database
    let actualMealId = mealId;
    try {
      const insertResult = await supabaseAdmin
        .from('meals')
        .insert([mealRecord])
        .select('id')
        .single();

      if (insertResult.error) {
        console.error('[analyze-meal-base64] Database insertion failed:', insertResult.error);
        throw new Error(`Failed to save meal analysis: ${insertResult.error.message}`);
      }

      actualMealId = insertResult.data?.id || mealId;
      console.log('[analyze-meal-base64] Meal saved to database successfully:', actualMealId);

    } catch (dbError) {
      console.error('[analyze-meal-base64] Database operation failed:', dbError);
      // Continue without database save for testing
    }

    // Return successful response
    console.log('[analyze-meal-base64] 🎉 Analysis completed successfully');
    return NextResponse.json({
      success: true,
      mealId: actualMealId,
      id: actualMealId,
      name: analysis?.mealName || mealName,
      caption: analysis?.mealName || mealName,
      calories: analysis?.calories || 0,
      imageUrl: publicUrl,
      image_url: publicUrl,
      detected_food: analysis?.mealName || mealName,
      foods_identified: analysis?.foods || [],
      ingredients: analysis?.ingredients || [],
      analysis: analysisResult,
      nutrients: analysisResult,
      macronutrients: analysis?.macronutrients || [],
      micronutrients: analysis?.micronutrients || [],
      benefits: analysis?.benefits || [],
      concerns: analysis?.concerns || [],
      suggestions: analysis?.suggestions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      personalized_insights: analysis?.personalizedHealthInsights || null,
      meal_description: analysis?.mealDescription || '',
      foods: analysis?.foods || [],
      raw_analysis: analysisResult,
      uuid: actualMealId,
      goal: goal
    });

  } catch (error) {
    console.error('[analyze-meal-base64] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during meal analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 