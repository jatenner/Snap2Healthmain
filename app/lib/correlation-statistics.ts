/**
 * Correlation Statistics — Signal Hardening
 *
 * Provides FDR correction (Benjamini-Hochberg) and multi-confounder checking
 * for the correlation engine's output.
 *
 * This module does NOT rewrite the correlation engine.
 * It post-processes results to improve signal quality.
 */

import type { CorrelationResult } from './correlation-engine';

// ============================================================================
// Benjamini-Hochberg False Discovery Rate Correction
// ============================================================================

/**
 * Apply BH-FDR correction to an array of correlation results.
 * Returns a new array with `survivedFDR` and `adjustedConfidence` fields added.
 *
 * We convert confidenceScore (0-100, higher=better) to a pseudo-p-value
 * (lower=more significant) for the BH procedure.
 */
export function applyFDRCorrection(
  results: CorrelationResult[],
  fdrThreshold: number = 0.15, // 15% FDR — appropriate for exploratory N-of-1 analysis
): Array<CorrelationResult & { survivedFDR: boolean; adjustedConfidence: 'high' | 'medium' | 'low' }> {
  if (results.length === 0) return [];

  // Convert confidence to pseudo-p (inverse relationship)
  const withP = results.map(r => ({
    ...r,
    pseudoP: Math.max(0.001, 1 - (r.confidenceScore / 100)),
  }));

  // Sort by p-value ascending (most significant first)
  withP.sort((a, b) => a.pseudoP - b.pseudoP);

  const m = withP.length;
  let lastSurviving = -1;

  // BH step-up procedure: find largest k where p(k) <= (k/m) * alpha
  for (let k = 0; k < m; k++) {
    const bhThreshold = ((k + 1) / m) * fdrThreshold;
    if (withP[k]!.pseudoP <= bhThreshold) {
      lastSurviving = k;
    }
  }

  // Everything at index <= lastSurviving survives
  return withP.map((r, i) => {
    const survived = i <= lastSurviving;
    const { pseudoP, ...rest } = r;
    return {
      ...rest,
      survivedFDR: survived,
      adjustedConfidence: survived
        ? rest.confidence  // keep original if survived
        : (rest.confidence === 'high' ? 'medium' as const : 'low' as const),
    };
  });
}

// ============================================================================
// Multi-Confounder Checking
// ============================================================================

interface ConfounderCheckResult {
  confounderWarnings: string[];
  confounderControlled: boolean;
}

/**
 * Check for confounders between high and low groups.
 * Uses the paired nutrition data to detect group imbalances
 * beyond just strain (which the engine already checks).
 */
export function checkConfounders(
  pair: { nutritionField: string },
  highGroupNutrition: any[],
  lowGroupNutrition: any[],
): ConfounderCheckResult {
  const warnings: string[] = [];

  const avg = (arr: any[], field: string) => {
    const vals = arr.map(r => r[field]).filter((v: any) => v != null && !isNaN(v));
    return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  };

  const checkField = (field: string, label: string, threshold: number) => {
    // Skip if this IS the field being tested
    if (pair.nutritionField === field) return;

    const highAvg = avg(highGroupNutrition, field);
    const lowAvg = avg(lowGroupNutrition, field);
    if (highAvg == null || lowAvg == null) return;
    const midpoint = (highAvg + lowAvg) / 2;
    if (midpoint === 0) return;
    const diffPct = Math.abs(highAvg - lowAvg) / midpoint * 100;
    if (diffPct > threshold) {
      warnings.push(`${label} differed ${Math.round(diffPct)}% between groups (${highAvg.toFixed(1)} vs ${lowAvg.toFixed(1)})`);
    }
  };

  // Check key confounders with reasonable thresholds
  checkField('total_alcohol', 'Alcohol', 30);
  checkField('total_caffeine', 'Caffeine', 30);
  checkField('total_calories', 'Calories', 25);
  checkField('avg_stress_level', 'Stress', 25);

  return {
    confounderWarnings: warnings,
    confounderControlled: warnings.length === 0,
  };
}

// ============================================================================
// Signal Quality Filter
// ============================================================================

export interface SignalQualityThresholds {
  minConfidence: number;      // minimum confidenceScore (0-100)
  minEffectSize: number;      // minimum |percentDifference|
  minSampleSize: number;      // minimum observations per group
  requireFDR: boolean;        // only show FDR-surviving signals
}

export const DEFAULT_THRESHOLDS: SignalQualityThresholds = {
  minConfidence: 35,
  minEffectSize: 3,
  minSampleSize: 7,
  requireFDR: false, // Start lenient, tighten later
};

export const STRICT_THRESHOLDS: SignalQualityThresholds = {
  minConfidence: 50,
  minEffectSize: 5,
  minSampleSize: 10,
  requireFDR: true,
};

/**
 * Filter correlation results by signal quality.
 */
export function filterByQuality<T extends CorrelationResult & { survivedFDR?: boolean }>(
  results: T[],
  thresholds: SignalQualityThresholds = DEFAULT_THRESHOLDS,
): T[] {
  return results.filter(r => {
    if (r.confidenceScore < thresholds.minConfidence) return false;
    if (Math.abs(r.percentDifference) < thresholds.minEffectSize) return false;
    if (Math.min(r.highGroup.n, r.lowGroup.n) < thresholds.minSampleSize) return false;
    if (thresholds.requireFDR && 'survivedFDR' in r && !r.survivedFDR) return false;
    return true;
  });
}
