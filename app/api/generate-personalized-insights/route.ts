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

// Interface definitions for nutrient types
interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
}

interface NutrientBenefits {
  [key: string]: string;
}

interface FoodSources {
  [key: string]: string;
}

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
    
    // Extract micronutrients for detailed analysis
    const micronutrients = mealData?.micronutrients || mealData?.analysis?.micronutrients || [];
    const macronutrients = mealData?.macronutrients || mealData?.analysis?.macronutrients || [];
    
    console.log('[generate-personalized-insights] Micronutrients found:', micronutrients.length);
    console.log('[generate-personalized-insights] Macronutrients found:', macronutrients.length);
    
    // Get user profile from session metadata (this is the real data!)
    const sessionProfile = session?.user?.user_metadata || {};
    console.log('[generate-personalized-insights] Session user metadata:', sessionProfile);
    
    // Extract user profile information from session with proper fallbacks
    const firstName = (sessionProfile.full_name || userProfile?.full_name || sessionProfile.name || userProfile?.name || 'there').split(' ')[0];
    const age = parseInt(sessionProfile.age) || parseInt(userProfile?.age) || 25;
    const weight = parseInt(sessionProfile.weight) || parseInt(userProfile?.weight) || 225;
    const weightUnit = sessionProfile.weight_unit || userProfile?.weight_unit || 'lbs';
    const height = parseInt(sessionProfile.height) || parseInt(userProfile?.height) || 78;
    const heightUnit = sessionProfile.height_unit || userProfile?.height_unit || 'inches';
    const gender = sessionProfile.gender || userProfile?.gender || 'male';
    const activityLevel = sessionProfile.activityLevel || sessionProfile.activity_level || userProfile?.activity_level || 'active';
    const goal = userGoal || sessionProfile.defaultGoal || sessionProfile.goal || userProfile?.goal || 'athletic performance';

    console.log('[generate-personalized-insights] Final user profile:', {
      firstName, age, weight, weightUnit, height, heightUnit, gender, activityLevel, goal
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
    const dailyProteinTarget = Math.round(weightInKg * 2.2);
    const proteinPercentage = Math.round((protein / dailyProteinTarget) * 100);
    
    // Create comprehensive prompt for detailed analysis
    const prompt = `Hey ${firstName}! Let's break down your ${mealName} and see how it fits into your ${goal.toLowerCase()} journey.

**MEAL SNAPSHOT:**
🍽️ ${mealName}: ${calories} calories, ${protein}g protein, ${carbs}g carbs, ${fat}g fat
🧪 Micronutrients: ${micronutrients.length} vitamins & minerals analyzed
📊 Macronutrients: ${macronutrients.length} primary nutrients tracked

**YOUR DAILY TARGETS:**
🎯 Calories: ${tdee} per day
🥩 Protein: ${dailyProteinTarget}g per day (crucial for your goals!)
⚡ Activity Level: ${activityLevel}

**MICRONUTRIENT BREAKDOWN:**
${micronutrients.map((micro: any) => `- ${micro.name}: ${micro.amount}${micro.unit} (${micro.percentDailyValue || 0}% DV)`).join('\n')}

**MACRONUTRIENT BREAKDOWN:**
${macronutrients.map((macro: any) => `- ${macro.name}: ${macro.amount}${macro.unit} (${macro.percentDailyValue || 0}% DV)`).join('\n')}

**Why ${dailyProteinTarget}g matters for you:**
Your body needs this much protein because you're ${activityLevel} and focused on ${goal.toLowerCase()}. Protein helps repair muscle tissue, keeps you full longer, and supports your metabolism. Think of it as the building blocks your body craves!

${protein < dailyProteinTarget * 0.25 ? `🚨 **Heads up:** This meal is pretty low on protein for your goals. You'll need to pack more into your other meals - think Greek yogurt, lean meats, or a protein shake.` : protein > dailyProteinTarget * 0.4 ? `🔥 **Nice work!** This meal is doing heavy lifting for your protein goals. You're well on your way to hitting that ${dailyProteinTarget}g target.` : `✅ **Solid choice:** Decent protein here, but you'll need consistent protein at every meal to reach your ${dailyProteinTarget}g daily target.`}

## 1. **How This Meal Fits Your Goals**

**Calorie Check:**
This meal gave you ${calories} calories, which is ${caloriePercentage}% of your daily ${tdee}-calorie target. ${calories < tdee * 0.15 ? "This is pretty light - you'll want to make sure your other meals are more substantial to fuel your body properly." : calories > tdee * 0.4 ? "This is a hearty meal! Just balance it out with lighter options throughout the day." : "Perfect meal size - this fits nicely into your daily plan."}

**Protein Power Check:**
Here's where it gets interesting, ${firstName}. You got ${protein}g of protein from this meal.

📊 **Your Protein Intake vs. Target:**
- This meal: ${protein}g
- Daily target: ${dailyProteinTarget}g  
- You hit: ${proteinPercentage}% of your daily goal

**Why ${dailyProteinTarget}g matters for you:**
Your body needs this much protein because you're ${activityLevel} and focused on ${goal.toLowerCase()}. Protein helps repair muscle tissue, keeps you full longer, and supports your metabolism. Think of it as the building blocks your body craves!

${protein < dailyProteinTarget * 0.25 ? `🚨 **Heads up:** This meal is pretty low on protein for your goals. You'll need to pack more into your other meals - think Greek yogurt, lean meats, or a protein shake.` : protein > dailyProteinTarget * 0.4 ? `🔥 **Nice work!** This meal is doing heavy lifting for your protein goals. You're well on your way to hitting that ${dailyProteinTarget}g target.` : `✅ **Solid choice:** Decent protein here, but you'll need consistent protein at every meal to reach your ${dailyProteinTarget}g daily target.`}

## 1.5. **Micronutrient Deep Dive - What Your Body Is Getting**

${firstName}, let's talk about the vitamins and minerals in this meal - these are the unsung heroes that keep your body running like a well-oiled machine!

**🧪 VITAMIN & MINERAL BREAKDOWN:**

${micronutrients.length > 0 ? micronutrients.map(micro => {
  const percentage = micro.percentDailyValue || 0;
  const progressBar = '█'.repeat(Math.min(10, Math.floor(percentage/10))) + '░'.repeat(Math.max(0, 10 - Math.floor(percentage/10)));
  const status = percentage < 10 ? '🔴 LOW' : percentage < 25 ? '🟡 MODERATE' : percentage >= 50 ? '🟢 EXCELLENT' : '✅ GOOD';
  
  return `📊 **${micro.name}**: ${micro.amount}${micro.unit}
${progressBar} ${percentage}% DV ${status}`;
}).join('\n\n') : '⚠️ Limited micronutrient data available - this meal may be missing key vitamins and minerals your body needs.'}

**🎯 WHAT THIS MEANS FOR YOUR BODY:**

${micronutrients.filter(m => (m.percentDailyValue || 0) >= 25).length > 0 ? `
**✅ WINNING NUTRIENTS (25%+ DV):**
${micronutrients.filter(m => (m.percentDailyValue || 0) >= 25).map(micro => {
  const nutrientBenefits = {
    'Vitamin C': 'boosts immune system, helps iron absorption, supports collagen production',
    'Vitamin A': 'supports vision, immune function, and skin health',
    'Vitamin D': 'crucial for bone health, immune function, and mood regulation',
    'Vitamin E': 'powerful antioxidant, protects cells from damage',
    'Vitamin K': 'essential for blood clotting and bone health',
    'Iron': 'carries oxygen in blood, prevents fatigue and weakness',
    'Calcium': 'builds strong bones and teeth, supports muscle function',
    'Magnesium': 'supports muscle and nerve function, energy production',
    'Potassium': 'regulates blood pressure, supports heart and muscle function',
    'Zinc': 'supports immune system, wound healing, and protein synthesis',
    'Folate': 'crucial for DNA synthesis and red blood cell formation',
    'B12': 'essential for nerve function and red blood cell production'
  };
  const benefit = nutrientBenefits[micro.name] || 'supports various body functions';
  return `- **${micro.name}** (${micro.percentDailyValue}% DV): ${benefit}`;
}).join('\n')}` : ''}

${micronutrients.filter(m => (m.percentDailyValue || 0) < 10 && (m.percentDailyValue || 0) > 0).length > 0 ? `
**🔴 NUTRIENTS YOU'RE MISSING (Under 10% DV):**
${micronutrients.filter(m => (m.percentDailyValue || 0) < 10 && (m.percentDailyValue || 0) > 0).map(micro => {
  const foodSources = {
    'Vitamin C': 'citrus fruits, bell peppers, strawberries, broccoli',
    'Vitamin A': 'carrots, sweet potatoes, spinach, liver',
    'Vitamin D': 'fatty fish, egg yolks, fortified foods',
    'Iron': 'red meat, spinach, lentils, tofu',
    'Calcium': 'dairy products, leafy greens, almonds',
    'Magnesium': 'nuts, seeds, whole grains, dark chocolate',
    'Potassium': 'bananas, potatoes, beans, yogurt',
    'Zinc': 'meat, shellfish, seeds, nuts',
    'Folate': 'leafy greens, legumes, fortified grains',
    'B12': 'meat, fish, dairy, nutritional yeast'
  };
  const sources = foodSources[micro.name] || 'various whole foods';
  return `- **${micro.name}** (only ${micro.percentDailyValue}% DV): Add ${sources}`;
}).join('\n')}

**💡 QUICK FIXES:** ${firstName}, your body is craving these nutrients! Try adding a colorful salad, some nuts, or a piece of fruit to boost your vitamin and mineral intake.` : ''}

${micronutrients.length === 0 ? `
**⚠️ MICRONUTRIENT ALERT:**
This meal appears to be lacking in vitamins and minerals. Your body needs these micronutrients to:
- Support immune function and fight off illness
- Convert food into energy efficiently  
- Maintain healthy skin, hair, and nails
- Support brain function and mood
- Build and repair tissues

**EASY ADDITIONS:** Add some colorful vegetables, fruits, nuts, or seeds to boost the nutrient density!` : ''}

## 2. **What Your Body Is Doing With This Food**

**Energy & Performance Impact:**
${carbs > 40 ? `With ${carbs}g of carbs, your muscles are getting a nice glycogen boost - perfect fuel for your workouts! Your body will store this energy for when you need it most.` : `At ${carbs}g carbs, this won't fully top off your energy tanks. If you're training soon, consider adding some rice, oats, or fruit.`}

${fat > 20 ? `The ${fat}g of fat is great for hormone production (super important at ${age}!) and will keep you satisfied for hours.` : `Pretty light on fat at ${fat}g - you might find yourself getting hungry sooner, and you're missing out on fat-soluble vitamins.`}

**Recovery & Muscle Building:**
${protein > 25 ? `The ${protein}g of protein will trigger muscle protein synthesis for the next 3-4 hours - exactly what your body needs for ${goal.toLowerCase()}!` : `With ${protein}g protein, you're not fully maximizing muscle protein synthesis. Aim for 25-40g per meal for optimal results.`}

## 3. **Specific Improvements For You**

**To Better Hit Your Goals:**

${protein < dailyProteinTarget * 0.25 ? `
🥩 **Protein Boost Ideas:**
- Add 4-6 oz of grilled chicken, turkey, or lean beef
- Mix in 2 eggs or have a protein shake on the side
- Try Greek yogurt instead of regular, or add cottage cheese
- Sprinkle hemp seeds, nuts, or protein powder into your meals` : ''}

${calories < tdee * 0.15 ? `
🔥 **Calorie Boost Ideas:**
- Add healthy fats: avocado, nuts, olive oil drizzle
- Include calorie-dense foods: quinoa, sweet potato, nut butter
- Don't be afraid of larger portions - your body needs fuel!` : ''}

${carbs < 30 && goal.toLowerCase().includes('performance') ? `
⚡ **Energy Boost Ideas:**
- Add rice, oats, or fruit to better fuel your training
- Time your biggest carb meals around your workouts
- Your performance goals need that glycogen!` : ''}

## 4. **Your Action Plan**

**For Tomorrow, ${firstName}:**
- 🎯 Target around ${Math.round(tdee/4)} calories per meal (you had ${calories} this time)
- 🥩 Get ${Math.round(dailyProteinTarget/4)}g protein per meal (you had ${protein}g)
- ${goal.toLowerCase().includes('performance') ? '⚡ Time your biggest carb meals around workouts' : '🥗 Keep carbs moderate and focus on protein and healthy fats'}

**Quick Wins:**
- Always include a palm-sized protein source
- Add a fist-sized portion of vegetables for nutrients
- Include healthy fats (thumb-sized portion) for satiety
- ${goal.toLowerCase().includes('performance') ? 'Add complex carbs equal to your cupped hand for energy' : 'Keep carbs to half a cupped hand unless training'}

**Red Flags to Watch:**
${sodium > 800 ? `🧂 High sodium alert (${sodium}mg) - watch your blood pressure and drink extra water` : ''}
${sugar > 25 ? `🍭 High sugar content (${sugar}g) might cause energy crashes - pair with protein next time` : ''}
${fiber < 5 ? `🌾 Low fiber (${fiber}g) - add vegetables or switch to whole grains for better digestion` : ''}

**Bottom Line:**
${firstName}, you're ${age} years old and working toward ${goal.toLowerCase()} - your body is capable of amazing things when you fuel it right. Every meal is a chance to get closer to your goals. Keep building those healthy habits! 💪

**Visual Progress:**
📊 Protein: ${protein}g ████${'█'.repeat(Math.min(10, Math.floor(proteinPercentage/10)))}${'░'.repeat(Math.max(0, 10 - Math.floor(proteinPercentage/10)))} ${proteinPercentage}% of ${dailyProteinTarget}g target
🔥 Calories: ${calories} ████${'█'.repeat(Math.min(10, Math.floor(caloriePercentage/10)))}${'░'.repeat(Math.max(0, 10 - Math.floor(caloriePercentage/10)))} ${caloriePercentage}% of ${tdee} target`;

    console.log('[generate-personalized-insights] Sending advanced food science request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a friendly, knowledgeable nutrition coach speaking directly to your client by their first name. Your tone should be:

- **Personal & Conversational**: Use their first name, speak like a supportive friend who knows their stuff
- **Visual & Engaging**: Include emojis, progress bars, and visual elements to make it easy to scan
- **Encouraging but Real**: Celebrate wins AND point out areas for improvement - be honest but supportive
- **Specific & Actionable**: Give exact numbers, specific food suggestions, and clear next steps
- **Goal-Focused**: Everything ties back to their specific goals and body stats
- **Educational**: Explain WHY things matter (why protein targets, why timing matters, etc.)
- **Micronutrient-Focused**: Pay special attention to vitamins and minerals - what they're getting, what they're missing, and why it matters for their health

Think like a knowledgeable trainer who genuinely cares about their success and wants to make nutrition feel approachable and achievable. Use their exact stats to make everything personal and relevant.

Be conversational but authoritative. Make them feel like they're getting advice from someone who really knows them and their goals.`
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
            console.error('[generate-personalized-insights] Error saving insights to database:', error);
          } else {
            console.log('[generate-personalized-insights] Successfully saved insights to database');
          }
        });
    }

    return NextResponse.json({
      success: true,
      insights,
      metadata: {
        userProfile: { 
          firstName,
          age, 
          weight: `${weight} ${weightUnit}`, 
          height: `${Math.floor(height/12)}'${height%12}\"`, 
          gender, 
          activityLevel, 
          goal,
          bmr: Math.round(bmr),
          tdee: tdee,
          dailyProteinTarget
        },
        mealInfo: { 
          name: mealName, 
          calories, 
          protein, 
          carbs, 
          fat,
          caloriePercentage,
          proteinPercentage,
          micronutrientCount: micronutrients.length,
          macronutrientCount: macronutrients.length
        },
        generatedAt: new Date().toISOString(),
        source: 'advanced_analysis',
        version: '6.0-micronutrient-enhanced'
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
    message: 'Personalized Insights Generator API - Enhanced with Micronutrient Analysis',
    version: '6.0-micronutrient-enhanced',
    endpoints: {
      POST: 'Generate personalized nutrition insights with comprehensive micronutrient analysis'
    }
  });
}