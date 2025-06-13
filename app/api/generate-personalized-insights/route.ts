import { NextRequest, NextResponse } from "next/server";
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enhanced daily value calculation function
function calculateDailyValue(nutrientName: string, amount: number, userProfile: any): number {
  const dv_database: Record<string, number> = {
    // Vitamins (mcg or mg)
    'vitamin a': 900, 'vitamin c': 90, 'vitamin d': 20, 'vitamin e': 15, 'vitamin k': 120,
    'thiamine': 1.2, 'riboflavin': 1.3, 'niacin': 16, 'vitamin b6': 1.7, 'folate': 400,
    'vitamin b12': 2.4, 'biotin': 30, 'pantothenic acid': 5,
    // Minerals (mg or mcg)
    'calcium': 1000, 'iron': 8, 'magnesium': 400, 'phosphorus': 700, 'potassium': 3500,
    'sodium': 2300, 'zinc': 11, 'copper': 900, 'manganese': 2.3, 'selenium': 55,
    'chromium': 35, 'molybdenum': 45, 'iodine': 150,
    // Macronutrients (g)
    'protein': 50, 'total carbohydrates': 300, 'dietary fiber': 25, 'total fat': 65,
    'saturated fat': 20, 'cholesterol': 300
  };

  const key = nutrientName.toLowerCase().trim();
  const baseDV = dv_database[key] || 0;
  
  if (baseDV === 0) return 0;
  
  // Adjust for user profile (simplified)
  let adjustedDV = baseDV;
  if (userProfile?.weight && userProfile?.gender) {
    const weightFactor = (userProfile.weight || 225) / 180; // Reference weight
    if (key === 'protein') adjustedDV = Math.round(baseDV * weightFactor);
  }
  
  return Math.round((amount / adjustedDV) * 100);
}

