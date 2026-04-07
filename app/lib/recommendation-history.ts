/**
 * Recommendation History — Lightweight Adaptive Learning
 *
 * Tracks which recommendations have been generated across recent days
 * to classify signals as new, recurring, persistent, improving, or resolved.
 *
 * Does NOT require a new database table. Reads from existing
 * daily_nutrition_summaries + daily_biometric_summaries to detect recurrence.
 */

import type { RecurrenceStatus } from './insight-schema';

export interface HistoricalSignal {
  id: string;          // recommendation ID (e.g., "deficiency_magnesium", "timing_caffeine")
  daysPresent: number; // how many of the last N days this signal was active
  daysTotal: number;   // total days in the window
  trend: 'worsening' | 'stable' | 'improving';
  recentValues?: number[]; // last N values of the metric (newest first)
}

/**
 * Classify recurrence status based on how often a signal appeared recently.
 */
export function classifyRecurrence(daysPresent: number, daysTotal: number, trend: string): RecurrenceStatus {
  if (daysTotal < 3) return 'new';

  const frequency = daysPresent / daysTotal;

  if (frequency === 0) return 'resolved';
  if (trend === 'improving' && frequency < 0.5) return 'improving';
  if (frequency >= 0.7) return 'persistent';
  if (frequency >= 0.3) return 'recurring';
  return 'new';
}

/**
 * Build historical signals from recent daily nutrition summaries.
 * This detects recurring deficiencies and timing issues.
 */
export function buildNutritionHistory(
  recentSummaries: any[], // daily_nutrition_summaries for last 7-14 days
): HistoricalSignal[] {
  if (!recentSummaries || recentSummaries.length === 0) return [];

  const total = recentSummaries.length;
  const signals: HistoricalSignal[] = [];

  // Check deficiency recurrence for key nutrients
  const deficiencyChecks: Array<{ id: string; field: string; threshold: number }> = [
    { id: 'deficiency_magnesium', field: 'pct_dv_magnesium', threshold: 50 },
    { id: 'deficiency_vitamin_d', field: 'pct_dv_vitamin_d', threshold: 50 },
    { id: 'deficiency_iron', field: 'pct_dv_iron', threshold: 50 },
    { id: 'deficiency_fiber', field: 'pct_dv_fiber', threshold: 50 },
    { id: 'deficiency_protein', field: 'pct_dv_protein', threshold: 50 },
    { id: 'deficiency_calcium', field: 'pct_dv_calcium', threshold: 50 },
    { id: 'deficiency_zinc', field: 'pct_dv_zinc', threshold: 50 },
  ];

  for (const check of deficiencyChecks) {
    const values = recentSummaries.map(s => s[check.field]).filter((v: any) => v != null);
    const belowThreshold = values.filter((v: number) => v < check.threshold).length;
    if (belowThreshold > 0) {
      // Trend: compare first half vs second half
      const halfIdx = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, halfIdx);
      const secondHalf = values.slice(halfIdx);
      const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length : 0;
      const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length : 0;
      const trend = secondAvg > firstAvg + 5 ? 'improving' : secondAvg < firstAvg - 5 ? 'worsening' : 'stable';

      signals.push({
        id: check.id,
        daysPresent: belowThreshold,
        daysTotal: total,
        trend: trend as 'worsening' | 'stable' | 'improving',
        recentValues: values.slice(0, 7) as number[],
      });
    }
  }

  // Check timing issues
  const caffeineAfternoon = recentSummaries.filter((s: any) => (s.caffeine_after_2pm || 0) > 50).length;
  if (caffeineAfternoon > 0) {
    signals.push({
      id: 'timing_caffeine_afternoon',
      daysPresent: caffeineAfternoon,
      daysTotal: total,
      trend: 'stable',
    });
  }

  const lateNightMeals = recentSummaries.filter((s: any) => s.has_late_night_meal).length;
  if (lateNightMeals > 0) {
    signals.push({
      id: 'timing_late_meal',
      daysPresent: lateNightMeals,
      daysTotal: total,
      trend: 'stable',
    });
  }

  // Check inflammatory score recurrence
  const highInflammatory = recentSummaries.filter((s: any) => (s.inflammatory_score || 0) > 60).length;
  if (highInflammatory > 0) {
    signals.push({
      id: 'score_high_inflammatory',
      daysPresent: highInflammatory,
      daysTotal: total,
      trend: 'stable',
    });
  }

  // Check adequacy recurrence
  const lowAdequacy = recentSummaries.filter((s: any) => (s.nutrient_adequacy_score || 0) < 40).length;
  if (lowAdequacy > 0) {
    signals.push({
      id: 'score_low_adequacy',
      daysPresent: lowAdequacy,
      daysTotal: total,
      trend: 'stable',
    });
  }

  return signals;
}

/**
 * Match a recommendation ID to its historical signal to get recurrence.
 */
export function getRecurrenceForRecommendation(
  recId: string,
  history: HistoricalSignal[],
): RecurrenceStatus {
  const signal = history.find(s => recId.includes(s.id) || s.id.includes(recId));
  if (!signal) return 'new';
  return classifyRecurrence(signal.daysPresent, signal.daysTotal, signal.trend);
}
