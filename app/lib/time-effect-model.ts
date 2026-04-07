/**
 * Time-Effect Model — Temporal Intelligence for Patterns
 *
 * Adds temporal context to correlation patterns so the system can
 * distinguish same-day, next-day, and rolling effects.
 *
 * Uses the lagDays from correlation pair definitions and enriches
 * patterns with human-readable temporal metadata.
 */

export type TemporalType =
  | 'same_day'       // effect visible same day (e.g., caffeine → tonight's sleep)
  | 'next_day'       // effect visible next day (e.g., protein → tomorrow's recovery)
  | 'evening_overnight' // evening behavior → overnight outcome
  | 'rolling_3d'     // accumulative effect over ~3 days
  | 'rolling_7d';    // accumulative effect over ~7 days

export interface TemporalMetadata {
  temporalType: TemporalType;
  description: string;       // human-readable, e.g., "Affects tonight's sleep"
  lagDays: number;           // from correlation engine
  isAccumulative: boolean;   // true for rolling effects
}

// Map correlation pair IDs to temporal metadata
const TEMPORAL_MAP: Record<string, TemporalMetadata> = {
  // Same-day (lagDays: 0) — timing and sleep
  late_carbs_sleep:           { temporalType: 'evening_overnight', description: 'Affects tonight\'s sleep', lagDays: 0, isAccumulative: false },
  late_sugar_sleep:           { temporalType: 'evening_overnight', description: 'Affects tonight\'s sleep', lagDays: 0, isAccumulative: false },
  late_meal_sleep:            { temporalType: 'evening_overnight', description: 'Affects tonight\'s sleep', lagDays: 0, isAccumulative: false },
  afternoon_caffeine_sleep:   { temporalType: 'same_day', description: 'Affects tonight\'s sleep', lagDays: 0, isAccumulative: false },
  caffeine_sleep_duration:    { temporalType: 'same_day', description: 'Affects sleep duration tonight', lagDays: 0, isAccumulative: false },
  late_alcohol_sleep:         { temporalType: 'evening_overnight', description: 'Affects tonight\'s sleep', lagDays: 0, isAccumulative: false },
  fiber_sleep:                { temporalType: 'same_day', description: 'Affects tonight\'s sleep quality', lagDays: 0, isAccumulative: false },
  magnesium_sleep:            { temporalType: 'same_day', description: 'Affects tonight\'s sleep', lagDays: 0, isAccumulative: false },
  stress_sleep:               { temporalType: 'same_day', description: 'Affects tonight\'s sleep', lagDays: 0, isAccumulative: false },
  energy_recovery:            { temporalType: 'same_day', description: 'Same-day association', lagDays: 0, isAccumulative: false },
  energy_hrv:                 { temporalType: 'same_day', description: 'Same-day association', lagDays: 0, isAccumulative: false },

  // Next-day (lagDays: 1) — recovery and HRV
  alcohol_recovery:           { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: false },
  alcohol_hrv:                { temporalType: 'next_day', description: 'Affects tomorrow\'s HRV', lagDays: 1, isAccumulative: false },
  protein_recovery:           { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: false },
  sugar_recovery:             { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: false },
  sodium_rhr:                 { temporalType: 'next_day', description: 'Affects tomorrow\'s resting HR', lagDays: 1, isAccumulative: false },
  magnesium_hrv:              { temporalType: 'next_day', description: 'Affects tomorrow\'s HRV', lagDays: 1, isAccumulative: false },
  vitamin_d_recovery:         { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: false },
  vitamin_c_recovery:         { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: false },
  zinc_recovery:              { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: false },
  iron_recovery:              { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: false },
  adequacy_recovery:          { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: true },
  inflammatory_hrv:           { temporalType: 'next_day', description: 'Affects tomorrow\'s HRV', lagDays: 1, isAccumulative: true },
  inflammatory_recovery:      { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: true },
  stress_recovery:            { temporalType: 'next_day', description: 'Affects tomorrow\'s recovery', lagDays: 1, isAccumulative: false },
};

/**
 * Get temporal metadata for a correlation pair ID.
 */
export function getTemporalMetadata(pairId: string): TemporalMetadata {
  return TEMPORAL_MAP[pairId] || {
    temporalType: 'same_day',
    description: 'Same-day association',
    lagDays: 0,
    isAccumulative: false,
  };
}

/**
 * Classify a deficiency as rolling based on recurrence.
 * Deficiencies that appear most days are rolling/accumulative issues.
 */
export function classifyDeficiencyTemporal(
  daysPresent: number,
  daysTotal: number,
): TemporalMetadata {
  const frequency = daysTotal > 0 ? daysPresent / daysTotal : 0;

  if (frequency >= 0.7) {
    return {
      temporalType: 'rolling_7d',
      description: 'Persistent issue — affects weekly patterns',
      lagDays: 0,
      isAccumulative: true,
    };
  }
  if (frequency >= 0.4) {
    return {
      temporalType: 'rolling_3d',
      description: 'Recurring issue — builds up over days',
      lagDays: 0,
      isAccumulative: true,
    };
  }
  return {
    temporalType: 'same_day',
    description: 'Occasional — same-day impact only',
    lagDays: 0,
    isAccumulative: false,
  };
}
