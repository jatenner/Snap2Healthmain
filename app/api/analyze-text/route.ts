import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { generateMealTags } from '../../lib/meal-tagger';
import { computeDailyNutritionSummary } from '../../lib/daily-summaries';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('../../lib/supabase/server');
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting
    const { rateLimitResponse } = await import('../../lib/rate-limiter');
    const rlResponse = rateLimitResponse(userId, 'analyzeText');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const { description, mealTime, goal } = body;

    if (!description || typeof description !== 'string' || description.trim().length < 3) {
      return NextResponse.json({ error: 'Please describe what you consumed' }, { status: 400 });
    }

    // Fetch user learning profile for personalized analysis
    const { data: learningProfile } = await supabaseAdmin
      .from('user_learning_profile')
      .select('learning_data')
      .eq('user_id', userId)
      .single();

    const corrections = learningProfile?.learning_data?.analysis_corrections;
    let learningContext = '';
    if (corrections && Array.isArray(corrections) && corrections.length > 0) {
      const recent = corrections.slice(-5);
      learningContext = `\n\nUser correction history (adjust estimates accordingly):\n${recent.map((c: any) => `- ${c.original} → corrected to: ${c.corrected} (${c.category})`).join('\n')}`;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000 });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a precision nutrition expert. The user will describe food, beverages, or supplements they consumed. Analyze and return comprehensive nutrition data in JSON format.

CRITICAL RULES:
- Assume they consumed ALL of what they describe
- If they mention a time, note it
- Estimate portions based on typical serving sizes unless specified
- For SUPPLEMENTS: Look up the actual product if it's a known brand. Include EVERY vitamin, mineral, and active ingredient with exact amounts in the micronutrients array. Known supplements like "Blueprint Longevity Mix", "Athletic Greens", "Garden of Life multivitamin" etc. should have their full ingredient profiles returned.
- For FOOD: Include only nutrients actually present in significant amounts
- For DRINKS: Include caffeine content if applicable
- For ALCOHOL: Estimate grams of alcohol (1 drink ≈ 14g)${learningContext}`
        },
        {
          role: 'user',
          content: `I consumed the following: "${description.trim()}"

Provide comprehensive nutrition data in JSON format:

