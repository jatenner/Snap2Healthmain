import { createClient } from '@supabase/supabase-js';
import { getAllPersonalizedTargets, UserProfile } from './personalized-nutrition-calculator';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================================
// Daily Value targets for key nutrients (FDA reference)
// ============================================================================

const DAILY_VALUES: Record<string, number> = {
  protein: 50,           // g
  fiber: 28,             // g
  vitamin_d: 20,         // mcg
  vitamin_c: 90,         // mg
  vitamin_b12: 2.4,      // mcg
  calcium: 1300,         // mg
  iron: 18,              // mg
  magnesium: 420,        // mg
  potassium: 4700,       // mg
  zinc: 11,              // mg
  vitamin_a: 900,        // mcg
  folate: 400,           // mcg
  vitamin_e: 15,         // mg
  vitamin_k: 120,        // mcg
  selenium: 55,          // mcg
  sodium: 2300,          // mg (upper limit)
};

// Map micronutrient names from meal analysis to our field names
const MICRO_NAME_MAP: Record<string, string> = {
  'vitamin d': 'vitamin_d',
  'vitamin c': 'vitamin_c',
  'vitamin b12': 'vitamin_b12',
  'calcium': 'calcium',
  'iron': 'iron',
  'magnesium': 'magnesium',
  'potassium': 'potassium',
  'zinc': 'zinc',
  'vitamin a': 'vitamin_a',
  'folate': 'folate',
  'vitamin b9 (folate)': 'folate',
  'vitamin b9': 'folate',
  'vitamin e': 'vitamin_e',
  'vitamin k': 'vitamin_k',
  'selenium': 'selenium',
  'omega-3': 'omega3',
  'omega 3': 'omega3',
  'sodium': 'sodium',
  'fiber': 'fiber',
  'dietary fiber': 'fiber',
  'sugar': 'sugar',
  'total sugar': 'sugar',
  'total sugars': 'sugar',
  'omega-3 (epa+dha)': 'omega3',
  'epa+dha': 'omega3',
  'tryptophan': 'tryptophan',
  'choline': 'choline',
};

