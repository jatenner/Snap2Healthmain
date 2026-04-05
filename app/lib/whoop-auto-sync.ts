// Auto-sync WHOOP data when stale.
// Called from /api/today and /api/body as fire-and-forget background task.
// Only syncs if connected AND last sync was >4 hours ago.

import { createClient } from '@supabase/supabase-js';
import { syncWhoopData } from './whoop';
import { computeDailyBiometricSummary } from './daily-summaries';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const SYNC_INTERVAL_HOURS = 4;

export async function maybeAutoSyncWhoop(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  try {
    // Check if user has a WHOOP connection
    const { data: connection } = await supabase
      .from('whoop_connections')
      .select('last_sync_at')
      .eq('user_id', userId)
      .single();

    if (!connection) return false; // No WHOOP connected

    // Check if sync is stale
    const lastSync = connection.last_sync_at ? new Date(connection.last_sync_at) : null;
    const hoursSince = lastSync
      ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
      : Infinity;

    if (hoursSince < SYNC_INTERVAL_HOURS) {
      return false; // Recent enough, skip
    }

    console.log(`[whoop-auto-sync] Syncing for user ${userId} (last sync ${lastSync ? Math.round(hoursSince) + 'h ago' : 'never'})`);

    // Run the sync
    const results = await syncWhoopData(userId);

    // Update last_sync_at
    await supabase
      .from('whoop_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Recompute biometric summaries for today and yesterday
    const today = new Date().toISOString().split('T')[0]!;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;

    await Promise.all([
      computeDailyBiometricSummary(userId, today).catch(() => {}),
      computeDailyBiometricSummary(userId, yesterday).catch(() => {}),
    ]);

    console.log(`[whoop-auto-sync] Done for user ${userId}:`, results);
    return true;
  } catch (error) {
    console.error('[whoop-auto-sync] Error:', error);
    return false;
  }
}
