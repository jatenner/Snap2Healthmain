// Recurring Habits: auto-logs daily habits that haven't been logged today.
// Called from /api/today as a background task.

import { createClient } from '@supabase/supabase-js';
import { generateMealTags } from './meal-tagger';
import { computeDailyNutritionSummary } from './daily-summaries';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isDueToday(frequency: string): boolean {
  const day = new Date().getDay(); // 0=Sun, 6=Sat
  if (frequency === 'daily') return true;
  if (frequency === 'weekdays') return day >= 1 && day <= 5;
  if (frequency === 'weekends') return day === 0 || day === 6;
  return true;
}

export async function autoLogRecurringHabits(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0]!;

  // Fetch all active habits for this user that haven't been logged today
  const { data: habits, error } = await supabase
    .from('recurring_habits')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .or(`last_logged_date.is.null,last_logged_date.lt.${today}`);

  if (error || !habits || habits.length === 0) return 0;

  let logged = 0;

  for (const habit of habits) {
    if (!isDueToday(habit.frequency)) continue;

    // Build meal time from today's date + habit's time_of_day
    const mealTime = new Date(`${today}T${habit.time_of_day}`);

    const tags = generateMealTags({
      calories: habit.calories || 0,
      protein: habit.protein || 0,
      carbs: habit.carbs || 0,
      fat: habit.fat || 0,
      macronutrients: habit.macronutrients || [],
      micronutrients: habit.micronutrients || [],
      mealTime,
      consumptionType: habit.intake_type,
    });

    const mealRecord = {
      user_id: userId,
      meal_name: habit.name,
      intake_type: habit.intake_type,
      calories: habit.calories || 0,
      protein: habit.protein || 0,
      carbs: habit.carbs || 0,
      fat: habit.fat || 0,
      macronutrients: habit.macronutrients || [],
      micronutrients: habit.micronutrients || [],
      water_ml: habit.water_ml,
      meal_time: mealTime.toISOString(),
      meal_tags: tags,
      ingredients: [],
      benefits: [],
      concerns: [],
      suggestions: [],
      analysis: { source: 'recurring_habit', habitId: habit.id },
    };

    const { error: insertError } = await supabase
      .from('meals')
      .insert([mealRecord]);

    if (!insertError) {
      // Mark as logged today
      await supabase
        .from('recurring_habits')
        .update({ last_logged_date: today })
        .eq('id', habit.id);
      logged++;
    } else {
      console.error(`[recurring-habits] Failed to log "${habit.name}":`, insertError.message);
    }
  }

  // Recompute daily summary if anything was logged
  if (logged > 0) {
    computeDailyNutritionSummary(userId, today).catch(e =>
      console.error('[recurring-habits] Summary recompute error:', e)
    );
  }

  if (logged > 0) {
    console.log(`[recurring-habits] Auto-logged ${logged} habits for user ${userId}`);
  }

  return logged;
}
