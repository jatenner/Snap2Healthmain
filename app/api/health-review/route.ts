import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Make the route dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Helper functions for reviews and suggestions
const getFallbackReview = (profile: any = null): string => {
  if (profile) {
    return `Based on your profile, we recommend focusing on balanced nutrition. Consider your dietary needs and goals.`;
  }
  return 'This meal appears to be reasonably balanced, but without detailed analysis, we recommend focusing on portion control and including a variety of food groups.';
};

const getDefaultSuggestions = (profile: any = null): string[] => {
  const baseSuggestions = [
    'Include a variety of vegetables and fruits for essential vitamins and minerals',
    'Stay hydrated by drinking water throughout the day',
    'Limit processed foods and added sugars',
    'Consider the timing of your meals for optimal energy levels'
  ];
  
  if (profile?.goal) {
    if (profile.goal.toLowerCase().includes('weight loss')) {
      baseSuggestions.push('Create a moderate caloric deficit through portion control');
      baseSuggestions.push('Include protein with each meal to help preserve muscle mass');
    } else if (profile.goal.toLowerCase().includes('muscle')) {
      baseSuggestions.push('Ensure adequate protein intake to support muscle growth');
      baseSuggestions.push('Include complex carbohydrates to fuel workouts');
    } else if (profile.goal.toLowerCase().includes('health')) {
      baseSuggestions.push('Focus on nutrient-dense whole foods');
      baseSuggestions.push('Consider incorporating more plant-based options into your diet');
    }
  }
  
  return baseSuggestions;
};

/**
 * Advanced health insights generator that creates personalized, science-backed meal analysis
 * in the style of Peter Attia and Andrew Huberman.
 */
