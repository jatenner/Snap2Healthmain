/**
 * Insight Builder — Deterministic Intelligence Layer
 *
 * Converts raw data (daily summaries, WHOOP baselines, correlation output)
 * into a structured Insight object.
 *
 * ALL logic here is deterministic. No LLM calls.
 * The Insight object is the single source of truth for what the system "knows".
 * LLMs may only narrate this object — never replace it.
 */

import type {
  Insight, Fact, Score, Pattern, Driver, Recommendation, ConfidenceSummary,
} from './insight-schema';
import { emptyInsight } from './insight-schema';
import type { CorrelationReport, CorrelationResult, OutcomeAnalysis } from './correlation-engine';
import { applyFDRCorrection, filterByQuality, DEFAULT_THRESHOLDS } from './correlation-statistics';
import { generateRankedRecommendations } from './recommendation-engine';
import type { HistoricalSignal } from './recommendation-history';
import { getTemporalMetadata } from './time-effect-model';
import type { PersistedSignal } from './signal-memory';
import { evaluateOutcome, outcomePriorityAdjustment } from './recommendation-outcomes';

// ============================================================================
// Input types
// ============================================================================

export interface NutritionSummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  total_caffeine: number;
  total_alcohol: number;
  total_water_ml: number;
  meal_count: number;
  nutrient_adequacy_score: number | null;
  inflammatory_score: number | null;
  caffeine_after_2pm: number;
  alcohol_after_8pm: number;
  has_late_night_meal: boolean;
  pct_dv_protein?: number;
  pct_dv_fiber?: number;
  pct_dv_vitamin_d?: number;
  pct_dv_vitamin_c?: number;
  pct_dv_vitamin_b12?: number;
  pct_dv_calcium?: number;
  pct_dv_iron?: number;
  pct_dv_magnesium?: number;
  pct_dv_potassium?: number;
  pct_dv_zinc?: number;
  [key: string]: any;
}

export interface BiometricSummary {
  sleep_score: number | null;
  recovery_score: number | null;
  hrv: number | null;
  resting_heart_rate: number | null;
  strain: number | null;
  sleep_efficiency: number | null;
  deep_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  baseline_hrv: number | null;
  baseline_rhr: number | null;
  baseline_recovery: number | null;
  baseline_sleep_score: number | null;
  hrv_deviation: number | null;
  recovery_deviation: number | null;
  sleep_deviation: number | null;
  trajectory: string | null;
  day_quality: string | null;
  avg_7d_recovery: number | null;
  avg_7d_hrv: number | null;
  [key: string]: any;
}

// ============================================================================
// Main builder
// ============================================================================

export function buildInsight(
  nutrition: NutritionSummary | null,
  biometric: BiometricSummary | null,
  correlationReport: CorrelationReport | null,
  avgMealConfidence?: number | null,
  history?: HistoricalSignal[],
  userGoal?: string,
  persistedSignals?: PersistedSignal[],
): Insight {
  const insight = emptyInsight();

  if (nutrition) pushNutritionFacts(insight.facts, nutrition);
  if (biometric) pushBiometricFacts(insight.facts, biometric);
  if (nutrition) pushNutritionScores(insight.scores, nutrition);
  if (biometric) pushBiometricScores(insight.scores, biometric);

  if (correlationReport) {
    // Wire ALL hypothesis results (including null findings and insufficient data)
    if (correlationReport.allHypotheses) {
      insight.hypotheses = correlationReport.allHypotheses;
    }

    if (correlationReport.insights.length > 0) {
      const corrected = applyFDRCorrection(correlationReport.insights);
      const filtered = filterByQuality(corrected, DEFAULT_THRESHOLDS);
      insight.patterns = mapCorrelationsToPatterns(filtered);
      insight.drivers = mapOutcomeAnalysesToDrivers(correlationReport.outcomeAnalyses);
    }
  }

  // Phase 4: Ranked recommendations
  insight.recommendations = generateRankedRecommendations(
    nutrition, biometric, insight.patterns, insight.scores, insight.drivers,
    history || [], userGoal,
  );

  // Phase 5: Enrich patterns with temporal metadata
  for (const pattern of insight.patterns) {
    const temporal = getTemporalMetadata(pattern.id);
    pattern.temporalType = temporal.temporalType;
    pattern.temporalDescription = temporal.description;
  }

  // Phase 5: Enrich recommendations with outcome tracking
  if (persistedSignals && persistedSignals.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0]!;
    for (const rec of insight.recommendations) {
      const outcome = evaluateOutcome(rec.id, persistedSignals, todayStr);
      rec.effectiveness = outcome.effectivenessStatus;
      rec.timesTriggered = outcome.timesTriggered;
      rec.firstSeen = outcome.firstSeen;
      // Adjust priority based on outcome learning
      rec.priority = Math.max(0, Math.min(100, rec.priority + outcomePriorityAdjustment(outcome)));
    }
    // Re-sort by adjusted priority
    insight.recommendations.sort((a, b) => b.priority - a.priority);
  }

  insight.confidence = computeConfidence(nutrition, correlationReport, avgMealConfidence);

  return insight;
}

