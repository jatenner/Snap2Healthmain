import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { maybeAutoSyncWhoop } from '../../lib/whoop-auto-sync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const today = new Date().toISOString().split('T')[0]!;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;

    // Fetch recent biometric summaries (up to 14 days) — not just today/yesterday
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]!;

    const [recentRes, sleepRes] = await Promise.all([
      admin.from('daily_biometric_summaries')
        .select('*')
        .eq('user_id', user.id)
        .gte('summary_date', twoWeeksAgo)
        .order('summary_date', { ascending: false }),
      admin.from('whoop_sleep')
        .select('start_time, end_time, sleep_performance_pct, sleep_efficiency_pct, sleep_consistency_pct, respiratory_rate, total_in_bed_minutes, total_awake_minutes, total_light_sleep_minutes, total_slow_wave_sleep_minutes, total_rem_sleep_minutes, is_nap, score_state')
        .eq('user_id', user.id).eq('is_nap', false).order('start_time', { ascending: false }).limit(1),
    ]);

    const allRecent = recentRes.data || [];

    // Use most recent available day as "today" (may be 1-2 days old if WHOOP hasn't synced)
    const todayData = allRecent.find((d: any) => d.summary_date === today)
      || allRecent.find((d: any) => d.summary_date === yesterday)
      || allRecent[0]  // fallback to most recent available
      || null;
    const yesterdayData = todayData
      ? allRecent.find((d: any) => d.summary_date !== todayData.summary_date) || null
      : null;

    // Sparkline data: most recent 7 days that have data
    const recentDays = allRecent.slice(0, 10).reverse();

    // Compute week averages
    const avg = (field: string) => {
      const vals = recentDays.map((d: any) => d[field]).filter((v: any) => v != null);
      return vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : null;
    };

    // Calculate how stale the data is
    const latestDate = todayData?.summary_date || null;
    const dataAgeDays = latestDate
      ? Math.floor((Date.now() - new Date(latestDate).getTime()) / 86400000)
      : null;

    // Fire-and-forget: auto-sync WHOOP if stale (must be before return)
    maybeAutoSyncWhoop(user!.id).catch(e =>
      console.error('[body] Background WHOOP sync error:', e)
    );

    return NextResponse.json({
      today: todayData,
      yesterday: yesterdayData,
      sleepDetail: sleepRes.data?.[0] || null,
      recentDays,
      latestDate,
      dataAgeDays,
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
