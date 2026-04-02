import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0]!;

    const [bioResult, nutResult, corrResult] = await Promise.all([
      admin.from('daily_biometric_summaries')
        .select('summary_date, sleep_score, recovery_score, hrv, resting_heart_rate, strain, workout_count, avg_7d_sleep_score, avg_7d_recovery, avg_7d_hrv, avg_7d_rhr, trajectory, day_quality')
        .eq('user_id', user.id)
        .gte('summary_date', startStr)
        .order('summary_date', { ascending: true }),
      admin.from('daily_nutrition_summaries')
        .select('summary_date, total_calories, total_protein, total_carbs, total_fat, total_fiber, total_sugar, total_caffeine, total_alcohol, meal_count, nutrient_adequacy_score, inflammatory_score, has_late_night_meal, carbs_after_8pm')
        .eq('user_id', user.id)
        .gte('summary_date', startStr)
        .order('summary_date', { ascending: true }),
      admin.from('correlation_reports')
        .select('report_data')
        .eq('user_id', user.id)
        .single(),
    ]);

    return NextResponse.json({
      biometrics: bioResult.data || [],
      nutrition: nutResult.data || [],
      correlations: corrResult.data?.report_data?.insights || [],
      days,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