// ============================================================================
// FACTS
// ============================================================================

function pushNutritionFacts(facts: Fact[], n: NutritionSummary): void {
  facts.push({ label: 'Calories', value: Math.round(n.total_calories), unit: 'kcal', source: 'ai_estimate' });
  facts.push({ label: 'Protein', value: Math.round(n.total_protein), unit: 'g', source: 'ai_estimate' });
  facts.push({ label: 'Carbs', value: Math.round(n.total_carbs), unit: 'g', source: 'ai_estimate' });
  facts.push({ label: 'Fat', value: Math.round(n.total_fat), unit: 'g', source: 'ai_estimate' });
  facts.push({ label: 'Fiber', value: Math.round(n.total_fiber), unit: 'g', source: 'ai_estimate' });
  facts.push({ label: 'Meals logged', value: n.meal_count, source: 'user_data' });
  if (n.total_caffeine > 0) facts.push({ label: 'Caffeine', value: Math.round(n.total_caffeine), unit: 'mg', source: 'ai_estimate' });
  if (n.total_alcohol > 0) facts.push({ label: 'Alcohol', value: Math.round(n.total_alcohol), unit: 'g', source: 'ai_estimate' });
  if (n.total_water_ml > 0) facts.push({ label: 'Water', value: Math.round(n.total_water_ml), unit: 'ml', source: 'user_data' });
}

function pushBiometricFacts(facts: Fact[], b: BiometricSummary): void {
  if (b.sleep_score != null) facts.push({ label: 'Sleep', value: Math.round(b.sleep_score), unit: '%', source: 'user_data' });
  if (b.recovery_score != null) facts.push({ label: 'Recovery', value: Math.round(b.recovery_score), unit: '%', source: 'user_data' });
  if (b.hrv != null) facts.push({ label: 'HRV', value: Math.round(b.hrv * 10) / 10, unit: 'ms', source: 'user_data' });
  if (b.resting_heart_rate != null) facts.push({ label: 'Resting HR', value: Math.round(b.resting_heart_rate), unit: 'bpm', source: 'user_data' });
  if (b.strain != null) facts.push({ label: 'Strain', value: Math.round(b.strain * 10) / 10, source: 'user_data' });
  if (b.hrv_deviation != null && Math.abs(b.hrv_deviation) >= 3)
    facts.push({ label: 'HRV vs baseline', value: `${b.hrv_deviation > 0 ? '+' : ''}${b.hrv_deviation.toFixed(1)}`, unit: '%', source: 'computed' });
  if (b.recovery_deviation != null && Math.abs(b.recovery_deviation) >= 3)
    facts.push({ label: 'Recovery vs baseline', value: `${b.recovery_deviation > 0 ? '+' : ''}${b.recovery_deviation.toFixed(1)}`, unit: '%', source: 'computed' });
  if (b.sleep_deviation != null && Math.abs(b.sleep_deviation) >= 3)
    facts.push({ label: 'Sleep vs baseline', value: `${b.sleep_deviation > 0 ? '+' : ''}${b.sleep_deviation.toFixed(1)}`, unit: '%', source: 'computed' });
}

// ============================================================================
// SCORES
// ============================================================================

function pushNutritionScores(scores: Score[], n: NutritionSummary): void {
  if (n.nutrient_adequacy_score != null) {
    const v = n.nutrient_adequacy_score;
    scores.push({
      name: 'Nutrient Adequacy', value: v, max: 100, source: 'computed',
      interpretation: v >= 70 ? 'Strong nutrient coverage' : v >= 40 ? 'Moderate — some gaps' : 'Low — significant gaps',
    });
  }
  if (n.inflammatory_score != null) {
    const v = n.inflammatory_score;
    scores.push({
      name: 'Inflammatory Index', value: v, max: 100, source: 'computed',
      interpretation: v <= 40 ? 'Low inflammatory load' : v <= 60 ? 'Moderate' : 'High — reduce sugar/sodium, add fiber',
    });
  }
}

