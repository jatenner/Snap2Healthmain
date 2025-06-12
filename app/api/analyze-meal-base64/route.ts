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

    // Run OpenAI analysis with base64 image directly
    console.log('[analyze-meal-base64] Running OpenAI analysis with base64 image...');
    let analysisResult;
    
    try {
      // Import the analyzeImageWithGPT function directly
      const { analyzeImageWithGPT } = await import('../../lib/openai-utils');
      
      // Create a basic user profile for analysis
      const userProfile = {
        goal: goal,
        age: 30,
        weight: 70,
        weight_unit: 'kg',
        height: 170,
        height_unit: 'cm',
        gender: 'male',
        activity_level: 'moderate'
      };
      
      // Run OpenAI analysis with timeout
      analysisResult = await Promise.race([
        analyzeImageWithGPT(base64Image, userProfile),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI analysis timeout after 30 seconds')), 30000)
        )
      ]);
      
      console.log('[analyze-meal-base64] OpenAI analysis completed successfully');
      
      // Validate the response
      if (!analysisResult || !(analysisResult as any).calories) {
        throw new Error('OpenAI analysis failed to return valid nutrition data');
      }
      
    } catch (error) {
      console.error('[analyze-meal-base64] OpenAI analysis failed:', error);
      return NextResponse.json({
        success: false,
        error: 'OpenAI vision analysis failed to process your meal image.',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
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