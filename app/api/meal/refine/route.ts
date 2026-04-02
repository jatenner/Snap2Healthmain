import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { generateMealTags } from '../../../lib/meal-tagger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

// POST: refine a meal based on user corrections
// Body: { mealId, corrections: "I actually ate the full box of rice, not half" }
// OR:   { mealId, adjustments: { calories: 800, protein: 45, ... } }
export async function POST(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('../../../lib/supabase/server');
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { mealId, corrections, adjustments, mealTime } = body;

    if (!mealId) {
      return NextResponse.json({ error: 'mealId is required' }, { status: 400 });
    }

    // Fetch the original meal
    const { data: meal, error: fetchError } = await supabaseAdmin
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    let updatedAnalysis: any;
    let correctionRecord: any;

    if (corrections && typeof corrections === 'string') {
      // Natural language correction — use GPT to reanalyze with correction context
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000 });

      const originalAnalysis = meal.analysis || {};
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert. The user previously logged a meal and now wants to correct the analysis. Apply their correction to the original data and return updated nutrition values. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: `Original meal analysis:
Name: ${meal.meal_name}
Calories: ${meal.calories}, Protein: ${meal.protein}g, Carbs: ${meal.carbs}g, Fat: ${meal.fat}g
Foods: ${JSON.stringify(originalAnalysis.foods || meal.ingredients || [])}

User correction: "${corrections}"

Return the corrected full nutrition in this JSON format:
{
  "mealName": "corrected name if needed",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "macronutrients": [same format as original with corrected values],
  "micronutrients": [same format as original with corrected values],
  "correctionApplied": "brief description of what changed"
}

Return ONLY valid JSON.`
          }
        ],
        max_tokens: 2500,
        temperature: 0.1,
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      let cleanResponse = responseContent.trim();
      if (cleanResponse.includes('```')) {
        const m = cleanResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (m?.[1]) cleanResponse = m[1];
      }
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to process correction' }, { status: 422 });
      }

      updatedAnalysis = JSON.parse(jsonMatch[0]);
      correctionRecord = {
        type: 'natural_language',
        original: { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat },
        corrected: { calories: updatedAnalysis.calories, protein: updatedAnalysis.protein, carbs: updatedAnalysis.carbs, fat: updatedAnalysis.fat },
        userInput: corrections,
        correctionApplied: updatedAnalysis.correctionApplied,
        timestamp: new Date().toISOString(),
      };

    } else if (adjustments && typeof adjustments === 'object') {
      // Direct numeric adjustments
      updatedAnalysis = {
        ...meal.analysis,
        calories: adjustments.calories ?? meal.calories,
        protein: adjustments.protein ?? meal.protein,
        carbs: adjustments.carbs ?? meal.carbs,
        fat: adjustments.fat ?? meal.fat,
        mealName: adjustments.mealName ?? meal.meal_name,
      };

      if (adjustments.macronutrients) updatedAnalysis.macronutrients = adjustments.macronutrients;
      if (adjustments.micronutrients) updatedAnalysis.micronutrients = adjustments.micronutrients;

      correctionRecord = {
        type: 'direct_adjustment',
        original: { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat },
        corrected: { calories: updatedAnalysis.calories, protein: updatedAnalysis.protein, carbs: updatedAnalysis.carbs, fat: updatedAnalysis.fat },
        timestamp: new Date().toISOString(),
      };
    } else {
      return NextResponse.json({ error: 'Provide either corrections (text) or adjustments (object)' }, { status: 400 });
    }

    // Regenerate meal tags with corrected data
    const mealTimeDate = mealTime ? new Date(mealTime) : new Date(meal.meal_time || meal.created_at);
    const newTags = generateMealTags({
      calories: updatedAnalysis.calories || 0,
      protein: updatedAnalysis.protein || 0,
      carbs: updatedAnalysis.carbs || 0,
      fat: updatedAnalysis.fat || 0,
      macronutrients: updatedAnalysis.macronutrients,
      micronutrients: updatedAnalysis.micronutrients,
      mealTime: mealTimeDate,
      ingredients: updatedAnalysis.ingredients || meal.ingredients,
      consumptionType: updatedAnalysis.consumptionType,
    });

    // Build correction history
    const existingHistory = meal.analysis?.correctionHistory || [];
    existingHistory.push(correctionRecord);

    // Update the meal record
    const updateData: Record<string, any> = {
      meal_name: updatedAnalysis.mealName || meal.meal_name,
      calories: updatedAnalysis.calories ?? meal.calories,
      protein: updatedAnalysis.protein ?? meal.protein,
      carbs: updatedAnalysis.carbs ?? meal.carbs,
      fat: updatedAnalysis.fat ?? meal.fat,
      macronutrients: updatedAnalysis.macronutrients || meal.macronutrients,
      micronutrients: updatedAnalysis.micronutrients || meal.micronutrients,
      meal_tags: newTags,
      analysis: { ...(meal.analysis || {}), ...updatedAnalysis, correctionHistory: existingHistory },
      updated_at: new Date().toISOString(),
    };

    if (mealTime) {
      updateData.meal_time = new Date(mealTime).toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from('meals')
      .update(updateData)
      .eq('id', mealId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Meal update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 });
    }

    // Store correction in user learning profile for future accuracy improvement
    await storeUserCorrection(userId, correctionRecord);

    return NextResponse.json({
      success: true,
      mealId,
      correctionApplied: correctionRecord,
      updated: {
        calories: updateData.calories,
        protein: updateData.protein,
        carbs: updateData.carbs,
        fat: updateData.fat,
        meal_name: updateData.meal_name,
        meal_tags: newTags,
      },
    });

  } catch (error: any) {
    console.error('Refinement error:', error);
    return NextResponse.json({ error: error.message || 'Refinement failed' }, { status: 500 });
  }
}

async function storeUserCorrection(userId: string, correction: any) {
  try {
    const { data: existing } = await supabaseAdmin
      .from('user_learning_profile')
      .select('learning_data')
      .eq('user_id', userId)
      .single();

    const learningData = existing?.learning_data || {};
    const corrections = learningData.analysis_corrections || [];
    corrections.push({
      original: `${correction.original.calories}cal, ${correction.original.protein}g protein, ${correction.original.carbs}g carbs`,
      corrected: `${correction.corrected.calories}cal, ${correction.corrected.protein}g protein, ${correction.corrected.carbs}g carbs`,
      category: correction.type,
      input: correction.userInput || 'direct adjustment',
      timestamp: correction.timestamp,
    });

    // Keep last 50 corrections
    if (corrections.length > 50) corrections.splice(0, corrections.length - 50);

    await supabaseAdmin.from('user_learning_profile').upsert({
      user_id: userId,
      learning_data: { ...learningData, analysis_corrections: corrections },
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.warn('Failed to store correction in learning profile:', e);
  }
}
