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

export async function POST(request: NextRequest) {
  try {
    console.log('[generate-personalized-insights] Starting advanced insights generation...');
    
    // Get user session to extract profile data
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
    console.log('[generate-personalized-insights] Received payload:', JSON.stringify(body, null, 2));
    
    // Handle different payload formats from different components
    let mealData, userProfile, userGoal, mealId, userId;
    
    if (body.mealData) {
      // Format from PersonalizedNutritionAnalysis component
      mealData = body.mealData;
      userProfile = body.userProfile;
      userGoal = body.userGoal;
      mealId = body.mealData?.id || body.mealData?.mealId;
    } else if (body.mealId) {
      // Format from MobileOptimizedAnalysis component
      mealId = body.mealId;
      userId = body.userId;
      userGoal = body.userGoal;
      
      // Fetch meal data from database
      try {
        const { data: meal, error } = await supabaseAdmin
          .from('meals')
          .select('*')
          .eq('id', mealId)
          .single();
          
        if (error || !meal) {
          throw new Error(`Could not fetch meal data: ${error?.message || 'Meal not found'}`);
        }
        
        mealData = meal;
      } catch (fetchError) {
        console.error('[generate-personalized-insights] Error fetching meal:', fetchError);
        return NextResponse.json({
          success: false,
          error: 'Could not fetch meal data for analysis'
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid payload format - missing mealData or mealId'
      }, { status: 400 });
    }
    
    // Extract meal information
    const mealName = mealData?.meal_name || mealData?.mealName || mealData?.name || 'Analyzed Meal';
    const calories = mealData?.calories || 0;
    const protein = mealData?.protein || 0;
    const carbs = mealData?.carbs || mealData?.carbohydrates || 0;
    const fat = mealData?.fat || 0;
    const fiber = mealData?.fiber || 0;
    const sugar = mealData?.sugar || 0;
    const sodium = mealData?.sodium || 0;
    const ingredients = mealData?.ingredients || '';
    const description = mealData?.description || '';
    
    // Get user profile from session metadata (this is the real data!)
    const sessionProfile = session?.user?.user_metadata || {};
    console.log('[generate-personalized-insights] Session user metadata:', sessionProfile);
    
    // Extract user profile information from session with proper fallbacks
    const age = parseInt(sessionProfile.age) || parseInt(userProfile?.age) || 25;
    const weight = parseInt(sessionProfile.weight) || parseInt(userProfile?.weight) || 225;
    const weightUnit = sessionProfile.weight_unit || userProfile?.weight_unit || 'lbs';
    const height = parseInt(sessionProfile.height) || parseInt(userProfile?.height) || 78;
    const heightUnit = sessionProfile.height_unit || userProfile?.height_unit || 'inches';
    const gender = sessionProfile.gender || userProfile?.gender || 'male';
    const activityLevel = sessionProfile.activityLevel || sessionProfile.activity_level || userProfile?.activity_level || 'active';
    const goal = userGoal || sessionProfile.defaultGoal || sessionProfile.goal || userProfile?.goal || 'athletic performance';

    console.log('[generate-personalized-insights] Final user profile:', {
      age, weight, weightUnit, height, heightUnit, gender, activityLevel, goal
    });

    // Calculate TDEE and other metrics
    const heightInCm = heightUnit === 'inches' ? height * 2.54 : height;
    const weightInKg = weightUnit === 'lbs' ? weight * 0.453592 : weight;
    
    // Harris-Benedict equation for BMR
    const bmr = gender === 'male' 
      ? 88.362 + (13.397 * weightInKg) + (4.799 * heightInCm) - (5.677 * age)
      : 447.593 + (9.247 * weightInKg) + (3.098 * heightInCm) - (4.330 * age);
    
    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };
    
    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.725));
    const caloriePercentage = Math.round((calories / tdee) * 100);
    
    // Create comprehensive prompt for detailed analysis
    const prompt = `**YOUR CLIENT:**
- ${age}-year-old ${gender}, ${weight} lbs, ${Math.floor(height/12)}'${height%12}"
- ${activityLevel} lifestyle, Goal: ${goal}
- Daily needs: ~${tdee} calories, ~${Math.round(weightInKg * 2.2)} grams protein

**THIS MEAL:**
${mealName} - ${calories} calories, ${protein}g protein, ${carbs}g carbs, ${fat}g fat

Write a personalized analysis as if you're talking directly to them. Use "you" and "your" throughout. Be specific about their numbers and give direct advice.

## 1. **How This Meal Fits Your Goals**

**Calorie Check:**
This meal gives you ${calories} calories, which is ${Math.round((calories/tdee)*100)}% of your ${tdee}-calorie daily target. ${calories < tdee * 0.15 ? "This is on the lighter side - you'll need substantial meals throughout the day to hit your targets." : calories > tdee * 0.4 ? "This is a pretty hefty meal - make sure your other meals are lighter to stay balanced." : "This is a solid meal size that fits well into your daily plan."}

**Protein Analysis:**
You got ${protein}g of protein here. For your ${weight}-lb frame and ${goal.toLowerCase()} goals, you should aim for about ${Math.round(weightInKg * 2.2)}g protein daily. This meal covers ${Math.round((protein/(weightInKg * 2.2))*100)}% of that target. ${protein < (weightInKg * 2.2) * 0.25 ? `This is pretty low protein for you - you'll need to pack more protein into your other meals. Try adding Greek yogurt, protein powder, or extra lean meat.` : protein > (weightInKg * 2.2) * 0.4 ? `Great protein content! This meal is doing heavy lifting for your daily protein goals.` : `Decent protein, but you'll need consistent protein at every meal to hit your ${Math.round(weightInKg * 2.2)}g daily target.`}

## 2. **What Your Body Is Doing With This Food**

**Energy & Performance Impact:**
${carbs > 40 ? `With ${carbs}g carbs, this meal will fuel your workouts well. Your muscles will store this as glycogen for energy during training.` : `At only ${carbs}g carbs, this won't fully top off your energy tanks. Consider adding rice, oats, or fruit if you're training soon.`}

${fat > 20 ? `The ${fat}g of fat will help with hormone production (important for a ${age}-year-old ${gender}) and keep you satisfied longer.` : `Pretty low fat at ${fat}g - you might get hungry sooner and miss out on fat-soluble vitamins.`}

**Recovery & Muscle Building:**
${protein > 25 ? `The ${protein}g protein will trigger muscle protein synthesis for about 3-4 hours, supporting your ${goal.toLowerCase()} goals.` : `With only ${protein}g protein, you're not maximizing muscle protein synthesis. Aim for 25-40g per meal.`}