function pushBiometricScores(scores: Score[], b: BiometricSummary): void {
  if (b.recovery_score != null) {
    const r = b.recovery_score;
    scores.push({
      name: 'Recovery', value: Math.round(r), max: 100, source: 'computed',
      interpretation: r >= 67 ? 'Green — well recovered' : r >= 34 ? 'Yellow — partial recovery' : 'Red — low, prioritize rest',
    });
  }
  if (b.sleep_efficiency != null) {
    const e = b.sleep_efficiency;
    scores.push({
      name: 'Sleep Efficiency', value: Math.round(e), max: 100, source: 'computed',
      interpretation: e >= 85 ? 'Excellent' : e >= 70 ? 'Good' : 'Low — time in bed not translating to sleep',
    });
  }
}

// ============================================================================
// PATTERNS (FDR-corrected correlations)
// ============================================================================

function mapCorrelationsToPatterns(
  correlations: Array<CorrelationResult & { survivedFDR?: boolean; adjustedConfidence?: string }>,
): Pattern[] {
  return correlations
    .slice(0, 8)
    .map(c => {
      const direction = c.effectDirection === 'neutral' ? 'neutral' as const
        : c.effectDirection === 'positive' ? 'positive' as const : 'negative' as const;
      const findingType = direction === 'positive' ? 'helpful' as const
        : direction === 'negative' ? 'harmful' as const : 'neutral' as const;
      return {
        id: c.pairId,
        description: c.displaySentence,
        effect: `${c.percentDifference > 0 ? '+' : ''}${c.percentDifference.toFixed(1)}%`,
        confidence: c.confidenceScore,
        adjustedConfidence: c.confidenceScore,
        survivedFDR: (c as any).survivedFDR ?? true,
        sampleSize: c.highGroup.n + c.lowGroup.n,
        direction,
        findingType,
        category: c.category,
        confounderWarnings: c.confounderWarning ? [c.confounderWarning] : undefined,
      };
    });
}

// ============================================================================
// DRIVERS
// ============================================================================

function mapOutcomeAnalysesToDrivers(outcomes: OutcomeAnalysis[]): Driver[] {
  const drivers: Driver[] = [];
  for (const outcome of outcomes) {
    for (const d of outcome.primaryDrivers) {
      drivers.push({
        factor: d.factor,
        outcome: outcome.outcomeLabel,
        impact: d.evidenceStrength === 'strong' ? 'high' : d.evidenceStrength === 'moderate' ? 'medium' : 'low',
        direction: d.effectDirection === 'positive' ? 'positive' : 'negative',
        confidence: d.confidenceScore,
      });
    }
  }
  const seen = new Map<string, Driver>();
  for (const d of drivers) {
    const existing = seen.get(d.factor);
    if (!existing || d.confidence > existing.confidence) seen.set(d.factor, d);
  }
  return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

// NOTE: Recommendation generation is now in recommendation-engine.ts (Phase 4)

// ============================================================================
// CONFIDENCE
// ============================================================================

function computeConfidence(
  nutrition: NutritionSummary | null,
  correlationReport: CorrelationReport | null,
  avgMealConfidence?: number | null,
): ConfidenceSummary {
  let dataQuality = 0;
  if (nutrition) {
    if (nutrition.meal_count >= 3) dataQuality = 80;
    else if (nutrition.meal_count >= 2) dataQuality = 60;
    else if (nutrition.meal_count >= 1) dataQuality = 40;
  }
  const sampleSize = correlationReport?.totalPairedDays ?? 0;
  const inputConfidence = avgMealConfidence ?? 0;
  const hasBiometric = sampleSize > 0;
  const overall = hasBiometric
    ? Math.round(dataQuality * 0.3 + Math.min(sampleSize * 3, 100) * 0.3 + inputConfidence * 0.4)
    : Math.round(dataQuality * 0.5 + inputConfidence * 0.5);
  return { overall: Math.min(100, overall), dataQuality, sampleSize, inputConfidence: Math.round(inputConfidence) };
}