export async function POST(request: NextRequest) {
  try {
    console.log('[generate-personalized-insights] Starting streamlined insights generation...');
    
    // Get user session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    const body = await request.json();
    console.log('[generate-personalized-insights] Received payload for meal:', body.mealId || body.mealData?.id);
    
    // Handle payload formats
    let mealData, userProfile, mealId;
    
    if (body.mealData) {
      mealData = body.mealData;
      userProfile = body.userProfile;
      mealId = body.mealData?.id;
    } else if (body.mealId) {
      mealId = body.mealId;
      
      // Fetch meal from database
      const { data: meal, error } = await supabaseAdmin
        .from('meals')
        .select('*')
        .eq('id', mealId)
        .single();
        
      if (error || !meal) {
        throw new Error(`Could not fetch meal: ${error?.message || 'Not found'}`);
      }
      mealData = meal;
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid payload - missing mealData or mealId'
      }, { status: 400 });
    }
    
    // Extract user profile data
    const sessionUser = session?.user?.user_metadata || {};
    const firstName = sessionUser.firstName || userProfile?.firstName || 'there';
    const age = parseInt(sessionUser.age || userProfile?.age) || 25;
    const weight = parseInt(sessionUser.weight || userProfile?.weight) || 225;
    const height = parseInt(sessionUser.height || userProfile?.height) || 78;
    const gender = sessionUser.gender || userProfile?.gender || 'male';
    const activityLevel = sessionUser.activityLevel || userProfile?.activityLevel || 'active';
    const goal = sessionUser.defaultGoal || userProfile?.goal || body.userGoal || 'Athletic Performance';
    
    // Extract meal data
    const mealName = mealData?.meal_name || mealData?.mealName || 'Analyzed Meal';
    const calories = mealData?.calories || 0;
    const protein = mealData?.protein || 0;
    const carbs = mealData?.carbs || 0;
    const fat = mealData?.fat || 0;
    const sodium = mealData?.sodium || 0;
    const fiber = mealData?.fiber || 0;
    
    // Process micronutrients with DV calculations
    const micronutrients = mealData?.micronutrients || mealData?.analysis?.micronutrients || [];
    const macronutrients = mealData?.macronutrients || mealData?.analysis?.macronutrients || [];
    
    console.log('[generate-personalized-insights] Processing nutrients:', {
      microCount: micronutrients.length,
      macroCount: macronutrients.length
    });
    
    // Calculate TDEE and daily targets
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
    const dailyProteinTarget = Math.round(weightInKg * 2.2); // 2.2g per kg for active individuals
    
    // Calculate percentages
    const caloriePercentage = Math.round((calories / tdee) * 100);
    const proteinPercentage = Math.round((protein / dailyProteinTarget) * 100);
    
    // Enhanced micronutrient analysis
    const enhancedMicros = micronutrients.map((micro: any) => {
      const dv = calculateDailyValue(micro.name, micro.amount, { weight, gender, age });
      return {
        ...micro,
        percentDailyValue: dv,
        status: dv >= 50 ? 'excellent' : dv >= 25 ? 'good' : dv >= 10 ? 'fair' : 'low'
      };
    });
    
    // Enhanced macronutrient analysis  
    const enhancedMacros = macronutrients.map((macro: any) => {
      const dv = calculateDailyValue(macro.name, macro.amount, { weight, gender, age });
      return {
        ...macro,
        percentDailyValue: dv,
        status: dv >= 50 ? 'excellent' : dv >= 25 ? 'good' : dv >= 10 ? 'fair' : 'low'
      };
    });
    
    // Create streamlined prompt for fast, focused insights
    const prompt = `Generate concise, actionable health insights for this meal analysis:

**USER PROFILE**: ${firstName}, ${age}yr ${gender}, ${weight}lbs, ${Math.floor(height/12)}'${height%12}", ${activityLevel}, targeting ${goal}
**DAILY NEEDS**: ${tdee} calories, ${dailyProteinTarget}g protein

**MEAL**: ${mealName}
- Calories: ${calories} (${caloriePercentage}% of daily needs)
- Protein: ${protein}g (${proteinPercentage}% of target)
- Carbs: ${carbs}g | Fat: ${fat}g | Fiber: ${fiber}g | Sodium: ${sodium}mg

**TOP NUTRIENTS** (>10% DV):
${enhancedMicros.filter((m: any) => m.percentDailyValue >= 10).map((m: any) => `${m.name}: ${m.amount}${m.unit} (${m.percentDailyValue}% DV)`).join(', ') || 'Limited micronutrient data'}

**MACRONUTRIENT BREAKDOWN**:
${enhancedMacros.map((m: any) => `${m.name}: ${m.amount}${m.unit} (${m.percentDailyValue}% DV)`).join(', ')}

Generate insights in this EXACT format:

## Energy Balance & Metabolism
[2-3 sentences about calorie adequacy, metabolic impact, and energy timing for this specific person]

## Protein & Recovery  
[2-3 sentences about protein adequacy for their goals, muscle protein synthesis, and recovery optimization]

## Micronutrient Highlights
[2-3 sentences about standout vitamins/minerals, what they support, and any notable gaps]

## Optimization Tips
[2-3 specific, actionable suggestions to improve this meal for their goals]

Keep each section focused, practical, and personalized to ${firstName}'s ${goal} goals. Use conversational language but maintain nutritional accuracy.`;

    console.log('[generate-personalized-insights] Calling OpenAI with streamlined prompt...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a certified sports nutritionist providing personalized meal analysis. Your responses should be:
- CONCISE: Each section 2-3 sentences max
- ACTIONABLE: Include specific, practical advice  
- PERSONALIZED: Reference their goals, stats, and meal specifics
- CONVERSATIONAL: Friendly but professional tone
- FORMATTED: Use exact section headers as requested

Focus on the most impactful insights for their specific profile and goals.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800, // Shorter for faster generation
      temperature: 0.1,
    });

    const insights = completion.choices[0]?.message?.content || '';
    
    console.log('[generate-personalized-insights] Generated insights length:', insights.length);
    
    if (!insights || insights.length < 100) {
      throw new Error('Generated insights too short or empty');
    }

    // Save to database asynchronously
    if (mealId && mealId !== 'temp-enhanced' && !mealId.includes('temp')) {
      supabaseAdmin
        .from('meals')
        .update({ 
          personalized_insights: insights,
          insights_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', mealId)
        .then(({ error }) => {
          if (error) {
            console.error('[generate-personalized-insights] Database save error:', error);
          } else {
            console.log('[generate-personalized-insights] Successfully saved insights to database');
          }
        });
    }

    return NextResponse.json({
      success: true,
      insights,
      metadata: {
        userProfile: { firstName, age, weight, height, gender, activityLevel, goal },
        mealInfo: { name: mealName, calories, protein, carbs, fat },
        nutrientCounts: { 
          micronutrients: enhancedMicros.length, 
          macronutrients: enhancedMacros.length 
        },
        generatedAt: new Date().toISOString(),
        version: '7.0-streamlined'
      }
    });

  } catch (error) {
    console.error('[generate-personalized-insights] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insights'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Streamlined Personalized Insights API',
    version: '7.0-streamlined',
    features: ['Fast generation', 'Clean formatting', 'Consistent structure']
  });
}