## 3. **Specific Improvements For You**

**To Better Hit Your Goals:**
${protein < (weightInKg * 2.2) * 0.25 ? `
• **Add More Protein**: Try adding 4-6 oz more lean meat, 2 eggs, or a protein shake
• **High-Protein Swaps**: Greek yogurt instead of regular, protein pasta, or cottage cheese
• **Quick Protein Boosts**: Sprinkle hemp seeds, add nuts, or mix in protein powder` : ''}

${calories < tdee * 0.15 ? `
• **Increase Portions**: You need more calories - add healthy fats like avocado, nuts, or olive oil
• **Add Calorie-Dense Foods**: Quinoa, sweet potato, or nut butter can boost calories without much volume` : ''}

${carbs < 30 && goal.toLowerCase().includes('performance') ? `
• **Fuel Your Training**: Add rice, oats, or fruit to better support your athletic performance
• **Pre/Post Workout**: Time higher-carb meals around your training sessions` : ''}

## 4. **Your Action Plan**

**For Tomorrow:**
• Target ${Math.round(tdee/4)} calories per meal (you had ${calories} this time)
• Get ${Math.round((weightInKg * 2.2)/4)}g protein per meal (you had ${protein}g)
• ${goal.toLowerCase().includes('performance') ? 'Time your biggest carb meals around workouts' : 'Keep carbs moderate and focus on protein and healthy fats'}

**Quick Wins:**
• Always include a palm-sized protein source
• Add a fist-sized portion of vegetables
• Include healthy fats (thumb-sized portion)
• ${goal.toLowerCase().includes('performance') ? 'Add complex carbs equal to your cupped hand' : 'Keep carbs to half a cupped hand unless training'}

**Red Flags to Watch:**
${sodium > 800 ? `• This meal was high in sodium (${sodium}mg) - watch your blood pressure and hydration` : ''}
${sugar > 25 ? `• High sugar content (${sugar}g) might cause energy crashes - pair with protein next time` : ''}
${fiber < 5 ? `• Low fiber (${fiber}g) - add vegetables or switch to whole grains for better digestion` : ''}

Remember: You're ${age} years old and ${weight} lbs - your body needs consistent fuel to perform at its best. Make every meal count toward your ${goal.toLowerCase()} goals!`;

    console.log('[generate-personalized-insights] Sending advanced food science request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personal nutritionist and trainer speaking directly to your client. Your tone should be:

- **Direct & Personal**: Use "you" and "your" throughout - speak TO them, not ABOUT them
- **Specific & Actionable**: Give exact numbers, specific food suggestions, and clear next steps
- **Encouraging but Honest**: Point out what they're doing well AND what needs improvement
- **Goal-Focused**: Everything should tie back to their specific goals and body stats
- **Practical**: Suggest real foods and realistic changes they can make today

Think like a knowledgeable trainer who cares about their success and wants to give them the exact guidance they need to improve their nutrition and reach their goals.

Be conversational but authoritative. Use their exact stats (age, weight, height, goals) to make everything personal and relevant to them specifically.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const insights = completion.choices[0]?.message?.content || '';
    
    console.log('[generate-personalized-insights] Generated insights length:', insights.length);
    console.log('[generate-personalized-insights] Insights preview:', insights.substring(0, 200) + '...');

    if (!insights || insights.length < 200) {
      throw new Error('Generated insights are too short');
    }

    // Save to database if possible (async, don't wait)
    if (mealId && mealId !== 'temp-enhanced' && !mealId.includes('temp')) {
      // Don't await this - let it happen in background
      supabaseAdmin
        .from('meals')
        .update({ 
          insights: insights,
          personalized_insights: insights 
        })
        .eq('id', mealId)
        .then(({ error }) => {
          if (error) {
            console.error('[generate-personalized-insights] Background save error:', error);
          } else {
            console.log('[generate-personalized-insights] Successfully saved insights to database');
          }
        });
    }

    return NextResponse.json({
      success: true,
      insights: insights,
      metadata: {
        userProfile: { 
          age, 
          weight: `${weight} ${weightUnit}`, 
          height: `${Math.floor(height/12)}'${height%12}"`, 
          gender, 
          activityLevel, 
          goal,
          bmr: Math.round(bmr),
          tdee: tdee
        },
        mealInfo: { 
          name: mealName, 
          calories, 
          protein, 
          carbs, 
          fat,
          caloriePercentage
        },
        generatedAt: new Date().toISOString(),
        source: 'advanced_analysis',
        version: '4.0'
      }
    });

  } catch (error) {
    console.error('[generate-personalized-insights] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate personalized insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Advanced Personalized Insights API - Use POST method with meal data",
    status: "active",
    version: "4.0-advanced"
  });
}
