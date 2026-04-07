/**
 * Background Insights — Generates meal-level insights after upload.
 *
 * Extracted from the analyze-meal god file.
 * Runs asynchronously after meal save (fire-and-forget).
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_DEFAULT_PROFILE } from '../personalization-status';

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function generateInsightsInBackground(
  mealId: string,
  userId: string,
  userMetadata: any,
  analysis: any,
): Promise<void> {
  try {
    const age = parseInt(userMetadata.age) || SYSTEM_DEFAULT_PROFILE.age;
    const weight = parseInt(userMetadata.weight) || SYSTEM_DEFAULT_PROFILE.weight;
    const height = parseInt(userMetadata.height) || SYSTEM_DEFAULT_PROFILE.height;
    const gender = userMetadata.gender || SYSTEM_DEFAULT_PROFILE.gender;
    const activityLevel = userMetadata.activityLevel || SYSTEM_DEFAULT_PROFILE.activity_level;

    const heightInCm = height * 2.54;
    const weightInKg = weight * 0.453592;
    const bmr = gender === 'male'
      ? 88.362 + (13.397 * weightInKg) + (4.799 * heightInCm) - (5.677 * age)
      : 447.593 + (9.247 * weightInKg) + (3.098 * heightInCm) - (4.330 * age);

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55,
      active: 1.725, very_active: 1.9,
    };
    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.725));
    const caloriesPct = tdee > 0 ? ((analysis?.calories || 0) / tdee * 100).toFixed(1) : '?';

    const prompt = `Summarize this meal's nutrition. Use ONLY the data provided — do not speculate about hormones, insulin, gut microbiome, or metabolic processes not directly observable from the food data.

**Profile**: ${age}yr ${gender}, ${weight}lbs, ${activityLevel}, TDEE: ${tdee} kcal/day
**Meal**: ${analysis?.mealName || 'Analyzed Meal'} - ${analysis?.calories || 0} kcal, ${analysis?.protein || 0}g protein, ${analysis?.carbs || 0}g carbs, ${analysis?.fat || 0}g fat

Provide 4 focused sections:

## Energy & Macro Balance
- This meal provides ${caloriesPct}% of estimated daily calories
- Protein/carb/fat ratio assessment relative to daily targets

## Key Micronutrients
- Highlight the top 3-5 vitamins or minerals this meal provides
- Note any notably absent nutrients

## Meal Timing & Context
- Relevance of when this meal was eaten
- Whether portion size is appropriate for this time of day

## Suggestions
- 1-2 specific, practical ways to improve this meal nutritionally

Keep each section 2-3 sentences. Be specific and reference the actual numbers.`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition analyst. Summarize meal nutrition data factually. Do NOT discuss insulin, cortisol, hormones, leptin, ghrelin, gut microbiome, or gut bacteria. Only reference what is directly observable from the food composition data. All nutrient values are AI estimates from meal photos.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.1,
    });

    const insights = completion.choices[0]?.message?.content || '';

    if (insights && insights.length > 100) {
      await getSupabaseAdmin()
        .from('meals')
        .update({ insights, personalized_insights: insights })
        .eq('id', mealId);
    }
  } catch (error) {
    console.error('[background-insights] Failed to generate insights:', error);
  }
}
