/**
 * Weekly Intelligence — Structured Weekly Review
 *
 * Generates a deterministic weekly summary answering:
 * - What improved this week?
 * - What worsened?
 * - What repeated?
 * - What mattered most?
 * - What to try next week?
 *
 * Structure: deterministic first, LLM narration optional.
 */

import type { PersistedSignal } from './signal-memory';

export interface WeeklyWin {
  label: string;
  detail: string;
  metric?: string;
  delta?: number;
}

export interface WeeklyRisk {
  label: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
  signalId?: string;
}

export interface WeeklySummary {
  weekOf: string;           // YYYY-MM-DD (Monday of the week)
  daysLogged: number;
  totalMeals: number;

  // Deltas (this week vs prior week)
  avgCaloriesDelta: number | null;
  avgProteinDelta: number | null;
  avgFiberDelta: number | null;
  avgSleepDelta: number | null;
  avgRecoveryDelta: number | null;
  avgHrvDelta: number | null;

  // Highlights
  wins: WeeklyWin[];
  risks: WeeklyRisk[];
  topPattern: string | null;
  unresolvedCount: number;
  resolvedCount: number;
  improvingCount: number;

  // Action
  focusRecommendation: string | null;
}

/**
 * Build weekly intelligence from daily summaries + signal memory.
 */
export function buildWeeklySummary(
  thisWeekNutrition: any[],    // daily_nutrition_summaries for this week
  lastWeekNutrition: any[],    // daily_nutrition_summaries for prior week
  thisWeekBiometric: any[],    // daily_biometric_summaries for this week
  lastWeekBiometric: any[],    // daily_biometric_summaries for prior week
  signals: PersistedSignal[],
  weekStart: string,
): WeeklySummary {
  const avg = (arr: any[], field: string) => {
    const vals = arr.map(r => r[field]).filter((v: any) => v != null && !isNaN(v));
    return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  };

  const delta = (thisArr: any[], lastArr: any[], field: string) => {
    const thisAvg = avg(thisArr, field);
    const lastAvg = avg(lastArr, field);
    if (thisAvg == null || lastAvg == null) return null;
    return Math.round((thisAvg - lastAvg) * 10) / 10;
  };

  const totalMeals = thisWeekNutrition.reduce((s: number, d: any) => s + (d.meal_count || 0), 0);

  // Compute deltas
  const calDelta = delta(thisWeekNutrition, lastWeekNutrition, 'total_calories');
  const protDelta = delta(thisWeekNutrition, lastWeekNutrition, 'total_protein');
  const fiberDelta = delta(thisWeekNutrition, lastWeekNutrition, 'total_fiber');
  const sleepDelta = delta(thisWeekBiometric, lastWeekBiometric, 'sleep_score');
  const recovDelta = delta(thisWeekBiometric, lastWeekBiometric, 'recovery_score');
  const hrvDelta = delta(thisWeekBiometric, lastWeekBiometric, 'hrv');

  // Build wins
  const wins: WeeklyWin[] = [];
  if (protDelta != null && protDelta > 5) wins.push({ label: 'Protein up', detail: `+${protDelta}g avg daily protein vs last week`, metric: 'protein', delta: protDelta });
  if (fiberDelta != null && fiberDelta > 3) wins.push({ label: 'Fiber up', detail: `+${fiberDelta}g avg daily fiber vs last week`, metric: 'fiber', delta: fiberDelta });
  if (sleepDelta != null && sleepDelta > 3) wins.push({ label: 'Sleep improved', detail: `+${sleepDelta}% avg sleep score vs last week`, metric: 'sleep', delta: sleepDelta });
  if (recovDelta != null && recovDelta > 3) wins.push({ label: 'Recovery improved', detail: `+${recovDelta}% avg recovery vs last week`, metric: 'recovery', delta: recovDelta });
  if (hrvDelta != null && hrvDelta > 2) wins.push({ label: 'HRV up', detail: `+${hrvDelta}ms avg HRV vs last week`, metric: 'hrv', delta: hrvDelta });

  const resolvedSignals = signals.filter(s => s.current_status === 'resolved');
  if (resolvedSignals.length > 0) {
    wins.push({ label: `${resolvedSignals.length} issue(s) resolved`, detail: resolvedSignals.map(s => s.signal_id.replace(/_/g, ' ')).join(', ') });
  }

  // Build risks
  const risks: WeeklyRisk[] = [];
  const persistentSignals = signals.filter(s => s.current_status === 'persistent');
  for (const sig of persistentSignals.slice(0, 3)) {
    risks.push({
      label: sig.signal_id.replace(/_/g, ' '),
      detail: `Persistent for ${sig.times_triggered}+ days`,
      severity: sig.times_triggered >= 10 ? 'high' : 'medium',
      signalId: sig.signal_id,
    });
  }

  if (sleepDelta != null && sleepDelta < -5) risks.push({ label: 'Sleep declining', detail: `${sleepDelta}% avg sleep vs last week`, severity: 'high' });
  if (recovDelta != null && recovDelta < -5) risks.push({ label: 'Recovery declining', detail: `${recovDelta}% avg recovery vs last week`, severity: 'high' });

  // Top pattern (from persistent signals)
  const topPattern = persistentSignals.length > 0
    ? `Most persistent issue: ${persistentSignals[0]!.signal_id.replace(/_/g, ' ')} (${persistentSignals[0]!.times_triggered} occurrences)`
    : null;

  // Focus recommendation
  let focusRec: string | null = null;
  if (persistentSignals.length > 0) {
    const top = persistentSignals[0]!;
    if (top.signal_id.includes('deficiency')) {
      focusRec = `Focus on improving ${top.signal_id.replace('deficiency_', '')} intake this week`;
    } else if (top.signal_id.includes('caffeine')) {
      focusRec = 'Try keeping all caffeine before 2pm this week';
    } else if (top.signal_id.includes('inflammatory')) {
      focusRec = 'Focus on anti-inflammatory foods: vegetables, fish, and berries';
    } else {
      focusRec = `Address: ${top.signal_id.replace(/_/g, ' ')}`;
    }
  } else if (risks.length > 0) {
    focusRec = `Monitor: ${risks[0]!.label}`;
  }

  return {
    weekOf: weekStart,
    daysLogged: thisWeekNutrition.length,
    totalMeals,
    avgCaloriesDelta: calDelta,
    avgProteinDelta: protDelta,
    avgFiberDelta: fiberDelta,
    avgSleepDelta: sleepDelta,
    avgRecoveryDelta: recovDelta,
    avgHrvDelta: hrvDelta,
    wins,
    risks,
    topPattern,
    unresolvedCount: signals.filter(s => s.current_status === 'persistent' || s.current_status === 'recurring').length,
    resolvedCount: resolvedSignals.length,
    improvingCount: signals.filter(s => s.current_status === 'improving').length,
    focusRecommendation: focusRec,
  };
}
