import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { anonClient } from '@/utils/supabase';
import OpenAI from 'openai';
import { safeJsonParse } from '@/app/api/analyze-meal/json-fix';
import { safeStringify, sanitizeObject } from '@/utils/json-helpers';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Updated analyze-image API endpoint that uses actual OpenAI API
 * without falling back to mock data.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log(`[analyze-image/unified] Request received at ${new Date().toISOString()}`);
  
  try {
    // Parse the request
    const body = await req.json();
    const { imageUrl, goal = 'General Wellness' } = body;
    
    if (!imageUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'No image URL provided' 
      }, { status: 400 });
    }
    
    // Try to get the authenticated user
    let userId: string | null = null;
    let userProfile: any = null;
    try {
      const { data: { user } } = await anonClient.auth.getUser();
      if (user) {
        userId = user.id;
        console.log(`[analyze-image/unified] Authenticated user: ${userId}`);
        
        // Get user profile for personalized analysis
        const { data: profileData } = await anonClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileData) {
          userProfile = profileData;
          console.log('[analyze-image/unified] Retrieved user profile for personalization');
        }
      } else {
        console.log('[analyze-image/unified] No authenticated user found');
      }
    } catch (authError) {
      console.error('[analyze-image/unified] Auth error:', authError);
      // Continue without user authentication
    }
    
    // Create a unique ID for this analysis
    const mealId = uuidv4();
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('[analyze-image/unified] OPENAI_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        success: false, 
        error: 'OpenAI API key not configured',
        errorDetails: 'The server is missing the OpenAI API key configuration'
      }, { status: 500 });
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Extract user preferences from profile for personalized analysis
    const healthGoals = userProfile?.health_goals || goal || 'General Wellness';
    const dietaryRestrictions = userProfile?.dietary_restrictions || [];
    const healthConditions = userProfile?.health_conditions || [];
    
    // Construct the prompt
    const prompt = `
      Analyze this food image and provide detailed nutritional information.
      ${healthGoals ? `The user's health goal is: ${healthGoals}.` : ''}
      ${dietaryRestrictions.length > 0 ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
      ${healthConditions.length > 0 ? `Health conditions to consider: ${healthConditions.join(', ')}` : ''}
      
      Please identify:
      1. What food items are in the image (be specific like "lasagna with ground beef" not just "pasta dish")
      2. Estimated calories and macronutrients (protein, carbs, fat)
      3. Key micronutrients present in significant amounts
      4. Any nutritional benefits based on the user's goals
      5. Any nutritional concerns based on the user's goals
      6. Suggestions for healthier alternatives or improvements
      
      Format your response as JSON with these properties:
      {
        "mealName": "specific name of the meal",
        "detectedFood": "detailed description of what you see",
        "calories": number,
        "macronutrients": [
          {"name": "Protein", "amount": number, "unit": "g", "percentDailyValue": number},
          {"name": "Carbs", "amount": number, "unit": "g", "percentDailyValue": number},
          {"name": "Fat", "amount": number, "unit": "g", "percentDailyValue": number}
        ],
        "micronutrients": [
          {"name": "nutrient name", "amount": number, "unit": "unit", "percentDailyValue": number}
        ],
        "benefits": ["benefit 1", "benefit 2"],
        "concerns": ["concern 1", "concern 2"],
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
      }
    `;
    
    // Call OpenAI API with vision model
    console.log('[analyze-image/unified] Calling OpenAI API with vision model');
    
    const openaiResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_GPT_VISION || "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });
    
    // Parse the response
    const responseText = openaiResponse.choices[0]?.message?.content || '';
    console.log('[analyze-image/unified] Received response from OpenAI');
    
    // Extract JSON from the response
    let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                   responseText.match(/{[\s\S]*}/);
    
    let analysisData;
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[0].startsWith('```') ? jsonMatch[1] : jsonMatch[0];
        // Use our safe JSON parse utility instead of the standard JSON.parse
        analysisData = safeJsonParse(jsonStr, {
          mealName: "Food Analysis",
          detectedFood: "Unable to detect food items",
          calories: 0,
          macronutrients: [],
          micronutrients: [],
          benefits: [],
          concerns: [],
          suggestions: []
        });
      } catch (e) {
        console.error('[analyze-image/unified] Error parsing JSON from OpenAI response:', e);
        // Create a fallback response rather than throwing
        analysisData = {
          mealName: "Food Analysis",
          detectedFood: "Failed to parse AI analysis",
          calories: 0,
          macronutrients: [],
          micronutrients: [],
          benefits: [],
          concerns: [],
          suggestions: [],
          rawResponse: responseText.substring(0, 500) // Include part of the raw response for debugging
        };
      }
    } else {
      console.error('[analyze-image/unified] No JSON found in OpenAI response');
      // Create a fallback response rather than throwing
      analysisData = {
        mealName: "Food Analysis",
        detectedFood: "No structured data found in response",
        calories: 0,
        macronutrients: [],
        micronutrients: [],
        benefits: [],
        concerns: [],
        suggestions: [],
        rawResponse: responseText.substring(0, 500) // Include part of the raw response for debugging
      };
    }
    
    // If we have a userId, try to save to database
    if (userId) {
      try {
        const { error } = await anonClient
          .from('meals')
          .insert({
            id: mealId,
            user_id: userId,
            caption: analysisData.mealName,
            name: analysisData.mealName,
            meal_name: analysisData.mealName,
            detected_food: analysisData.detectedFood,
            image_url: imageUrl,
            analysis: analysisData,
            calories: analysisData.calories || 0,
            goal: goal,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('[analyze-image/unified] Error saving to database:', error);
        } else {
          console.log(`[analyze-image/unified] Saved to database with ID: ${mealId}`);
        }
      } catch (dbError) {
        console.error('[analyze-image/unified] Database error:', dbError);
        // Continue without database storage
      }
    }
    
    // Return the analysis
    const resultResponse = {
      success: true,
      mealId,
      imageUrl,
      mealAnalysis: analysisData // Wrap the analysis data in "mealAnalysis" to match other endpoints
    };
    
    // Log completion
    const endTime = Date.now();
    console.log(`[analyze-image/unified] Request completed in ${endTime - startTime}ms`);
    
    // Safely prepare the response data - use sanitizeObject for deeper sanitization
    const safeResponse = sanitizeObject(resultResponse);
    return NextResponse.json(safeResponse);
  } catch (error) {
    console.error('[analyze-image/unified] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze image',
      errorDetails: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 