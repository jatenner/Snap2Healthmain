import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { computeDailyNutritionSummary } from '../../lib/daily-summaries';
import { generateMealTags } from '../../lib/meal-tagger';

export const dynamic = 'force-dynamic';

// GET: Return all available presets (global + user's custom)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: presets, error } = await admin
      .from('quick_add_presets')
      .select('*')
      .or(`is_global.eq.true,user_id.eq.${user.id}`)
      .order('use_count', { ascending: false });

    if (error) {
      console.error('[quick-add] Error fetching presets:', error);
      return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
    }

    // Group by intake_type for easier frontend rendering
    const grouped: Record<string, any[]> = {};
    for (const preset of presets || []) {
      const type = preset.intake_type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(preset);
    }

    return NextResponse.json({ presets: presets || [], grouped });
  } catch (error: any) {
    console.error('[quick-add] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Log an intake from a preset or raw data
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { presetId, intakeType, name, mealTime, nutrients } = body;

    let mealRecord: Record<string, any>;

    if (presetId) {
      // Load preset data
      const { data: preset, error: presetError } = await admin
        .from('quick_add_presets')
        .select('*')
        .eq('id', presetId)
        .single();

      if (presetError || !preset) {
        return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
      }

      const mealTimeNow = mealTime ? new Date(mealTime) : new Date();

      const tags = generateMealTags({
        calories: preset.calories || 0,
        protein: preset.protein || 0,
        carbs: preset.carbs || 0,
        fat: preset.fat || 0,
        macronutrients: preset.macronutrients,
        micronutrients: preset.micronutrients,
        mealTime: mealTimeNow,
        consumptionType: preset.intake_type,
      });

      mealRecord = {
        user_id: user.id,
        meal_name: preset.name,
        intake_type: preset.intake_type,
        calories: preset.calories || 0,
        protein: preset.protein || 0,
        carbs: preset.carbs || 0,
        fat: preset.fat || 0,
        macronutrients: preset.macronutrients || [],
        micronutrients: preset.micronutrients || [],
        water_ml: preset.water_ml,
        meal_time: mealTimeNow.toISOString(),
        meal_tags: tags,
        ingredients: [],
        benefits: [],
        concerns: [],
        suggestions: [],
        analysis: { source: 'quick_add', presetId: preset.id, presetName: preset.name },
      };

      // Increment use_count on the preset (background, non-blocking)
      Promise.resolve(
        admin
          .from('quick_add_presets')
          .update({ use_count: (preset.use_count || 0) + 1 })
          .eq('id', presetId)
      ).catch((e: any) => console.error('[quick-add] Failed to update use_count:', e));

    } else {
      // Raw data quick-add (custom entry)
      if (!intakeType || !name) {
        return NextResponse.json({ error: 'intakeType and name are required' }, { status: 400 });
      }

      const mealTimeNow = mealTime ? new Date(mealTime) : new Date();
      const n = nutrients || {};

      const tags = generateMealTags({
        calories: n.calories || 0,
        protein: n.protein || 0,
        carbs: n.carbs || 0,
        fat: n.fat || 0,
        macronutrients: n.macronutrients || [],
        micronutrients: n.micronutrients || [],
        mealTime: mealTimeNow,
        consumptionType: intakeType,
      });

      mealRecord = {
        user_id: user.id,
        meal_name: name,
        intake_type: intakeType,
        calories: n.calories || 0,
        protein: n.protein || 0,
        carbs: n.carbs || 0,
        fat: n.fat || 0,
        macronutrients: n.macronutrients || [],
        micronutrients: n.micronutrients || [],
        water_ml: n.water_ml || null,
        meal_time: mealTimeNow.toISOString(),
        meal_tags: tags,
        ingredients: [],
        benefits: [],
        concerns: [],
        suggestions: [],
        analysis: { source: 'quick_add', custom: true },
      };
    }

    // Insert into meals table
    const { data: insertedMeal, error: insertError } = await admin
      .from('meals')
      .insert([mealRecord])
      .select('id')
      .single();

    if (insertError) {
      console.error('[quick-add] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save intake' }, { status: 500 });
    }

    // Recompute daily summary in background
    const dateStr = (mealRecord.meal_time as string).split('T')[0]!;
    computeDailyNutritionSummary(user.id, dateStr).catch(e =>
      console.error('[quick-add] Background summary error:', e)
    );

    return NextResponse.json({
      success: true,
      mealId: insertedMeal?.id,
      intakeType: mealRecord.intake_type,
      name: mealRecord.meal_name,
    });
  } catch (error: any) {
    console.error('[quick-add] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
