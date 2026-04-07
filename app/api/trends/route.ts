import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getUserTimezone, getTodayInTimezone } from '../../lib/timezone-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Timezone-aware date range
    const tz = getUserTimezone(request.headers);
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    const todayStr = getTodayInTimezone(tz);
    const startDate = new Date(todayStr);
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0]!;

    const [bioResult, nutResult, corrResult] = await Promise.all([
      // All biometric fields for comprehensive trend display
      admin.from('daily_biometric_summaries')
        .select('summary_date, sleep_score, recovery_score, hrv, resting_heart_rate, strain, respiratory_rate, deep_sleep_minutes, rem_sleep_minutes, sleep_efficiency, spo2, workout_count, avg_7d_sleep_score, avg_7d_recovery, avg_7d_hrv, avg_7d_rhr, trajectory, day_quality')
        .eq('user_id', user.id)
        .gte('summary_date', startStr)
        .order('summary_date', { ascending: true }),
      // All nutrition fields including micros
      admin.from('daily_nutrition_summaries')
        .select('summary_date, total_calories, total_protein, total_carbs, total_fat, total_fiber, total_sugar, total_caffeine, total_alcohol, total_sodium, total_vitamin_d, total_vitamin_c, total_vitamin_b12, total_calcium, total_iron, total_magnesium, total_potassium, total_zinc, total_omega3, total_water_ml, total_vitamin_a, total_folate, total_selenium, meal_count, nutrient_adequacy_score, inflammatory_score, supplement_count, alcohol_servings, has_late_night_meal, carbs_after_8pm')
        .eq('user_id', user.id)
        .gte('summary_date', startStr)
        .order('summary_date', { ascending: true }),
      admin.from('correlation_reports')
        .select('report_data')
        .eq('user_id', user.id)
        .single(),
    ]);

    const reportData = corrResult.data?.report_data;
    return NextResponse.json({
      biometrics: bioResult.data || [],
      nutrition: nutResult.data || [],
      correlations: reportData?.insights || [],
      outcomeAnalyses: reportData?.outcomeAnalyses || [],
      sensitivities: reportData?.sensitivities || [],
      dataQuality: reportData?.dataQuality || null,
      days,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
