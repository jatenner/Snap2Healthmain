import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const today = new Date().toISOString().split('T')[0]!;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!;

    const [todayRes, yesterdayRes, weekRes, sleepRes] = await Promise.all([
      admin.from('daily_biometric_summaries').select('*').eq('user_id', user.id).eq('summary_date', today).single(),
      admin.from('daily_biometric_summaries').select('*').eq('user_id', user.id).eq('summary_date', yesterday).single(),
      admin.from('daily_biometric_summaries')
        .select('summary_date, sleep_score, recovery_score, hrv, resting_heart_rate, strain, respiratory_rate, deep_sleep_minutes, rem_sleep_minutes, workout_count, day_quality')
        .eq('user_id', user.id).gte('summary_date', weekAgo).order('summary_date', { ascending: true }),
      admin.from('whoop_sleep')
        .select('start_time, end_time, sleep_performance_pct, sleep_efficiency_pct, sleep_consistency_pct, respiratory_rate, total_in_bed_minutes, total_awake_minutes, total_light_sleep_minutes, total_slow_wave_sleep_minutes, total_rem_sleep_minutes, is_nap, score_state')
        .eq('user_id', user.id).eq('is_nap', false).order('start_time', { ascending: false }).limit(1),
    ]);

    const todayData = todayRes.data;
    const recentDays = weekRes.data || [];

    // Compute week averages
    const avg = (field: string) => {
      const vals = recentDays.map((d: any) => d[field]).filter((v: any) => v != null);
      return vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : null;
    };

    return NextResponse.json({
      today: todayData,
      yesterday: yesterdayRes.data,
      sleepDetail: sleepRes.data?.[0] || null,
      recentDays,
      weekAvg: {
        sleepScore: avg('sleep_score'),
        recovery: avg('recovery_score'),
        hrv: avg('hrv'),
        rhr: avg('resting_heart_rate'),
        strain: avg('strain'),
        respiratoryRate: avg('respiratory_rate'),
      },
      baseline: todayData ? {
        hrv: todayData.baseline_hrv,
        rhr: todayData.baseline_rhr,
        recovery: todayData.baseline_recovery,
        sleepScore: todayData.baseline_sleep_score,
      } : null,
      trajectory: todayData?.trajectory || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