{
  "mealName": "descriptive name",
  "mealDescription": "detailed description of what was consumed",
  "consumptionType": "meal" | "snack" | "drink" | "alcohol" | "supplement" | "hydration",
  "parsedTime": "HH:MM in 24hr format if mentioned, null otherwise",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "macronutrients": [
    {"name": "Protein", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Total Carbohydrates", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Total Fat", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Saturated Fat", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Fiber", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Sugar", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Sodium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Caffeine", "amount": number, "unit": "mg"},
    {"name": "Alcohol", "amount": number, "unit": "g"}
  ],
  "micronutrients": [
    {"name": "Vitamin A", "amount": number, "unit": "mcg", "percentDailyValue": number},
    {"name": "Vitamin C", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin D", "amount": number, "unit": "mcg", "percentDailyValue": number},
    {"name": "Vitamin E", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin K", "amount": number, "unit": "mcg", "percentDailyValue": number},
    {"name": "Vitamin B1 (Thiamine)", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin B2 (Riboflavin)", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin B3 (Niacin)", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin B5 (Pantothenic Acid)", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin B6", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin B7 (Biotin)", "amount": number, "unit": "mcg", "percentDailyValue": number},
    {"name": "Vitamin B9 (Folate)", "amount": number, "unit": "mcg", "percentDailyValue": number},
    {"name": "Vitamin B12", "amount": number, "unit": "mcg", "percentDailyValue": number},
    {"name": "Calcium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Iron", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Magnesium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Phosphorus", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Potassium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Zinc", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Selenium", "amount": number, "unit": "mcg", "percentDailyValue": number},
    {"name": "Omega-3 (EPA+DHA)", "amount": number, "unit": "mg"},
    {"name": "Tryptophan", "amount": number, "unit": "mg"},
    {"name": "Choline", "amount": number, "unit": "mg", "percentDailyValue": number}
  ],
  "foods": ["list of identified items"],
  "ingredients": ["main ingredients"],
  "benefits": ["health benefits"],
  "concerns": ["nutritional concerns"],
  "suggestions": ["improvement suggestions"],
  "healthRating": number
}

Caffeine: estimate for coffee (~95mg/cup), tea (~47mg), energy drinks, etc. 0 if none.
Alcohol: estimate grams (1 beer/wine/shot ≈ 14g). 0 if none.
Return ONLY valid JSON.`
        }
      ],
      max_tokens: 3500,
      temperature: 0.1,
    });

    const responseContent = completion.choices[0]?.message?.content || '';
    let cleanResponse = responseContent.trim();

    if (cleanResponse.includes('```')) {
      const jsonMatch = cleanResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) cleanResponse = jsonMatch[1];
    }

    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse nutrition data' }, { status: 422 });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate nutrition estimates before storing
    const { validateNutritionEstimate } = await import('../../lib/nutrition-validation');
    const validationResult = validateNutritionEstimate(analysis);
    console.log('[analyze-text] Validation:', { confidence: validationResult.confidenceScore, flags: validationResult.flags.length });
    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Nutrition analysis produced invalid results. Please try describing your meal differently.',
        validationFlags: validationResult.flags,
      }, { status: 422 });
    }

    // Determine meal time: user-provided > AI-parsed > now
    let finalMealTime: Date;
    if (mealTime) {
      finalMealTime = new Date(mealTime);
    } else if (analysis.parsedTime) {
      const [hours, minutes] = analysis.parsedTime.split(':').map(Number);
      finalMealTime = new Date();
      finalMealTime.setHours(hours, minutes, 0, 0);
    } else {
      finalMealTime = new Date();
    }

    // Generate tags
    const mealTags = generateMealTags({
      calories: analysis.calories || 0,
      protein: analysis.protein || 0,
      carbs: analysis.carbs || 0,
      fat: analysis.fat || 0,
      macronutrients: analysis.macronutrients,
      micronutrients: analysis.micronutrients,
      mealTime: finalMealTime,
      ingredients: analysis.ingredients,
      consumptionType: analysis.consumptionType,
    });

    // Map consumptionType to intake_type (normalize legacy values)
    const consumptionTypeMap: Record<string, string> = {
      meal: 'meal', snack: 'snack', drink: 'drink', beverage: 'drink',
      alcohol: 'alcohol', supplement: 'supplement', hydration: 'hydration',
    };
    const intakeType = consumptionTypeMap[analysis.consumptionType] || 'meal';

    // Save to database — same structure as image-based analysis
    const mealRecord = {
      user_id: userId,
      meal_name: analysis.mealName || description.substring(0, 100),
      image_url: null,
      intake_type: intakeType,
      calories: analysis.calories || 0,
      protein: analysis.protein || 0,
      fat: analysis.fat || 0,
      carbs: analysis.carbs || 0,
      macronutrients: analysis.macronutrients || [],
      micronutrients: analysis.micronutrients || [],
      ingredients: analysis.ingredients || [],
      benefits: analysis.benefits || [],
      concerns: analysis.concerns || [],
      suggestions: analysis.suggestions || [],
      analysis: analysis,
      goal: goal || 'General Wellness',
      meal_time: finalMealTime.toISOString(),
      meal_tags: mealTags,
    };

    const { data: savedMeal, error: saveError } = await supabaseAdmin
      .from('meals')
      .insert([mealRecord])
      .select('id')
      .single();

    if (saveError) {
      console.error('Text meal save error:', saveError.message);
    }

    const mealId = savedMeal?.id;

    // Trigger daily summary recomputation in background
    if (mealId) {
      const dateStr = finalMealTime.toISOString().split('T')[0]!;
      computeDailyNutritionSummary(userId, dateStr).catch(e =>
        console.error('Background summary error:', e)
      );
    }

    return NextResponse.json({
      success: true,
      mealId,
      id: mealId,
      name: analysis.mealName,
      consumptionType: analysis.consumptionType,
      calories: analysis.calories || 0,
      protein: analysis.protein || 0,
      carbs: analysis.carbs || 0,
      fat: analysis.fat || 0,
      analysis,
      macronutrients: analysis.macronutrients || [],
      micronutrients: analysis.micronutrients || [],
      meal_tags: mealTags,
      meal_time: finalMealTime.toISOString(),
      source: 'text',
    });

  } catch (error: any) {
    console.error('Text analysis error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to analyze description',
    }, { status: 500 });
  }
}
