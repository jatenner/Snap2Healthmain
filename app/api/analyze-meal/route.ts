import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { getFullUserProfile } from '../../lib/profile-server-utils';
import { analyzeMealWithOpenAI } from '../../lib/openai-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 120 seconds for OpenAI processing

// Validate environment variables
function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const errors: string[] = [];
  
  if (!supabaseUrl || supabaseUrl.includes('your_supabase_url')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  if (!supabaseKey || supabaseKey.includes('your_supabase_anon_key')) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }
  if (!serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  if (!openaiApiKey) {
    errors.push('OPENAI_API_KEY is not configured');
  }

  return { isValid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  console.log('[analyze-meal] POST handler called');
  
  // Validate environment configuration
  const { isValid, errors } = validateEnvironment();
  if (!isValid) {
    console.error('[analyze-meal] Environment validation failed:', errors);
    return NextResponse.json(
      { error: `Server configuration error: ${errors.join(', ')}` },
      { status: 503 }
    );
  }

  try {
    // Create authenticated Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Create admin client for database and storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: async (url, options: RequestInit = {}) => {
            const { signal: existingSignal, ...restOptions } = options;
            let timeoutSignal: AbortSignal | undefined;
            let combinedSignal: AbortSignal | undefined = (existingSignal === null) ? undefined : existingSignal;

            if (!combinedSignal || !combinedSignal.aborted) {
              const controller = new AbortController();
              timeoutSignal = controller.signal;
              setTimeout(() => controller.abort(), 15000); // Reduced from 30s to 15s for faster timeouts

              if (existingSignal) {
                // Combine signals if an external signal already exists
                const abortHandler = () => {
                  controller.abort();
                  existingSignal.removeEventListener('abort', abortHandler);
                };
                existingSignal.addEventListener('abort', abortHandler);
                
                // If existing signal is already aborted, abort immediately
                if (existingSignal.aborted) {
                    controller.abort();
                }
              }
              combinedSignal = timeoutSignal;
            }
            
            try {
              return await fetch(url, { ...restOptions, signal: combinedSignal });
            } catch (error) {
              // Simplified error handling for speed
              if (error instanceof Error && error.name === 'AbortError') {
                console.warn(`[supabaseAdmin fetch] Request timed out: ${url}`);
              }
              throw error;
            }
          }
        }
      }
    );

    // Verify authentication (skip in development mode)
    let session: import('@supabase/supabase-js').Session | null = null;
    let userId: string | null = null;
    let userProfile: any = null;

    if (process.env.NODE_ENV !== 'development') {
      const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[analyze-meal] Session error:', sessionError);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
      }

      if (!authSession) {
        console.log('[analyze-meal] No active session found');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      session = authSession;
      if (session && session.user) {
        userId = session.user.id;
        console.log('[analyze-meal] User authenticated:', userId);
        try {
          userProfile = await getFullUserProfile(userId);
          console.log('[analyze-meal] User profile fetched for authenticated user:', userProfile ? JSON.stringify(userProfile).substring(0,200) : 'null');
        } catch (profileError) {
          console.warn('[analyze-meal] Could not fetch profile for authenticated user:', profileError);
          userProfile = { id: userId, error: 'Profile fetch failed' };
        }
      }
    } else {
      // DEVELOPMENT MODE
      console.log('[analyze-meal] Development mode - attempting to get real user session first...');
      const { data: { session: devAuthSession }, error: devSessionError } = await supabase.auth.getSession();

      if (devAuthSession && !devSessionError) {
        userId = devAuthSession.user.id;
        console.log('[analyze-meal] Development mode - Real user session found:', userId);
        try {
          userProfile = await getFullUserProfile(userId);
          console.log('[analyze-meal] Development mode - User profile fetched:', userProfile ? JSON.stringify(userProfile).substring(0,200) : 'null');
        } catch (profileError) {
          console.warn('[analyze-meal] Development mode - Could not fetch real user profile:', profileError);
          // Fallback to mock if real profile fetch fails
          userProfile = null; 
        }
      } else {
        console.log('[analyze-meal] Development mode - No real user session found, or error occurred:', devSessionError?.message);
        userId = null; // No real user ID
      }

      // If real user profile couldn't be fetched or no session, use mock data
      if (!userProfile) {
        userId = '11111111-1111-1111-1111-111111111111'; // Mock user ID
        console.log('[analyze-meal] Development mode - Falling back to mock user ID:', userId);
        userProfile = {
          id: userId,
          age: 30,
          gender: 'male',
          weight: 225, 
          weight_unit: 'lb',
          height: 72,
          height_unit: 'in',
          activityLevel: 'moderate',
          goal: 'General Health',
          name: 'Dev User - Mock Profile (Fallback)'
        };
        console.log('[analyze-meal] Development mode - Using default mock profile (fallback):', JSON.stringify(userProfile).substring(0,200));
      }
    }

    // Ensure userProfile is at least an empty object if it ended up null
    if (!userProfile) {
      console.warn('[analyze-meal] User profile is unexpectedly null after auth/dev blocks. Defaulting to basic info.');
      userProfile = { id: userId || 'unknown-user', name: 'Fallback Profile' }; 
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mealName = (formData.get('mealName') as string) || 'Analyzed Meal';
    const goal = (formData.get('goal') as string) || userProfile?.goal || 'General Wellness';

    console.log('[analyze-meal] Form data parsed:', {
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

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Check file size (limit to 20MB for OpenAI)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Image file is too large. Please use an image smaller than 20MB.' },
        { status: 400 }
      );
    }

    console.log('[analyze-meal] File validation passed:', {
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('[analyze-meal] Image processed, size:', `${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Upload image to Supabase Storage
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    // Handle filename generation for both authenticated and development modes
    let filename;
    if (userId && userId !== 'null') {
      filename = `${userId}/${timestamp}-${randomId}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    } else {
      // Development mode - use a special development folder
      filename = `development/${timestamp}-${randomId}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    }
    
    console.log('[analyze-meal] Uploading image to storage:', filename);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('meal-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('[analyze-meal] Storage upload error:', uploadError);
      
      // Provide helpful error messages
      if (uploadError.message?.includes('bucket_not_found')) {
        return NextResponse.json(
          { error: 'Image storage is not configured. Please contact support.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('meal-images')
      .getPublicUrl(filename);

    console.log('[analyze-meal] Image uploaded successfully:', publicUrl);

    // Analyze image with OpenAI
    console.log('[analyze-meal] Starting OpenAI analysis...');
    let analysisResult;
    try {
      const analysisStartTime = Date.now();
      const { analyzeMealWithOpenAI } = await import('../../lib/openai-utils');
      analysisResult = await analyzeMealWithOpenAI(
        publicUrl, // Use the public URL instead of dataURI for better performance
        userProfile
      );
      const analysisEndTime = Date.now();
      console.log('[analyze-meal] OpenAI analysis completed in:', analysisEndTime - analysisStartTime, 'ms');
      
      // Simplified DV calculation - only if userProfile exists and has required data
      if (userProfile && userProfile.age && userProfile.gender && analysisResult) {
        try {
          const { calculatePersonalizedDV } = await import('../../lib/profile-utils');
          
          // Process macronutrients
          if (analysisResult.macronutrients && Array.isArray(analysisResult.macronutrients)) {
            analysisResult.macronutrients = analysisResult.macronutrients.map((nutrient: any) => {
              if (nutrient.amount && nutrient.amount > 0) {
                try {
                  const personalizedDV = calculatePersonalizedDV(nutrient, userProfile);
                  return {
                    ...nutrient,
                    percentDailyValue: personalizedDV !== null && personalizedDV > 0 ? Math.round(personalizedDV) : null
                  };
                } catch {
                  return nutrient;
                }
              }
              return nutrient;
            });
          }
          
          // Process micronutrients
          if (analysisResult.micronutrients && Array.isArray(analysisResult.micronutrients)) {
            analysisResult.micronutrients = analysisResult.micronutrients.map((nutrient: any) => {
              if (nutrient.amount && nutrient.amount > 0) {
                try {
                  const personalizedDV = calculatePersonalizedDV(nutrient, userProfile);
                  return {
                    ...nutrient,
                    percentDailyValue: personalizedDV !== null && personalizedDV > 0 ? Math.round(personalizedDV) : null
                  };
                } catch {
                  return nutrient;
                }
              }
              return nutrient;
            });
          }
          
          console.log('[analyze-meal] Daily values calculated successfully');
          
        } catch (importError) {
          console.log('[analyze-meal] Skipping DV% calculation due to import error');
        }
      }
      
    } catch (openaiError: any) {
      console.error('[analyze-meal] OpenAI analysis failed:', openaiError);
      
      // Provide specific error messages based on the type of OpenAI failure
      let errorMessage = 'Unable to analyze the meal image at this time';
      let userMessage = 'Please try uploading the image again.';
      
      if (openaiError.message?.includes('declined to analyze')) {
        errorMessage = 'AI Analysis Declined';
        userMessage = 'The AI was unable to analyze this specific image. Please try with a clearer photo that shows food items more distinctly. Ensure good lighting and that the food is clearly visible.';
      } else if (openaiError.message?.includes('invalid JSON')) {
        errorMessage = 'AI Response Format Error';
        userMessage = 'The AI analysis was incomplete. Please try again with the same image or a different photo.';
      } else if (openaiError.message?.includes('does not contain valid JSON')) {
        errorMessage = 'AI Analysis Incomplete';
        userMessage = 'The AI was unable to complete the analysis. Please try again or use a different image with clearer food visibility.';
      }
      
      // Return proper error response instead of fallback data
      return NextResponse.json(
        { 
          error: errorMessage,
          message: userMessage,
          details: 'No nutritional analysis will be provided without successful AI image recognition. This ensures you only receive accurate, real analysis of your specific meal.',
          retryable: true,
          noFallbackData: true
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Prepare the final response object structure that will be built upon
    const finalApiResponse = {
      success: true,
      message: 'Meal analysis pending', // Will be updated
      mealAnalysis: analysisResult, 
      mealContents: analysisResult, 
      userProfile: userProfile, 
      imageUrl: publicUrl, 
      mealId: null as string | null, 
    };

    // Attempt to save to DB if a userId is available (including '11111111-1111-1111-1111-111111111111')
    // Only skip for 'anonymous-user' or if userId is somehow null/undefined after initial checks.
    if (userId && userId !== 'anonymous-user') {
      console.log('[analyze-meal] Attempting to save meal to database for user:', userId);
      console.log('[analyze-meal] Data to be saved (first 200 chars of analysis):', JSON.stringify(analysisResult).substring(0, 200));

      try {
        // Ensure analysisResult has all expected fields, with defaults if necessary
        const ar = analysisResult || {}; // Use 'ar' for brevity

        const mealToInsert = {
          user_id: userId,
          meal_name: ar.mealName || 'Untitled Meal',
          image_url: publicUrl,
          goal: ar.goal || goal,
          // Populate top-level nutritional fields
          calories: ar.calories || 0,
          protein: ar.protein || 0,
          fat: ar.fat || 0,
          carbs: ar.carbs || 0,
          // Populate individual database columns from OpenAI analysis
          macronutrients: ar.macronutrients || [],
          micronutrients: ar.micronutrients || [],
          phytonutrients: ar.phytonutrients || [],
          ingredients: ar.ingredients || [],
          benefits: ar.benefits || [],
          concerns: ar.concerns || [],
          suggestions: ar.suggestions || [],
          expert_recommendations: ar.expertRecommendations || [],
          metabolic_insights: ar.metabolicInsights || '',
          foods_identified: ar.foods || [],
          health_score: ar.healthScore ? parseInt(String(ar.healthScore), 10) : null,
          meal_story: ar.mealStory || '',
          protein_quality_assessment: ar.proteinQualityAssessment || '',
          carbohydrate_quality_assessment: ar.carbohydrateQualityAssessment || '',
          fat_quality_assessment: ar.fatQualityAssessment || '',
          cooking_method_impact: ar.cookingMethod || '',
          sodium_impact: ar.sodiumImpact || '',
          processing_level_analysis: ar.processingLevelAnalysis || '',
          nutritional_narrative: ar.nutritionalNarrative || '',
          time_of_day_optimization: ar.timeOfDayOptimization || '',
          visual_analysis: ar.visualAnalysis || '',
          cooking_method: ar.cookingMethod || '',
          cultural_context: ar.culturalContext || '',
          meal_description: ar.mealDescription || ar.visualAnalysis || '',
          // Keep the analysis JSONB field for backward compatibility
          analysis: {
            mealName: ar.mealName || 'Untitled Meal',
            mealDescription: ar.mealDescription || ar.visualAnalysis || 'No caption',
            calories: ar.calories || 0,
            protein: ar.protein || 0,
            fat: ar.fat || 0,
            carbs: ar.carbs || 0,
            macronutrients: ar.macronutrients || [],
            micronutrients: ar.micronutrients || [],
            ingredients: ar.ingredients || [],
            foods_identified: ar.foods || [],
            benefits: ar.benefits || [],
            concerns: ar.concerns || [],
            suggestions: ar.suggestions || [],
            health_score: ar.healthScore ? parseInt(String(ar.healthScore), 10) : null,
            meal_story: ar.mealStory || '',
            nutritional_narrative: ar.nutritionalNarrative || '',
            time_of_day_optimization: ar.timeOfDayOptimization || '',
            visual_analysis: ar.visualAnalysis || '',
            cooking_method_impact: ar.cookingMethod,
            cultural_context: ar.culturalContext || '',
            protein_quality_assessment: ar.proteinQualityAssessment || '',
            carbohydrate_quality_assessment: ar.carbohydrateQualityAssessment || '',
            fat_quality_assessment: ar.fatQualityAssessment || '',
            sodium_impact: ar.sodiumImpact || '',
            processing_level_analysis: ar.processingLevelAnalysis || '',
            phytonutrients: ar.phytonutrients || [],
            expert_recommendations: ar.expertRecommendations || [],
            metabolic_insights: ar.metabolicInsights || '',
            personalized_health_insights: ar.personalizedHealthInsights || '',
            goal: ar.goal || goal, // Ensure goal is in analysis, prioritize from OpenAI, fallback to form/profile goal
          }
        };
        
        console.log('[analyze-meal] 🧐 ANALYSIS RESULT (source for mealToInsert):', JSON.stringify(ar, null, 2));
        console.log('[analyze-meal] 📊 DATABASE COLUMN MAPPING:');
        console.log('  - macronutrients:', ar.macronutrients?.length || 0, 'items');
        console.log('  - micronutrients:', ar.micronutrients?.length || 0, 'items');
        console.log('  - expert_recommendations:', ar.expertRecommendations?.length || 0, 'items');
        console.log('  - benefits:', ar.benefits?.length || 0, 'items');
        console.log('  - concerns:', ar.concerns?.length || 0, 'items');
        console.log('  - suggestions:', ar.suggestions?.length || 0, 'items');
        console.log('  - foods_identified:', ar.foods?.length || 0, 'items');
        console.log('  - metabolic_insights:', ar.metabolicInsights ? 'present' : 'missing');
        console.log('[analyze-meal] 💾 FINAL MEAL TO INSERT (to meals):', JSON.stringify(mealToInsert, null, 2));

        const { data: mealInsert, error: mealError } = await supabaseAdmin
          .from('meals')
          .insert(mealToInsert)
          .select() // Important to get the inserted row back, especially the ID
          .single(); // Expecting a single row

        if (mealError) {
          console.error('[analyze-meal] Database insert error:', mealError);
          finalApiResponse.message = `Analysis complete, but failed to save to database: ${mealError.message}`;
          // Do not set success to false here, as analysis itself was successful.
          // The frontend can decide how to handle a failed save.
        } else if (mealInsert) {
          console.log('[analyze-meal] Meal saved to database successfully:', mealInsert);
          finalApiResponse.mealId = mealInsert.id; // Store the new meal ID
          finalApiResponse.message = 'Meal analyzed and saved successfully!';
        } else {
          console.warn('[analyze-meal] Database insert returned no data and no error.');
          finalApiResponse.message = 'Analysis complete, but database save status unclear.';
        }
      } catch (dbError: any) {
        console.error('[analyze-meal] Critical error during database operation:', dbError);
        finalApiResponse.message = `Analysis complete, but critical error during database save: ${dbError.message}`;
      }
    } else {
      // Case for 'anonymous-user' or if userId somehow became null (should be rare now)
      console.log('[analyze-meal] User ID is anonymous or missing. Skipping database save.');
      finalApiResponse.mealId = `local-${uuidv4()}`; // Generate a local temp ID
      finalApiResponse.message = 'Meal analysis complete (local mode - not saved to database).';
    }

    // Final response with all details
    console.log('[analyze-meal] Final API response (mealId:', finalApiResponse.mealId + '):', JSON.stringify(finalApiResponse).substring(0, 300) + '...');
    return NextResponse.json(finalApiResponse, { status: 200 });

  } catch (error: any) {
    console.error('[analyze-meal] Unexpected error:', error);
    
    // In development, return detailed error information
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Development error details',
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request' },
      { status: 500 }
    );
  }
} 