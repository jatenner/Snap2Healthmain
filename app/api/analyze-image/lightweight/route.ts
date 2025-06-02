import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { anonClient, adminClient } from '@/utils/supabase';
import { safeJsonParse } from '@/app/api/analyze-meal/json-fix';
import { safeStringify, sanitizeObject } from '@/utils/json-helpers';

// Constant test UUID for use when no authenticated user
const TEST_USER_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // Important for project-scoped keys
});

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'only-no-store';

/**
 * Lightweight image analysis API that uses minimal memory
 * This handles basic meal analysis without the heavy processing
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[api/analyze-image/lightweight] Processing request');
    
    // Get the request data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      console.error('[api/analyze-image/lightweight] No image file found in request');
      return NextResponse.json({
        success: false,
        error: 'No image file found',
        message: 'Please provide an image file'
      }, { status: 400 });
    }
    
    // Get authenticated user if available
    let userId = TEST_USER_UUID; // Use valid UUID for testing
    
    try {
      const { data: { user } } = await anonClient.auth.getUser();
      if (user) {
        userId = user.id;
        console.log(`[api/analyze-image/lightweight] Authenticated user: ${userId}`);
      }
    } catch (authError) {
      console.error('[api/analyze-image/lightweight] Auth error:', authError);
      console.log('[api/analyze-image/lightweight] Using test UUID:', userId);
    }
    
    // Convert image to buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Determine file extension from the image file
    const contentType = imageFile.type;
    let fileExtension = 'jpg'; // Default to jpg
    
    if (contentType.includes('png')) {
      fileExtension = 'png';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      fileExtension = 'jpg';
    } else if (contentType.includes('webp')) {
      fileExtension = 'webp';
    } else if (contentType.includes('gif')) {
      fileExtension = 'gif';
    }
    
    // Generate a unique filename
    const filename = `${Date.now()}.${fileExtension}`;
    
    console.log(`[api/analyze-image/lightweight] Image received, format: ${contentType}`);
    
    // Upload the image to Supabase Storage
    let imageUrl = '';
    try {
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('meal-images')
        .upload(filename, buffer, {
          contentType,
          cacheControl: '3600',
        });
        
      if (uploadError) {
        console.error('[api/analyze-image/lightweight] Error uploading to Supabase:', uploadError);
        // Continue with the local image as fallback
      } else if (uploadData) {
        const { data: urlData } = adminClient.storage
          .from('meal-images')
          .getPublicUrl(uploadData.path);
          
        imageUrl = urlData.publicUrl;
        console.log('[api/analyze-image/lightweight] Image uploaded to Supabase:', imageUrl);
      }
    } catch (storageError) {
      console.error('[api/analyze-image/lightweight] Storage error:', storageError);
      // Continue without storage - we'll use direct analysis
    }
    
    // Analyze the image with OpenAI
    try {
      console.log('[api/analyze-image/lightweight] Sending image to OpenAI for analysis');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert analyzing food images. Provide a brief but accurate assessment.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please analyze this food and provide nutritional information.' },
              { type: 'image_url', image_url: { url: imageFile ? `data:${contentType};base64,${buffer.toString('base64')}` : imageUrl } }
            ]
          }
        ],
        temperature: 0.7,
        top_p: 1.0,
        max_tokens: 500
      });
      
      const analysis = response.choices[0]?.message?.content || 'Unable to analyze the image';
      console.log('[api/analyze-image/lightweight] Analysis complete');
      
      // Parse basic info from the analysis (simple regex-based extraction)
      let calories = 0;
      const calorieMatch = analysis.match(/(\d+)(?:\s*-\s*\d+)?\s*calories/i);
      if (calorieMatch) {
        calories = parseInt(calorieMatch[1]);
      }
      
      // Extract protein, carbs, and fat if possible
      let protein = 0, carbs = 0, fat = 0;
      
      const proteinMatch = analysis.match(/protein:?\s*(\d+(?:\.\d+)?)/i);
      if (proteinMatch) protein = parseFloat(proteinMatch[1]);
      
      const carbsMatch = analysis.match(/carb(?:ohydrate)?s?:?\s*(\d+(?:\.\d+)?)/i);
      if (carbsMatch) carbs = parseFloat(carbsMatch[1]);
      
      const fatMatch = analysis.match(/fat:?\s*(\d+(?:\.\d+)?)/i);
      if (fatMatch) fat = parseFloat(fatMatch[1]);
      
      // Create a standardized meal analysis response
      const mealAnalysis = {
        mealName: 'Food Analysis',
        calories: calories || 0,
        macronutrients: [
          { name: "Protein", amount: protein, unit: "g", percentDailyValue: Math.round(protein / 50 * 100) },
          { name: "Carbs", amount: carbs, unit: "g", percentDailyValue: Math.round(carbs / 300 * 100) },
          { name: "Fat", amount: fat, unit: "g", percentDailyValue: Math.round(fat / 65 * 100) }
        ],
        micronutrients: [],
        insights: analysis
      };
      
      // Generate a unique ID for this meal analysis
      const mealId = crypto.randomUUID();
      
      // If user is authenticated, save the result to the database
      if (userId) {
        try {
          await adminClient.from('meals').insert({
            id: mealId,
            user_id: userId,
            meal_name: mealAnalysis.mealName,
            name: mealAnalysis.mealName,
            caption: mealAnalysis.mealName,
            calories: mealAnalysis.calories,
            analysis: mealAnalysis,
            image_url: imageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          console.log(`[api/analyze-image/lightweight] Saved meal analysis with ID: ${mealId}`);
        } catch (dbError) {
          console.error('[api/analyze-image/lightweight] Database error:', dbError);
          // Continue without DB save
        }
      }
      
      // Return the analysis results with a standardized format
      const responseData = {
        success: true,
        data: {
          imageUrl: imageUrl || 'direct-analysis',
          mealAnalysis,
          mealId,
          source: 'lightweight'
        }
      };
      
      // Sanitize to ensure no problematic JSON values
      return NextResponse.json(sanitizeObject(responseData));
      
    } catch (openaiError: any) {
      console.error('[api/analyze-image/lightweight] OpenAI error:', openaiError);
      
      // Provide a helpful error response
      return NextResponse.json({
        success: false,
        error: 'Image analysis failed',
        message: openaiError.message || 'Error analyzing the image with OpenAI'
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[api/analyze-image/lightweight] Unhandled error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Analysis templates for different goals

function getGeneralWellnessAnalysis() {
  return {
    mealName: "Pasta with Tomato Sauce",
    calories: "400-500",
    macronutrients: [
      { name: "Protein", amount: 15, unit: "g", percentDailyValue: 30 },
      { name: "Carbs", amount: 65, unit: "g", percentDailyValue: 22 },
      { name: "Fat", amount: 12, unit: "g", percentDailyValue: 18 }
    ],
    micronutrients: [
      { name: "Iron", amount: 2.5, unit: "mg", percentDailyValue: 14 },
      { name: "Calcium", amount: 120, unit: "mg", percentDailyValue: 12 },
      { name: "Vitamin C", amount: 15, unit: "mg", percentDailyValue: 17 }
    ],
    macroRatios: {
      proteinPercentage: 15,
      carbPercentage: 65,
      fatPercentage: 20
    },
    benefits: [
      "Good source of complex carbohydrates for energy",
      "Contains lycopene from tomatoes, an antioxidant",
      "Provides complete proteins when paired with cheese"
    ],
    concerns: [
      "Moderate in sodium if using prepared sauce",
      "Made with refined flour pasta (lower fiber content)",
      "May be lower in vegetables than ideal"
    ],
    suggestions: [
      "Add vegetables like spinach, zucchini, or bell peppers",
      "Choose whole grain pasta for increased fiber",
      "Pair with a side salad for additional nutrients"
    ],
    goalSpecificInsights: [
      "This meal provides balanced nutrition for general wellness",
      "The complex carbohydrates provide sustained energy",
      "Consider incorporating more vegetables for optimal nutrient intake"
    ]
  };
}

function getWeightLossAnalysis() {
  return {
    mealName: "Pasta with Tomato Sauce",
    calories: "400-500",
    macronutrients: [
      { name: "Protein", amount: 15, unit: "g", percentDailyValue: 30 },
      { name: "Carbs", amount: 65, unit: "g", percentDailyValue: 22 },
      { name: "Fat", amount: 12, unit: "g", percentDailyValue: 18 }
    ],
    micronutrients: [
      { name: "Iron", amount: 2.5, unit: "mg", percentDailyValue: 14 },
      { name: "Calcium", amount: 120, unit: "mg", percentDailyValue: 12 },
      { name: "Fiber", amount: 3, unit: "g", percentDailyValue: 12 }
    ],
    macroRatios: {
      proteinPercentage: 15,
      carbPercentage: 65,
      fatPercentage: 20
    },
    benefits: [
      "Moderate calorie content for portion size",
      "Contains protein for satiety and muscle maintenance",
      "Tomato-based sauce is lower in calories than cream-based alternatives"
    ],
    concerns: [
      "Higher in refined carbohydrates which may affect blood sugar",
      "Relatively high calorie density relative to volume",
      "Could be higher in fiber to increase fullness"
    ],
    suggestions: [
      "Reduce portion size and add more vegetables to maintain volume",
      "Use whole grain pasta to increase fiber and satiety",
      "Add lean protein like chicken or turkey for increased fullness"
    ],
    goalSpecificInsights: [
      "This meal is moderately calorie-dense for weight loss goals",
      "The refined carbohydrates may lead to quicker hunger return",
      "Consider reducing portion size by 1/3 and adding vegetables",
      "Pair with a large salad to increase volume without many calories"
    ]
  };
}

function getMuscleGainAnalysis() {
  return {
    mealName: "Pasta with Tomato Sauce",
    calories: "400-500",
    macronutrients: [
      { name: "Protein", amount: 15, unit: "g", percentDailyValue: 30 },
      { name: "Carbs", amount: 65, unit: "g", percentDailyValue: 22 },
      { name: "Fat", amount: 12, unit: "g", percentDailyValue: 18 }
    ],
    micronutrients: [
      { name: "Iron", amount: 2.5, unit: "mg", percentDailyValue: 14 },
      { name: "Calcium", amount: 120, unit: "mg", percentDailyValue: 12 },
      { name: "Magnesium", amount: 45, unit: "mg", percentDailyValue: 11 }
    ],
    macroRatios: {
      proteinPercentage: 15,
      carbPercentage: 65,
      fatPercentage: 20
    },
    benefits: [
      "Good source of carbohydrates for glycogen replenishment",
      "Provides some protein for muscle recovery",
      "Easy to digest and can be consumed before or after workouts"
    ],
    concerns: [
      "Protein content may be insufficient for optimal muscle building",
      "Limited in essential amino acids compared to animal proteins",
      "May lack adequate micronutrients for optimal recovery"
    ],
    suggestions: [
      "Add a protein source like chicken, meatballs, or whey protein",
      "Increase portion size for additional calories if bulking",
      "Add olive oil or cheese for healthy fats and additional calories"
    ],
    goalSpecificInsights: [
      "This meal provides good carbohydrates for muscle glycogen replenishment",
      "Add at least 20-25g more protein to support muscle protein synthesis",
      "Consider timing this meal within 1-2 hours after your workout",
      "For optimal recovery, ensure you're getting adequate total daily protein (1.6-2.2g/kg)"
    ]
  };
}

function getHeartHealthAnalysis() {
  return {
    mealName: "Pasta with Tomato Sauce",
    calories: "400-500",
    macronutrients: [
      { name: "Protein", amount: 15, unit: "g", percentDailyValue: 30 },
      { name: "Carbs", amount: 65, unit: "g", percentDailyValue: 22 },
      { name: "Fat", amount: 12, unit: "g", percentDailyValue: 18 }
    ],
    micronutrients: [
      { name: "Potassium", amount: 450, unit: "mg", percentDailyValue: 10 },
      { name: "Sodium", amount: 520, unit: "mg", percentDailyValue: 23 },
      { name: "Fiber", amount: 3, unit: "g", percentDailyValue: 12 }
    ],
    macroRatios: {
      proteinPercentage: 15,
      carbPercentage: 65,
      fatPercentage: 20
    },
    benefits: [
      "Tomatoes contain lycopene which has heart-protective properties",
      "Low in saturated fat compared to cream-based dishes",
      "Can be prepared with heart-healthy olive oil"
    ],
    concerns: [
      "Refined pasta may raise blood sugar and triglycerides",
      "Store-bought sauce can be high in sodium",
      "Limited in omega-3 fatty acids"
    ],
    suggestions: [
      "Use whole grain pasta which has more fiber and nutrients",
      "Add vegetables like spinach, bell peppers for more antioxidants",
      "Choose no-salt-added tomato sauce or make your own"
    ],
    goalSpecificInsights: [
      "This meal is moderately heart-healthy with the antioxidants from tomatoes",
      "Replace refined pasta with whole grain pasta to improve heart health",
      "Monitor sodium intake from the sauce, which impacts blood pressure",
      "Add plant proteins like beans or lentils for cholesterol-lowering effects"
    ]
  };
} 