const generatePersonalizedInsights = (
  nutrients: any, 
  profile: any, 
  goal: string = 'General Wellness',
  mealName: string = 'This meal'
): string => {
  if (!nutrients) {
    return getFallbackReview(profile);
  }

  // Extract meal data
  const calories = nutrients.calories || 0;
  const macros = nutrients.macronutrients || [];
  const micros = nutrients.micronutrients || [];

  // Extract profile data
  const age = profile?.age || 35;
  const gender = profile?.gender || 'Not specified';
  const userGoal = profile?.goal || goal || 'General Wellness';
  const activityLevel = profile?.activity_level || 'Moderate';

  // Extract key macronutrients
  const protein = macros.find((m: any) => m.name?.toLowerCase()?.includes('protein')) || { amount: 0, unit: 'g' };
  const carbs = macros.find((m: any) => 
    m.name?.toLowerCase()?.includes('carb') || 
    m.name?.toLowerCase()?.includes('carbohydrate')
  ) || { amount: 0, unit: 'g' };
  const fat = macros.find((m: any) => m.name?.toLowerCase()?.includes('fat')) || { amount: 0, unit: 'g' };
  const fiber = macros.find((m: any) => m.name?.toLowerCase()?.includes('fiber')) || { amount: 0, unit: 'g' };

  // Extract key micronutrients
  const potassium = micros.find((m: any) => m.name?.toLowerCase()?.includes('potassium')) || null;
  const sodium = micros.find((m: any) => m.name?.toLowerCase()?.includes('sodium')) || null;
  const vitaminC = micros.find((m: any) => m.name?.toLowerCase()?.includes('vitamin c')) || null;
  const vitaminD = micros.find((m: any) => m.name?.toLowerCase()?.includes('vitamin d')) || null;
  const vitaminE = micros.find((m: any) => m.name?.toLowerCase()?.includes('vitamin e')) || null;
  const calcium = micros.find((m: any) => m.name?.toLowerCase()?.includes('calcium')) || null;
  const iron = micros.find((m: any) => m.name?.toLowerCase()?.includes('iron')) || null;
  const magnesium = micros.find((m: any) => m.name?.toLowerCase()?.includes('magnesium')) || null;
  const zinc = micros.find((m: any) => m.name?.toLowerCase()?.includes('zinc')) || null;
  const omega3 = micros.find((m: any) => 
    m.name?.toLowerCase()?.includes('omega-3') || 
    m.name?.toLowerCase()?.includes('omega 3')
  ) || null;

  // Find notable nutrients (high or low levels)
  const highMicros = micros.filter((m: any) => m.percentDailyValue && m.percentDailyValue >= 25);
  const lowButImportantMicros = micros.filter((m: any) => 
    m.percentDailyValue && 
    m.percentDailyValue < 15 && 
    ['vitamin d', 'magnesium', 'vitamin b12', 'zinc', 'iron', 'calcium'].some(
      nutrient => m.name.toLowerCase().includes(nutrient)
    )
  );

  // Start building the insights
  let insights = `${mealName} provides ${calories} calories, composed of ${protein.amount}${protein.unit} protein, ${carbs.amount}${carbs.unit} carbohydrates, and ${fat.amount}${fat.unit} fat. `;

  // Add macronutrient analysis
  if (protein.amount > 0) {
    if (userGoal.toLowerCase().includes('muscle') || userGoal.toLowerCase().includes('strength')) {
      insights += `The ${protein.amount}g of protein (${protein.percentDailyValue || '~'}% DV) supports muscle protein synthesis, essential for recovery and growth. Protein's thermic effect also means ~25-30% of its calories are expended during digestion and assimilation. `;
    } else if (userGoal.toLowerCase().includes('weight loss')) {
      insights += `The protein content (${protein.amount}g) is advantageous for your weight management goal as it promotes satiety, preserves lean mass during caloric restriction, and has a high thermic effect—requiring more energy to digest than carbohydrates or fats. `;
    } else {
      insights += `The protein content supports tissue repair and immune function while promoting satiety through GLP-1 and PYY hormone stimulation. `;
    }
  }

  if (carbs.amount > 0) {
    if (fiber && fiber.amount > 5) {
      insights += `The meal contains ${fiber.amount}g of fiber (${fiber.percentDailyValue || '~'}% DV), which supports gut microbiome diversity, slows glucose absorption to moderate insulin response, and enhances satiety through increased intestinal transit time. `;
    } else if (fiber && fiber.amount > 0) {
      insights += `With ${fiber.amount}g of fiber, this meal provides some gut-supportive benefits, though adding more fiber-rich foods would further support your microbiome and metabolic health. `;
    } else {
      insights += `The meal is relatively low in fiber—consider adding vegetables, legumes, or whole grains to improve gut health and glycemic response. `;
    }
  }

  if (fat.amount > 0) {
    if (omega3) {
      insights += `The presence of omega-3 fatty acids is notable as they support cognitive function through neuronal membrane fluidity and exhibit anti-inflammatory effects via specialized pro-resolving mediators (SPMs). `;
    } else {
      insights += `Consider the fatty acid composition of this meal—a balance of monounsaturated and polyunsaturated fats supports metabolic flexibility and cell membrane integrity. `;
    }
  }

  // Add micronutrient insights based on goal
  if (highMicros.length > 0) {
    insights += `This meal is particularly rich in ${highMicros.slice(0, 3).map((m: any) => m.name).join(', ')}, providing ${highMicros[0].percentDailyValue}% of your daily ${highMicros[0].name} needs. `;
    
    // Add physiological context for high-value micronutrients
    for (const micro of highMicros.slice(0, 2)) {
      if (micro.name.toLowerCase().includes('vitamin c')) {
        insights += `Vitamin C functions as a cofactor in collagen synthesis and serves as an electron donor in enzymatic reactions, while also supporting immune function through enhanced neutrophil migration and phagocytosis. `;
      } else if (micro.name.toLowerCase().includes('iron')) {
        insights += `Iron is crucial for oxygen transport via hemoglobin, cellular energy production in the electron transport chain, and serves as a cofactor in numerous enzymatic reactions including DNA synthesis. `;
      } else if (micro.name.toLowerCase().includes('zinc')) {
        insights += `Zinc supports immune function through T-cell development and acts as a cofactor for over 300 enzymes involved in metabolism, digestion, and nerve function. `;
      } else if (micro.name.toLowerCase().includes('potassium')) {
        insights += `Potassium regulates neuromuscular function through maintenance of membrane potential and works antagonistically with sodium to modulate blood pressure through effects on vascular smooth muscle tone. `;
      } else if (micro.name.toLowerCase().includes('calcium')) {
        insights += `Calcium extends beyond bone health to regulate muscle contraction, nerve impulse transmission, and serves as a second messenger in cellular signaling pathways. `;
      }
    }
  }

  // Add goal-specific insights
  if (userGoal.toLowerCase().includes('weight loss')) {
    insights += `For your weight management goal, this meal's protein-to-carbohydrate ratio and fiber content are particularly relevant as they influence metabolic rate, satiety signaling, and insulin sensitivity. Consider that a modest caloric deficit of 300-500 calories daily supports sustainable fat loss while minimizing adaptive thermogenesis. `;
    
    if (sodium && sodium.percentDailyValue > 20) {
      insights += `Note the sodium content (${sodium.percentDailyValue}% DV) may contribute to water retention, potentially masking fat loss on the scale despite progress in body composition. `;
    }
  } else if (userGoal.toLowerCase().includes('muscle') || userGoal.toLowerCase().includes('strength')) {
    insights += `For muscle development, timing protein intake around resistance training can optimize the anabolic response, though total daily protein intake of 1.6-2.2g/kg bodyweight remains the primary driver of muscle protein synthesis. `;
    
    if (calcium) {
      insights += `Calcium's role extends beyond bone health to muscle contraction mechanics, specifically in cross-bridge cycling between actin and myosin filaments. `;
    }
    
    if (magnesium) {
      insights += `Magnesium (${magnesium.percentDailyValue}% DV) supports energy production, protein synthesis, and muscle relaxation through calcium channel regulation. `;
    }
  } else if (userGoal.toLowerCase().includes('energy') || userGoal.toLowerCase().includes('fatigue')) {
    insights += `For optimal energy levels, this meal's composition affects both immediate energy availability through blood glucose regulation and longer-term cellular energy production. `;
    
    if (iron) {
      insights += `Iron's role in oxygen transport directly impacts cellular respiration and mitochondrial ATP production, essential for consistent energy levels. `;
    }
    
    const vitaminB12 = micros.find((m: any) => m.name?.toLowerCase()?.includes('b12'));
    if (vitaminB12) {
      insights += `Vitamin B12 is essential for mitochondrial function and red blood cell formation, supporting oxygen delivery to tissues. `;
    }
  } else if (userGoal.toLowerCase().includes('cognition') || userGoal.toLowerCase().includes('brain')) {
    insights += `This meal's composition influences cognitive function through neuronal energy metabolism, neurotransmitter synthesis, and long-term brain health. `;
    
    if (omega3) {
      insights += `Omega-3 fatty acids support synaptic plasticity and neuronal membrane integrity, fundamental to cognitive processing and neurogenesis. `;
    }
    
    if (vitaminE) {
      insights += `Vitamin E acts as a neuroprotective antioxidant, shielding neuronal membranes from oxidative damage and supporting mitochondrial function in brain cells. `;
    }
  } else if (userGoal.toLowerCase().includes('longevity') || userGoal.toLowerCase().includes('aging')) {
    insights += `From a longevity perspective, this meal's nutrient composition influences multiple hallmarks of aging including proteostasis, nutrient sensing, mitochondrial function, and cellular resilience. `;
    
    if (fiber && fiber.amount > 5) {
      insights += `The fiber content supports gut microbial diversity, which influences systemic inflammation, immune function, and metabolite production—all linked to biological aging processes. `;
    }
    
    if (highMicros.length > 3) {
      insights += `The diverse micronutrient profile supports cellular defense mechanisms and metabolic efficiency, potentially contributing to compression of morbidity. `;
    }
  }

  // Add any cautions or improvements
  if (lowButImportantMicros.length > 0) {
    insights += `Consider that this meal is relatively low in ${lowButImportantMicros.map((m: any) => m.name).join(', ')}, which ${lowButImportantMicros.length > 1 ? 'are' : 'is'} important for ${userGoal.toLowerCase()}. `;
  }

  if (sodium && sodium.percentDailyValue > 30) {
    insights += `The sodium content (${sodium.percentDailyValue}% DV) is notable—chronically elevated sodium intake can influence vascular health through mechanisms beyond just fluid balance, including endothelial function and nitric oxide availability. `;
  }

  // Add a holistic conclusion
  insights += `Overall, this meal ${highMicros.length > 2 ? 'provides excellent nutrient density' : 'offers specific nutritional benefits'} and could be ${lowButImportantMicros.length > 0 ? 'enhanced with additional nutrients' : 'well-incorporated into your dietary pattern'}. Remember that nutritional context matters—consider this meal within your broader dietary pattern, lifestyle factors, and specific physiological needs.`;

  return insights;
};

