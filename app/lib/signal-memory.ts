/**
 * Signal Memory — Persistent Longitudinal Signal Tracking
 *
 * Stores and updates recurring signals across sessions so the system
 * can distinguish one-off events from persistent patterns without
 * recomputing history from raw summaries every time.
 *
 * Write point: called after buildInsight() in /api/today
 * Read point: called before generateRankedRecommendations()
 */

import { createClient } from '@supabase/supabase-js';
import type { RecurrenceStatus } from './insight-schema';
import type { HistoricalSignal } from './recommendation-history';
import { classifyRecurrence } from './recommendation-history';

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export interface PersistedSignal {
  signal_id: string;
  category: string;
  first_seen: string;
  last_seen: string;
  times_triggered: number;
  times_improved: number;
  days_present_last_14: number;
  days_total_last_14: number;
  current_status: RecurrenceStatus;
  trend: 'worsening' | 'stable' | 'improving';
  recent_values: number[] | null;
}

/**
 * Load all active signals for a user from the signal_memory table.
 */
export async function loadSignalMemory(userId: string): Promise<PersistedSignal[]> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from('signal_memory')
    .select('signal_id, category, first_seen, last_seen, times_triggered, times_improved, days_present_last_14, days_total_last_14, current_status, trend, recent_values')
    .eq('user_id', userId)
    .neq('current_status', 'resolved')
    .order('times_triggered', { ascending: false });

  if (error) {
    console.warn('[signal-memory] Load failed:', error.message);
    return [];
  }
  return (data || []) as PersistedSignal[];
}

/**
 * Sync today's detected signals into the persistent memory table.
 * - New signals get inserted
 * - Existing signals get updated (times_triggered++, status recalculated)
 * - Signals not seen today but previously active may be marked improving/resolved
 */
export async function syncSignalMemory(
  userId: string,
  todayDate: string,
  todaySignals: HistoricalSignal[],
): Promise<void> {
  const supabase = getAdmin();

  // Load existing memory
  const { data: existing } = await supabase
    .from('signal_memory')
    .select('*')
    .eq('user_id', userId);

  const existingMap = new Map<string, any>();
  for (const row of (existing || [])) {
    existingMap.set(row.signal_id, row);
  }

  const todaySignalIds = new Set(todaySignals.map(s => s.id));

  // Upsert today's signals
  for (const signal of todaySignals) {
    const prev = existingMap.get(signal.id);
    const status = classifyRecurrence(signal.daysPresent, signal.daysTotal, signal.trend);

    if (prev) {
      // Update existing
      await supabase.from('signal_memory').update({
        last_seen: todayDate,
        times_triggered: (prev.times_triggered || 0) + 1,
        times_improved: signal.trend === 'improving' ? (prev.times_improved || 0) + 1 : prev.times_improved,
        days_present_last_14: signal.daysPresent,
        days_total_last_14: signal.daysTotal,
        current_status: status,
        trend: signal.trend,
        recent_values: signal.recentValues || prev.recent_values,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).eq('signal_id', signal.id);
    } else {
      // Insert new
      await supabase.from('signal_memory').insert({
        user_id: userId,
        signal_id: signal.id,
        category: inferCategory(signal.id),
        first_seen: todayDate,
        last_seen: todayDate,
        times_triggered: 1,
        times_improved: 0,
        days_present_last_14: signal.daysPresent,
        days_total_last_14: signal.daysTotal,
        current_status: status,
        trend: signal.trend,
        recent_values: signal.recentValues || null,
      });
    }
  }

  // Mark signals not seen today but previously active: check if improving or resolved
  for (const [signalId, prev] of Array.from(existingMap.entries())) {
    if (!todaySignalIds.has(signalId) && prev.current_status !== 'resolved') {
      // Signal was previously active but not triggered today
      const daysSinceLastSeen = Math.floor(
        (new Date(todayDate).getTime() - new Date(prev.last_seen).getTime()) / 86400000
      );

      let newStatus: RecurrenceStatus = prev.current_status;
      if (daysSinceLastSeen >= 7) {
        newStatus = 'resolved';
      } else if (daysSinceLastSeen >= 3) {
        newStatus = 'improving';
      }

      if (newStatus !== prev.current_status) {
        await supabase.from('signal_memory').update({
          current_status: newStatus,
          trend: newStatus === 'resolved' ? 'improving' : prev.trend,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId).eq('signal_id', signalId);
      }
    }
  }
}

function inferCategory(signalId: string): string {
  if (signalId.startsWith('deficiency_')) return 'deficiency';
  if (signalId.startsWith('timing_')) return 'timing';
  if (signalId.startsWith('score_')) return 'score';
  if (signalId.startsWith('pattern_')) return 'pattern';
  if (signalId.startsWith('biometric_')) return 'biometric';
  return 'general';
}
