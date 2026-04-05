// Auto-refresh correlations when data is stale.
// Called from /api/today as a fire-and-forget background task.

import { createClient } from '@supabase/supabase-js';
import { computeCorrelations, persistSensitivityProfile } from './correlation-engine';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const REFRESH_THRESHOLD_HOURS = 24;
const MIN_NEW_DAYS_FOR_REFRESH = 2;

export async function maybeRefreshCorrelations(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  try {
    // Check when correlations were last generated
    const { data: existing } = await supabase
      .from('correlation_reports')
      .select('generated_at, total_paired_days')
      .eq('user_id', userId)
      .single();

    const now = new Date();

    if (existing?.generated_at) {
      const lastGenerated = new Date(existing.generated_at);
      const hoursSince = (now.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60);

      // Skip if generated recently
      if (hoursSince < REFRESH_THRESHOLD_HOURS) {
        return false;
      }

      // Check if enough new data exists since last generation
      const { count } = await supabase
        .from('daily_nutrition_summaries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('created_at', existing.generated_at);

      if ((count || 0) < MIN_NEW_DAYS_FOR_REFRESH) {
        return false;
      }
    }

    // Fetch user goal
    const { data: profile } = await supabase
      .from('profiles')
      .select('goal')
      .eq('id', userId)
      .single();

    // Recompute correlations
    console.log(`[auto-refresh] Recomputing correlations for user ${userId}`);
    const report = await computeCorrelations(userId, profile?.goal);

    // Cache the report
    await supabase.from('correlation_reports').upsert({
      user_id: userId,
      report_data: report,
      total_paired_days: report.totalPairedDays,
      insight_count: report.insights.length,
      generated_at: report.generatedAt,
    }, { onConflict: 'user_id' });

    // Update sensitivity profile
    await persistSensitivityProfile(userId, report);

    console.log(`[auto-refresh] Correlations refreshed for user ${userId} (${report.totalPairedDays} paired days)`);
    return true;
  } catch (error) {
    console.error('[auto-refresh] Error:', error);
    return false;
  }
}
