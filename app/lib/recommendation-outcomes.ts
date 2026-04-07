/**
 * Recommendation Outcomes — Lightweight Effectiveness Tracking
 *
 * Uses signal_memory to determine whether recommendations have been
 * effective, unresolved, or improving over time.
 *
 * This is NOT causal proof. It tracks whether the underlying signal
 * improved after the recommendation was generated.
 */

import type { PersistedSignal } from './signal-memory';

export type EffectivenessStatus =
  | 'unknown'        // not enough data to evaluate
  | 'unresolved'     // recommendation keeps appearing, no improvement
  | 'possibly_effective' // signal is improving
  | 'likely_effective'   // signal resolved or substantially improved
  | 'ineffective';       // signal worsened despite recommendation

export interface RecommendationOutcome {
  recommendationId: string;
  effectivenessStatus: EffectivenessStatus;
  timesTriggered: number;
  timesImproved: number;
  firstSeen: string;
  lastSeen: string;
  daysSinceFirstSeen: number;
  currentlyResolved: boolean;
}

/**
 * Evaluate outcome for a recommendation based on its associated signal memory.
 */
export function evaluateOutcome(
  recId: string,
  signals: PersistedSignal[],
  todayDate: string,
): RecommendationOutcome {
  // Match recommendation ID to signal
  const signal = signals.find(s =>
    recId.includes(s.signal_id) || s.signal_id.includes(recId)
  );

  if (!signal) {
    return {
      recommendationId: recId,
      effectivenessStatus: 'unknown',
      timesTriggered: 0,
      timesImproved: 0,
      firstSeen: todayDate,
      lastSeen: todayDate,
      daysSinceFirstSeen: 0,
      currentlyResolved: false,
    };
  }

  const daysSinceFirst = Math.floor(
    (new Date(todayDate).getTime() - new Date(signal.first_seen).getTime()) / 86400000
  );

  const resolved = signal.current_status === 'resolved';
  const improving = signal.current_status === 'improving' || signal.trend === 'improving';
  const persistent = signal.current_status === 'persistent';
  const improvementRate = signal.times_triggered > 0
    ? signal.times_improved / signal.times_triggered
    : 0;

  let effectiveness: EffectivenessStatus = 'unknown';

  if (daysSinceFirst < 5) {
    effectiveness = 'unknown';  // too early to evaluate
  } else if (resolved) {
    effectiveness = 'likely_effective';
  } else if (improving && improvementRate >= 0.3) {
    effectiveness = 'possibly_effective';
  } else if (persistent && signal.trend === 'worsening') {
    effectiveness = 'ineffective';
  } else if (persistent && daysSinceFirst >= 14) {
    effectiveness = 'unresolved';
  } else if (signal.times_triggered >= 5 && improvementRate < 0.1) {
    effectiveness = 'unresolved';
  }

  return {
    recommendationId: recId,
    effectivenessStatus: effectiveness,
    timesTriggered: signal.times_triggered,
    timesImproved: signal.times_improved,
    firstSeen: signal.first_seen,
    lastSeen: signal.last_seen,
    daysSinceFirstSeen: daysSinceFirst,
    currentlyResolved: resolved,
  };
}

/**
 * Compute priority adjustment based on outcome tracking.
 * Unresolved persistent issues get boosted. Resolved issues get suppressed.
 */
export function outcomePriorityAdjustment(outcome: RecommendationOutcome): number {
  switch (outcome.effectivenessStatus) {
    case 'unresolved': return 8;       // persistent problem, needs more attention
    case 'ineffective': return -5;     // consider different approach
    case 'possibly_effective': return 3; // keep going
    case 'likely_effective': return -10; // resolved, lower priority
    case 'unknown': return 0;
    default: return 0;
  }
}