function normalizeMicroName(name: string): string | null {
  const lower = name.toLowerCase().trim();
  // Direct match
  if (MICRO_NAME_MAP[lower]) return MICRO_NAME_MAP[lower];
  // Partial match
  for (const [key, val] of Object.entries(MICRO_NAME_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

// ============================================================================
// COMPUTE DAILY NUTRITION SUMMARY
// ============================================================================

export async function computeDailyNutritionSummary(userId: string, date: string, profile?: UserProfile | null) {
  const supabase = getSupabaseAdmin();

  // Get all meals for this user on this date
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data: meals, error } = await supabase
    .from('meals')
    .select('calories, protein, carbs, fat, macronutrients, micronutrients, meal_time, meal_tags, created_at')
    .eq('user_id', userId)
    .gte('meal_time', dayStart)
    .lt('meal_time', dayEnd + '.999')
    .order('meal_time', { ascending: true });

  if (error) {
    console.error('Error fetching meals for summary:', error.message);
    return null;
  }

  if (!meals || meals.length === 0) return null;

  // Initialize accumulators
  const summary: Record<string, any> = {
    user_id: userId,
    summary_date: date,
    meal_count: meals.length,
    first_meal_time: (meals[0] as any).meal_time || (meals[0] as any).created_at,
    last_meal_time: (meals[meals.length - 1] as any).meal_time || (meals[meals.length - 1] as any).created_at,
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    total_fiber: 0,
    total_sugar: 0,
    total_sodium: 0,
    total_vitamin_d: 0,
    total_vitamin_c: 0,
    total_vitamin_b12: 0,
    total_calcium: 0,
    total_iron: 0,
    total_magnesium: 0,
    total_potassium: 0,
    total_zinc: 0,
    total_omega3: 0,
    total_vitamin_a: 0,
    total_folate: 0,
    total_vitamin_e: 0,
    total_vitamin_k: 0,
    total_selenium: 0,
    carbs_after_8pm: 0,
    sugar_after_8pm: 0,
    has_late_night_meal: false,
    total_caffeine: 0,
    total_alcohol: 0,
    caffeine_after_2pm: 0,
    alcohol_after_8pm: 0,
  };

  // Tag frequency counter
  const tagCounts: Record<string, number> = {};

  for (const meal of meals) {
    // Get meal time for timing analysis
    const mealTime = new Date((meal as any).meal_time || (meal as any).created_at);
    const hour = mealTime.getHours();

    // Accumulate macros
    summary.total_calories += meal.calories || 0;
    summary.total_protein += meal.protein || 0;
    summary.total_carbs += meal.carbs || 0;
    summary.total_fat += meal.fat || 0;

    // Extract fiber, sugar, sodium, caffeine, alcohol from macronutrients array
    if (Array.isArray(meal.macronutrients)) {
      for (const macro of meal.macronutrients) {
        const name = (macro.name || '').toLowerCase();
        if (name.includes('fiber')) summary.total_fiber += macro.amount || 0;
        if (name.includes('sugar')) summary.total_sugar += macro.amount || 0;
        if (name.includes('sodium')) summary.total_sodium += macro.amount || 0;
        if (name.includes('caffeine')) {
          summary.total_caffeine += macro.amount || 0;
          if (hour >= 14) summary.caffeine_after_2pm += macro.amount || 0;
        }
        if (name.includes('alcohol')) {
          summary.total_alcohol += macro.amount || 0;
          if (hour >= 20) summary.alcohol_after_8pm += macro.amount || 0;
        }
      }
    }

    // Extract micronutrients
    if (Array.isArray(meal.micronutrients)) {
      for (const micro of meal.micronutrients) {
        const fieldName = normalizeMicroName(micro.name || '');
        if (fieldName && `total_${fieldName}` in summary) {
          summary[`total_${fieldName}`] += micro.amount || 0;
        }
      }
    }

    // Timing analysis (hour already computed above)
    if (hour >= 21) {
      summary.has_late_night_meal = true;
    }

    if (hour >= 20) {
      summary.carbs_after_8pm += meal.carbs || 0;
      // Extract sugar for after-8pm
      if (Array.isArray(meal.macronutrients)) {
        for (const macro of meal.macronutrients) {
          if ((macro.name || '').toLowerCase().includes('sugar')) {
            summary.sugar_after_8pm += macro.amount || 0;
          }
        }
      }
    }

    // Count meal tags
    if (Array.isArray(meal.meal_tags)) {
      for (const tag of meal.meal_tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  summary.tag_counts = tagCounts;

  // Calculate % DV using personalized targets when available, falling back to FDA defaults
  const personalizedTargets = profile ? getAllPersonalizedTargets(profile) : null;
  const getTarget = (nutrient: string) => personalizedTargets?.[nutrient] || DAILY_VALUES[nutrient] || 1;
  const dv = (nutrient: string, total: number) => Math.round((total / getTarget(nutrient)) * 100);

  summary.pct_dv_protein = dv('protein', summary.total_protein);
  summary.pct_dv_fiber = dv('fiber', summary.total_fiber);
  summary.pct_dv_vitamin_d = dv('vitamin_d', summary.total_vitamin_d);
  summary.pct_dv_vitamin_c = dv('vitamin_c', summary.total_vitamin_c);
  summary.pct_dv_vitamin_b12 = dv('vitamin_b12', summary.total_vitamin_b12);
  summary.pct_dv_calcium = dv('calcium', summary.total_calcium);
  summary.pct_dv_iron = dv('iron', summary.total_iron);
  summary.pct_dv_magnesium = dv('magnesium', summary.total_magnesium);
  summary.pct_dv_potassium = dv('potassium', summary.total_potassium);
  summary.pct_dv_zinc = dv('zinc', summary.total_zinc);

  // Store personalized targets for reference
  if (personalizedTargets) {
    summary.personalized_targets = personalizedTargets;
  }

  // Nutrient adequacy score: % of key nutrients meeting >= 80% DV
  const keyNutrientPcts = [
    summary.pct_dv_protein, summary.pct_dv_fiber, summary.pct_dv_vitamin_d,
    summary.pct_dv_vitamin_c, summary.pct_dv_calcium, summary.pct_dv_iron,
    summary.pct_dv_magnesium, summary.pct_dv_potassium, summary.pct_dv_zinc,
    summary.pct_dv_vitamin_b12,
  ];
  const adequate = keyNutrientPcts.filter(p => p >= 80).length;
  summary.nutrient_adequacy_score = Math.round((adequate / keyNutrientPcts.length) * 100);

  // Inflammatory score (simple heuristic 0-100, higher = more inflammatory)
  // Factors: high sugar, high sodium, low fiber, processed food tags
  let inflammatoryScore = 50; // neutral baseline
  if (summary.total_sugar > 50) inflammatoryScore += 10;
  if (summary.total_sugar > 80) inflammatoryScore += 10;
  if (summary.total_sodium > 2300) inflammatoryScore += 10;
  if (summary.total_sodium > 3500) inflammatoryScore += 10;
  if (summary.total_fiber < 15) inflammatoryScore += 10;
  if (summary.total_fiber >= 28) inflammatoryScore -= 15;
  if (tagCounts['ultra_processed']) inflammatoryScore += tagCounts['ultra_processed'] * 5;
  if (tagCounts['high_sugar']) inflammatoryScore += tagCounts['high_sugar'] * 5;
  // Anti-inflammatory foods reduce score
  if (summary.total_vitamin_c > 60) inflammatoryScore -= 5;
  if (summary.total_omega3 > 250) inflammatoryScore -= 10;
  summary.inflammatory_score = Math.max(0, Math.min(100, inflammatoryScore));

  // Calculate rolling averages from prior summaries
  const { data: priorSummaries } = await supabase
    .from('daily_nutrition_summaries')
    .select('total_calories, total_protein, total_fiber, total_sugar, nutrient_adequacy_score, summary_date')
    .eq('user_id', userId)
    .lt('summary_date', date)
    .order('summary_date', { ascending: false })
    .limit(14);

  if (priorSummaries && priorSummaries.length > 0) {
    const last7 = priorSummaries.slice(0, Math.min(7, priorSummaries.length));
    const last14 = priorSummaries;

    const avg = (arr: any[], field: string) => {
      const vals = arr.map(r => r[field]).filter(v => v != null);
      return vals.length > 0 ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : null;
    };

    summary.avg_7d_calories = avg(last7, 'total_calories');
    summary.avg_7d_protein = avg(last7, 'total_protein');
    summary.avg_7d_fiber = avg(last7, 'total_fiber');
    summary.avg_7d_sugar = avg(last7, 'total_sugar');
    summary.avg_14d_nutrient_adequacy = avg(last14, 'nutrient_adequacy_score');
  }

  summary.updated_at = new Date().toISOString();

  // Upsert
  const { error: upsertError } = await supabase
    .from('daily_nutrition_summaries')
    .upsert(summary, { onConflict: 'user_id,summary_date' });

  if (upsertError) {
    console.error('Nutrition summary upsert error:', upsertError.message);
    return null;
  }

  return summary;
}

// ============================================================================
// COMPUTE DAILY BIOMETRIC SUMMARY
// ============================================================================

export async function computeDailyBiometricSummary(userId: string, date: string) {
  const supabase = getSupabaseAdmin();

  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59.999`;

  // Fetch sleep, cycle, and workouts for this date
  const [sleepResult, cycleResult, workoutResult] = await Promise.all([
    supabase.from('whoop_sleep')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', dayStart)
      .lt('start_time', dayEnd)
      .eq('is_nap', false)
      .order('start_time', { ascending: false })
      .limit(1),
    supabase.from('whoop_cycles')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', dayStart)
      .lt('start_time', dayEnd)
      .order('start_time', { ascending: false })
      .limit(1),
    supabase.from('whoop_workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', dayStart)
      .lt('start_time', dayEnd),
  ]);

  const sleep = sleepResult.data?.[0];
  const cycle = cycleResult.data?.[0];
  const workouts = workoutResult.data || [];

  // Recovery is linked to cycles — look it up by cycle_id, not by created_at
  let recovery: any = null;
  if (cycle) {
    const { data: recData } = await supabase
      .from('whoop_recovery')
      .select('*')
      .eq('user_id', userId)
      .eq('whoop_cycle_id', cycle.whoop_cycle_id)
      .limit(1)
      .single();
    recovery = recData;
  }

  // Need at least some data to create a summary
  if (!sleep && !recovery && !cycle) return null;

  const summary: Record<string, any> = {
    user_id: userId,
    summary_date: date,
  };

  // Sleep metrics
  if (sleep && sleep.score_state === 'SCORED') {
    summary.sleep_score = sleep.sleep_performance_pct;
    summary.sleep_efficiency = sleep.sleep_efficiency_pct;
    summary.sleep_consistency = sleep.sleep_consistency_pct;
    summary.respiratory_rate = sleep.respiratory_rate;
    summary.deep_sleep_minutes = sleep.total_slow_wave_sleep_minutes;
    summary.rem_sleep_minutes = sleep.total_rem_sleep_minutes;
    summary.light_sleep_minutes = sleep.total_light_sleep_minutes;
    summary.sleep_start = sleep.start_time;
    summary.sleep_end = sleep.end_time;
    // Duration = in bed - awake
    if (sleep.total_in_bed_minutes != null && sleep.total_awake_minutes != null) {
      summary.sleep_duration_minutes = sleep.total_in_bed_minutes - sleep.total_awake_minutes;
    }
  }

  // Recovery metrics
  if (recovery && recovery.score_state === 'SCORED') {
    summary.recovery_score = recovery.recovery_score;
    summary.hrv = recovery.hrv_rmssd_milli;
    summary.resting_heart_rate = recovery.resting_heart_rate;
    summary.spo2 = recovery.spo2_pct;
    summary.skin_temp = recovery.skin_temp_celsius;
  }

  // Cycle metrics
  if (cycle && cycle.score_state === 'SCORED') {
    summary.strain = cycle.strain;
    summary.total_kilojoules = cycle.kilojoule;
    summary.avg_heart_rate = cycle.average_heart_rate;
    summary.max_heart_rate = cycle.max_heart_rate;
  }

  // Workout summary
  summary.workout_count = workouts.length;
  summary.total_workout_strain = workouts.reduce((s: number, w: any) => s + (w.strain || 0), 0);
  summary.total_workout_kilojoules = workouts.reduce((s: number, w: any) => s + (w.kilojoule || 0), 0);
  summary.workout_types = Array.from(new Set(workouts.map((w: any) => w.raw_data?.sport_name).filter(Boolean)));

  // Calculate rolling averages and baselines from prior summaries
  const { data: priorSummaries } = await supabase
    .from('daily_biometric_summaries')
    .select('sleep_score, recovery_score, hrv, resting_heart_rate, strain, respiratory_rate, summary_date')
    .eq('user_id', userId)
    .lt('summary_date', date)
    .order('summary_date', { ascending: false })
    .limit(30);

  if (priorSummaries && priorSummaries.length > 0) {
    const avg = (arr: any[], field: string) => {
      const vals = arr.map(r => r[field]).filter((v: any) => v != null);
      return vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : null;
    };

    const last7 = priorSummaries.slice(0, Math.min(7, priorSummaries.length));
    const last30 = priorSummaries;

    // 7-day rolling averages
    summary.avg_7d_sleep_score = avg(last7, 'sleep_score');
    summary.avg_7d_recovery = avg(last7, 'recovery_score');
    summary.avg_7d_hrv = avg(last7, 'hrv');
    summary.avg_7d_rhr = avg(last7, 'resting_heart_rate');
    summary.avg_7d_strain = avg(last7, 'strain');
    summary.avg_7d_respiratory_rate = avg(last7, 'respiratory_rate');

    // 30-day baselines
    summary.baseline_hrv = avg(last30, 'hrv');
    summary.baseline_rhr = avg(last30, 'resting_heart_rate');
    summary.baseline_recovery = avg(last30, 'recovery_score');
    summary.baseline_sleep_score = avg(last30, 'sleep_score');

    // Deviations (% difference from baseline)
    if (summary.hrv != null && summary.baseline_hrv) {
      summary.hrv_deviation = Math.round(((summary.hrv - summary.baseline_hrv) / summary.baseline_hrv) * 100 * 10) / 10;
    }
    if (summary.resting_heart_rate != null && summary.baseline_rhr) {
      summary.rhr_deviation = Math.round(((summary.resting_heart_rate - summary.baseline_rhr) / summary.baseline_rhr) * 100 * 10) / 10;
    }
    if (summary.recovery_score != null && summary.baseline_recovery) {
      summary.recovery_deviation = Math.round(((summary.recovery_score - summary.baseline_recovery) / summary.baseline_recovery) * 100 * 10) / 10;
    }
    if (summary.sleep_score != null && summary.baseline_sleep_score) {
      summary.sleep_deviation = Math.round(((summary.sleep_score - summary.baseline_sleep_score) / summary.baseline_sleep_score) * 100 * 10) / 10;
    }

    // Trajectory: compare 7d avg to 30d avg
    if (summary.avg_7d_recovery != null && summary.baseline_recovery != null) {
      const diff = summary.avg_7d_recovery - summary.baseline_recovery;
      if (diff > 3) summary.trajectory = 'improving';
      else if (diff < -3) summary.trajectory = 'declining';
      else summary.trajectory = 'stable';
    }
  }

  // Day quality classification based on recovery + sleep
  if (summary.recovery_score != null && summary.sleep_score != null) {
    const combined = (summary.recovery_score + summary.sleep_score) / 2;
    if (combined >= 70) summary.day_quality = 'good';
    else if (combined >= 45) summary.day_quality = 'neutral';
    else summary.day_quality = 'poor';
  } else if (summary.recovery_score != null) {
    if (summary.recovery_score >= 67) summary.day_quality = 'good';
    else if (summary.recovery_score >= 34) summary.day_quality = 'neutral';
    else summary.day_quality = 'poor';
  }

  summary.updated_at = new Date().toISOString();

  // Upsert
  const { error: upsertError } = await supabase
    .from('daily_biometric_summaries')
    .upsert(summary, { onConflict: 'user_id,summary_date' });

  if (upsertError) {
    console.error('Biometric summary upsert error:', upsertError.message);
    return null;
  }

  return summary;
}

// ============================================================================
// COMPUTE ALL SUMMARIES FOR A DATE RANGE
// ============================================================================

export async function computeAllSummaries(userId: string, startDate: string, endDate: string, profile?: UserProfile | null) {
  const results = { nutrition: 0, biometric: 0, errors: 0 };

  // Generate date range
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]!);
    current.setDate(current.getDate() + 1);
  }

  // Process dates sequentially (rolling averages depend on prior days)
  for (const date of dates) {
    try {
      const nutResult = await computeDailyNutritionSummary(userId, date, profile);
      if (nutResult) results.nutrition++;
    } catch (e) {
      console.error(`Nutrition summary error for ${date}:`, e);
      results.errors++;
    }

    try {
      const bioResult = await computeDailyBiometricSummary(userId, date);
      if (bioResult) results.biometric++;
    } catch (e) {
      console.error(`Biometric summary error for ${date}:`, e);
      results.errors++;
    }
  }

  return results;
}