// Fix URL construction by ensuring absolute URL
const getAbsoluteUrl = (path: string): string => {
  // Check if it's already absolute
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Create absolute URL using the base URL from environment variables or fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

// Add a function to get meal data from database by ID using the new meal_analyses table
const getMealFromDatabase = async (supabase: any, mealId: string) => {
  try {
    console.log(`[HealthReview] Fetching meal data for ID: ${mealId}`);
    
    // First try the newer meal_analyses table with JSONB data
    const { data, error } = await supabase
      .from('meal_analyses')
      .select('*')
      .eq('id', mealId)
      .maybeSingle();
    
    if (error) {
      if (!error.message.includes('does not exist')) {
        console.log(`[HealthReview] Error fetching from meal_analyses: ${error.message}`);
      }
    } else if (data) {
      console.log('[HealthReview] Found meal in meal_analyses table');
      // If data is in the JSONB column, use that
      if (data.data && typeof data.data === 'object') {
        // Extract nutrients from JSONB data for easier access
        const extractedData = {
          ...data,
          // Extract key fields from JSONB for easier access
          nutrients: data.data.nutrients || data.data,
          analysis: data.data.analysis || data.data,
          mealName: data.name || data.data.caption || data.data.mealName || 'Analyzed Meal',
          caption: data.data.caption || data.data.dish_name || data.name,
          detectedFood: data.data.detectedFood || data.data.detected_food,
          goal: data.data.goal || 'General Wellness'
        };
        return extractedData;
      }
      return data;
    }
    
    // As a backup, try the original meals table
    console.log(`[HealthReview] Trying backup query for ID: ${mealId}`);
    const { data: mealsData, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .maybeSingle();
    
    if (mealsError) {
      console.log(`[HealthReview] Backup query also failed for ID: ${mealId}, error: ${mealsError.message}`);
      
      // Check if this is a UUID format issue - try different ID formats if needed
      if (mealsError.message.includes('invalid input syntax for type uuid')) {
        console.log('[HealthReview] UUID format issue detected, trying alternative formats');
        
        // If mealId has a "meal-" prefix, try extracting just the numeric part
        if (mealId.startsWith('meal-')) {
          const numericPart = mealId.replace('meal-', '');
          console.log(`[HealthReview] Trying numeric part as ID: ${numericPart}`);
          
          const { data: numericData, error: numericError } = await supabase
            .from('meal_analyses')
            .select('*')
            .ilike('id', `%${numericPart}%`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (!numericError && numericData) {
            console.log('[HealthReview] Found meal using numeric ID part');
            return numericData;
          }
        }
      }
      
      return null;
    }
    
    return mealsData;
  } catch (error) {
    console.error(`[HealthReview] Exception in getMealFromDatabase: ${error}`);
    return null;
  }
};

// Add a fallback data generator for when the meal is not found in database
function generateFallbackHealthReview(mealId: string): any {
  console.log('[HealthReview] Generating fallback data for meal ID:', mealId);
  
  return {
    id: mealId,
    mealId: mealId,
    mealName: "Analysis in Progress...",
    reviewContent: [
      {
        type: "paragraph",
        content: "Your food analysis is being processed. Please wait a moment for the complete analysis."
      },
      {
        type: "paragraph",
        content: "This may take a few seconds as we prepare your personalized nutritional feedback."
      }
    ],
    suggestions: [
      "Check back in a moment to see your complete nutritional analysis",
      "Your meal data is still being processed"
    ],
    status: "processing",
    timestamp: new Date().toISOString(),
    success: true,
    isFallback: true
  };
}

// When fetching from analyze-meal API, add better error handling 
async function fetchFromAnalyzeMealApi(mealId: string): Promise<any> {
  try {
    console.log('[HealthReview] Attempting to fetch from analyze-meal API for ID:', mealId);
    
    // Construct URL (prefer absolute URL for more reliable server-side fetching)
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/analyze-meal?id=${mealId}`;
    
    console.log('[HealthReview] Fetching from URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error: any) {
    console.log('[HealthReview] Error constructing URL:', error);
    
    // Try a fallback URL construction
    try {
      const fallbackUrl = `http://localhost:3000/api/analyze-meal?id=${mealId}`;
      console.log('[HealthReview] Trying fallback URL construction:', fallbackUrl);
      
      const fallbackResponse = await fetch(fallbackUrl);
      
      if (!fallbackResponse.ok) {
        throw new Error(`API error: ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      return fallbackData;
    } catch (fallbackError) {
      console.log('[HealthReview] Error fetching from analyze-meal API:', fallbackError);
      
      // Return a fallback response so the UI doesn't break
      return generateFallbackHealthReview(mealId);
    }
  }
}

// Helper function to save/update insights in the database
const saveInsightsToDatabase = async (supabase: any, mealId: string, insights: string): Promise<boolean> => {
  try {
    console.log(`[HealthReview] Saving insights to database for meal ID: ${mealId}`);
    
    // Create update data with insights and timestamp
    const updateData = {
      insights: insights,
      updated_at: new Date().toISOString()
    };
    
    // Try approach 1: Update using the dedicated insights column with updated_at timestamp
    try {
      const { error: insightsError } = await supabase
        .from('meal_analyses')
        .update(updateData)
        .eq('id', mealId);
        
      if (!insightsError) {
        console.log(`[HealthReview] Successfully updated insights with dedicated column`);
        return true;
      }
        
      console.log(`[HealthReview] Error updating insights with timestamp:`, insightsError.message);
        
      // Approach 2: If updated_at causes issues, try without it
      if (insightsError.message.includes('updated_at') || insightsError.code === 'PGRST204') {
        console.log(`[HealthReview] Trying fallback update without updated_at field`);
          
        const { error: fallbackError } = await supabase
          .from('meal_analyses')
          .update({ insights: insights })
          .eq('id', mealId);
            
        if (!fallbackError) {
          console.log(`[HealthReview] Successfully updated insights without updated_at timestamp`);
          return true;
        }
            
        console.log(`[HealthReview] Fallback update also failed:`, fallbackError.message);
            
        // Approach 3: Try patching the data JSONB field as last resort
        try {
          console.log(`[HealthReview] Attempting JSONB data field update as last resort`);
            
          // First get current data
          const { data: mealData, error: getMealError } = await supabase
            .from('meal_analyses')
            .select('data')
            .eq('id', mealId)
            .maybeSingle();
              
          if (getMealError || !mealData || !mealData.data) {
            console.log(`[HealthReview] Failed to get meal data for JSONB update:`, getMealError?.message);
                
            // Approach 4: If we can't get existing data, try a full replacement with minimal data
            try {
              console.log('[HealthReview] Attempting minimal data insert as final fallback');
              const minimalData = {
                id: mealId,
                data: { insights: insights },
                updated_at: new Date().toISOString()
              };
                  
              const { error: minimalError } = await supabase
                .from('meal_analyses')
                .upsert(minimalData);
                  
              if (!minimalError) {
                console.log('[HealthReview] Successfully saved insights via minimal upsert');
                return true;
              }
                  
              console.log('[HealthReview] Minimal upsert also failed:', minimalError.message);
              return false;
            } catch (e) {
              console.log('[HealthReview] Error in minimal upsert attempt:', e);
              return false;
            }
          }
              
          // Merge insights into existing data
          const existingData = typeof mealData.data === 'string' 
            ? JSON.parse(mealData.data) 
            : mealData.data;
              
          const updatedData = {
            ...existingData,
            insights: insights
          };
              
          const { error: jsonUpdateError } = await supabase
            .from('meal_analyses')
            .update({ data: updatedData })
            .eq('id', mealId);
              
          if (jsonUpdateError) {
            console.log(`[HealthReview] JSONB update failed:`, jsonUpdateError.message);
            return false;
          }
              
          console.log(`[HealthReview] Successfully updated insights via JSONB data field`);
          return true;
        } catch (jsonError) {
          console.log(`[HealthReview] Error in JSONB update attempt:`, jsonError);
          return false;
        }
      }
        
      // Other type of error not related to schema
      console.log(`[HealthReview] Unknown error type during update:`, insightsError);
      return false;
    } catch (e: any) {
      console.log(`[HealthReview] Exception updating insights:`, e.message);
      return false;
    }
  } catch (e: any) {
    console.log(`[HealthReview] Top-level exception in saveInsightsToDatabase:`, e.message);
    return false;
  }
};

// Main GET handler - fetch meal data and generate health insights
export async function GET(request: NextRequest) {
  // Start tracking execution time for performance monitoring
  const startTime = Date.now();
  
  try {
    // Parse meal ID from query parameter
    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get('mealId') || searchParams.get('id');
    
    // Validate mealId parameter
    if (!mealId) {
      console.warn('[HealthReview] Missing mealId/id parameter');
      return new Response(
        JSON.stringify({
          error: 'Missing required parameter: mealId or id',
          success: false
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[HealthReview] Processing request for meal ID: ${mealId}`);
    
    // Create a route handler client that has access to auth cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Try to get user ID from Supabase auth session
    let userId: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
      console.log(`[HealthReview] User authentication status: ${userId ? 'Authenticated' : 'Anonymous'}`);
    } catch (authError) {
      console.warn('[HealthReview] Error getting auth session:', authError);
      // Continue without auth - we'll still try to get the meal data
    }
    
    // Try to get the meal data from the database
    let meal = await getMealFromDatabase(supabase, mealId);
    
    // If meal not found, try to fetch from analyze-meal API as a fallback
    if (!meal) {
      console.log(`[HealthReview] Meal not found in database, trying analyze-meal API as fallback...`);
      const apiData = await fetchFromAnalyzeMealApi(mealId);
      
      if (apiData) {
        console.log('[HealthReview] Successfully retrieved data from analyze-meal API');
        meal = apiData;
        
        // Try to save this data to the database for future requests
        try {
          console.log('[HealthReview] Attempting to save meal data to database from API response');
          await saveInsightsToDatabase(supabase, mealId, generatePersonalizedInsights(meal.nutrients, meal.profile, meal.goal, meal.mealName));
        } catch (saveError) {
          console.warn('[HealthReview] Failed to save meal data from API response:', saveError);
          // Continue since we already have the data from the API
        }
      } else {
        console.warn(`[HealthReview] No meal data found for ID: ${mealId}`);
        
        // Try one last attempt - check local storage backup via client-side redirect
        return new Response(
          JSON.stringify({
            error: 'Meal data not found',
            code: 'MEAL_NOT_FOUND',
            mealId: mealId,
            redirectToClient: true, // Signal to the client to check localStorage
            success: false
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // If we have the meal but it lacks certain fields, add fallbacks
    if (meal) {
      // Apply fallbacks for missing fields
      const macronutrientsFallback = {
        carbs: { amount: 0, unit: 'g' },
        protein: { amount: 0, unit: 'g' },
        fat: { amount: 0, unit: 'g' },
        fiber: { amount: 0, unit: 'g' },
        sugar: { amount: 0, unit: 'g' }
      };
      
      const nutrients = meal.nutrients || meal.macronutrients || meal.data?.nutrients || macronutrientsFallback;
      const insights = meal.insights || meal.health_insights || meal.data?.insights || [];
      const mealName = meal.mealName || meal.name || meal.caption || meal.data?.caption || 'Analyzed Meal';
      const goal = meal.goal || meal.data?.goal || 'General Wellness';
      
      // Ensure calories are valid even if missing
      const calories = meal.calories || 
                       (meal.data?.calories ? parseInt(meal.data?.calories) : null) || 
                       meal.data?.nutrientContent?.calories || 
                       0;
      
      // Prepare the response payload
      const response = {
        success: true,
        mealId: mealId,
        userId: userId,
        meal: {
          id: meal.id || mealId,
          name: mealName,
          caption: meal.caption || mealName,
          goal: goal,
          calories: calories,
          nutrients: nutrients,
          insights: insights,
          imageUrl: meal.image_url || meal.imageUrl,
          createdAt: meal.created_at || meal.createdAt || new Date().toISOString()
        },
        executionTime: Date.now() - startTime
      };
      
      console.log(`[HealthReview] Successfully processed health review for meal ID: ${mealId} (${response.executionTime}ms)`);
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // This shouldn't happen, but just in case all fallbacks fail
      console.error(`[HealthReview] Failed to retrieve meal data after all fallback attempts for ID: ${mealId}`);
      return new Response(
        JSON.stringify({
          error: 'Failed to retrieve meal data',
          success: false,
          mealId: mealId
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[HealthReview] Unhandled exception processing health review:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}