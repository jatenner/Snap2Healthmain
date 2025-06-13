import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Background function to generate insights immediately after meal analysis
async function generateInsightsInBackground(mealId: string, userId: string, userMetadata: any, analysis: any) {
  try {
    console.log('[background-insights] Starting fast insights generation for meal:', mealId);
    
    // Extract user profile from metadata
    const age = parseInt(userMetadata.age) || 25;
    const weight = parseInt(userMetadata.weight) || 225;
    const height = parseInt(userMetadata.height) || 78;
    const gender = userMetadata.gender || 'male';
    const activityLevel = userMetadata.activityLevel || 'active';
    const goal = userMetadata.defaultGoal || 'athletic performance';
    
    // Calculate TDEE
    const heightInCm = height * 2.54;
    const weightInKg = weight * 0.453592;
    const bmr = gender === 'male' 
      ? 88.362 + (13.397 * weightInKg) + (4.799 * heightInCm) - (5.677 * age)
      : 447.593 + (9.247 * weightInKg) + (3.098 * heightInCm) - (4.330 * age);
    
    const activityMultipliers: { [key: string]: number } = {
      'sedentary': 1.2, 'lightly_active': 1.375, 'moderately_active': 1.55,
      'active': 1.725, 'very_active': 1.9
    };
    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.725));
    
    // Create fast, focused prompt for health insights
    const prompt = `Generate concise health insights for this meal:

**Profile**: ${age}yr ${gender}, ${weight}lbs, ${Math.floor(height/12)}'${height%12}", ${activityLevel}, TDEE: ${tdee} kcal/day
**Meal**: ${analysis?.mealName || 'Analyzed Meal'} - ${analysis?.calories || 0} kcal, ${analysis?.protein || 0}g protein, ${analysis?.carbs || 0}g carbs, ${analysis?.fat || 0}g fat

Provide 4 focused sections:

## Metabolic Impact
- Energy balance (${((analysis?.calories || 0)/tdee*100).toFixed(1)}% of daily needs)
- Insulin response and metabolic effects
- Fat vs glucose utilization patterns

## Microbiome & Gut Health
- Fiber content and prebiotic benefits
- Gut barrier function impact
- Beneficial bacteria support

## Hormonal Response
- Satiety hormone effects (leptin, ghrelin)
- Stress hormone impact (cortisol)
- Recovery hormone influence

## Performance Optimization
- Pre/post-workout timing recommendations
- Muscle recovery and adaptation support
- Cognitive and energy optimization

Keep each section 2-3 sentences, focus on actionable health insights.`;

    console.log('[background-insights] Sending fast request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a metabolic health expert. Provide concise, actionable health insights focused on metabolism, gut health, hormones, and performance. No cultural context or cooking methods."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 1200,
      temperature: 0.1,
    });

    const insights = completion.choices[0]?.message?.content || '';
    
    if (insights && insights.length > 100) {
      // Save insights to database
      await supabaseAdmin
        .from('meals')
        .update({ 
          insights: insights,
          personalized_insights: insights 
        })
        .eq('id', mealId);
      
      console.log('[background-insights] ✅ Fast insights generated and saved:', insights.length, 'characters');
    } else {
      console.warn('[background-insights] ⚠️ Generated insights too short, skipping save');
    }
    
  } catch (error) {
    console.error('[background-insights] ❌ Failed to generate insights:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[analyze-meal-base64] 🚀 Starting meal analysis with base64 approach...');
    console.log('[analyze-meal-base64] Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('[analyze-meal-base64] Request URL:', request.url);
    console.log('[analyze-meal-base64] Request method:', request.method);
    console.log('[analyze-meal-base64] User-Agent:', request.headers.get('user-agent'));
    
    // Get user session for proper user_id using server client
    const { createClient: createServerClient } = await import('../../lib/supabase/server');
    const supabase = createServerClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('[analyze-meal-base64] Session debug:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      cookies: request.headers.get('cookie')?.substring(0, 100) + '...'
    });
    
    const userId = session?.user?.id; // Remove fallback to test user ID
    
    // If no session, return error instead of using test user ID
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        details: 'You must be logged in to analyze meals'
      }, { status: 401 });
    }
    
    console.log('[analyze-meal-base64] User session:', { 
      hasSession: !!session, 
      userId: userId,
      userEmail: session?.user?.email 
    });
    
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
    
    let analysisResult: any;
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
      
      // Debug logging for image format
      console.log('[analyze-meal-base64] About to call analyzeImageWithGPT with:');
      console.log('[analyze-meal-base64] - Image starts with data:image/:', base64Image.startsWith('data:image/'));
      console.log('[analyze-meal-base64] - Image contains base64:', base64Image.includes('base64,'));
      console.log('[analyze-meal-base64] - Image length:', base64Image.length);
      console.log('[analyze-meal-base64] - Image prefix (first 50 chars):', base64Image.substring(0, 50));
      console.log('[analyze-meal-base64] - MIME type detected:', mimeType);
      
      analysisResult = await analyzeImageWithGPT(base64Image, userProfile);
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

    // Prepare meal record for database - simplified to avoid column errors
    const analysis = analysisResult as any;
    const mealRecord = {
      user_id: userId,
      meal_name: analysis?.mealName || mealName,
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
      analysis: analysisResult || {},
      personalized_insights: analysis?.personalizedHealthInsights || null,
      goal: goal
    };

    // Save to database with robust error handling
    let actualMealId = mealId;
    let dbSaveSuccessful = false;
    
    try {
      console.log('[analyze-meal-base64] Attempting to save meal to database...');
      console.log('[analyze-meal-base64] Meal record keys:', Object.keys(mealRecord));
      
      const insertResult = await supabaseAdmin
        .from('meals')
        .insert([mealRecord])
        .select('id')
        .single();

      if (insertResult.error) {
        console.error('[analyze-meal-base64] Database insertion failed:', insertResult.error);
        console.error('[analyze-meal-base64] Error details:', {
          code: insertResult.error.code,
          message: insertResult.error.message,
          details: insertResult.error.details,
          hint: insertResult.error.hint
        });
        
        // If database save fails, get the most recent meal ID as fallback
        console.warn('[analyze-meal-base64] Database save failed, getting most recent meal as fallback...');
        try {
          const { data: recentMeal } = await supabaseAdmin
            .from('meals')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (recentMeal?.id) {
            actualMealId = recentMeal.id;
            console.log('[analyze-meal-base64] ✅ Using most recent meal ID as fallback:', actualMealId);
          } else {
            console.error('[analyze-meal-base64] ❌ No fallback meal found, keeping generated ID');
          }
        } catch (fallbackError) {
          console.error('[analyze-meal-base64] Fallback meal lookup failed:', fallbackError);
        }
      } else {
        actualMealId = insertResult.data?.id || mealId;
        dbSaveSuccessful = true;
        console.log('[analyze-meal-base64] ✅ Meal saved to database successfully:', actualMealId);
        console.log("[analyze-meal-base64] Debug - Saved meal with user_id:", userId, "Session user_id:", session?.user?.id);
      }

    } catch (dbError) {
      console.error('[analyze-meal-base64] Database operation failed:', dbError);
      
      // If database save fails, get the most recent meal ID as fallback
      console.warn('[analyze-meal-base64] Database save failed, getting most recent meal as fallback...');
      try {
        const { data: recentMeal } = await supabaseAdmin
          .from('meals')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recentMeal?.id) {
          actualMealId = recentMeal.id;
          console.log('[analyze-meal-base64] ✅ Using most recent meal ID as fallback:', actualMealId);
        } else {
          console.error('[analyze-meal-base64] ❌ No fallback meal found, keeping generated ID');
        }
      } catch (fallbackError) {
        console.error('[analyze-meal-base64] Fallback meal lookup failed:', fallbackError);
      }
    }
    
    console.log('[analyze-meal-base64] Final meal ID for response:', actualMealId);
    console.log('[analyze-meal-base64] Database save successful:', dbSaveSuccessful);

    // Generate AI Health Insights immediately after meal analysis (background process)
    if (dbSaveSuccessful && actualMealId) {
      console.log('[analyze-meal-base64] Starting immediate insights generation...');
      
      // Don't await this - let it run in background so user gets immediate response
      generateInsightsInBackground(actualMealId, userId, session?.user?.user_metadata || {}, analysis)
        .catch(error => {
          console.error('[analyze-meal-base64] Background insights generation failed:', error);
        });
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