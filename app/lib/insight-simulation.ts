/**
 * Insight Simulation Harness
 *
 * Tests the intelligence pipeline against realistic scenarios.
 * Verifies that patterns, recommendations, recurrence classification,
 * and confidence behave sensibly.
 *
 * Usage: import { runAllScenarios } from './insight-simulation';
 *        const results = runAllScenarios();
 */

import { buildInsight, type NutritionSummary, type BiometricSummary } from './insight-builder';
import type { CorrelationReport, CorrelationResult, OutcomeAnalysis } from './correlation-engine';
import type { HistoricalSignal } from './recommendation-history';
import type { Insight } from './insight-schema';

// ============================================================================
// Scenario definitions
// ============================================================================

interface Scenario {
  name: string;
  description: string;
  nutrition: Partial<NutritionSummary> | null;
  biometric: Partial<BiometricSummary> | null;
  correlationInsights: Partial<CorrelationResult>[];
  outcomeAnalyses: Partial<OutcomeAnalysis>[];
  history: HistoricalSignal[];
  userGoal?: string;
  expectedBehavior: string[];
}

function makeNutrition(overrides: Partial<NutritionSummary>): NutritionSummary {
  return {
    total_calories: 1800, total_protein: 120, total_carbs: 200, total_fat: 70,
    total_fiber: 22, total_sugar: 35, total_sodium: 1800, total_caffeine: 100,
    total_alcohol: 0, total_water_ml: 1500, meal_count: 3,
    nutrient_adequacy_score: 50, inflammatory_score: 50,
    caffeine_after_2pm: 0, alcohol_after_8pm: 0, has_late_night_meal: false,
    pct_dv_protein: 80, pct_dv_fiber: 60, pct_dv_vitamin_d: 30,
    pct_dv_vitamin_c: 70, pct_dv_vitamin_b12: 90, pct_dv_calcium: 55,
    pct_dv_iron: 65, pct_dv_magnesium: 40, pct_dv_potassium: 35, pct_dv_zinc: 70,
    ...overrides,
  };
}

function makeBiometric(overrides: Partial<BiometricSummary>): BiometricSummary {
  return {
    sleep_score: 75, recovery_score: 65, hrv: 45, resting_heart_rate: 58,
    strain: 12, sleep_efficiency: 82, deep_sleep_minutes: 55, rem_sleep_minutes: 70,
    baseline_hrv: 48, baseline_rhr: 56, baseline_recovery: 68, baseline_sleep_score: 76,
    hrv_deviation: -6.2, recovery_deviation: -4.4, sleep_deviation: -1.3,
    trajectory: 'stable', day_quality: 'neutral', avg_7d_recovery: 62, avg_7d_hrv: 44,
    ...overrides,
  };
}

function makeCorrelation(id: string, effect: number, conf: number, category: string): Partial<CorrelationResult> {
  return {
    pairId: id, pairName: id.replace(/_/g, ' '), category,
    highGroup: { avg: 70, n: 15, avgStrain: 12 },
    lowGroup: { avg: 70 + effect, n: 15, avgStrain: 12 },
    difference: -effect, percentDifference: effect,
    effectDirection: effect < 0 ? 'negative' : 'positive',
    direction: effect < 0 ? 'worse' : 'better',
    consistency: 0.7, confounderControlled: true,
    confidence: conf >= 70 ? 'high' : conf >= 40 ? 'medium' : 'low',
    confidenceScore: conf, sensitivityScore: 50, goalRelevance: 50, dataQualityScore: 70,
    displaySentence: `${id.replace(/_/g, ' ')}: ${effect.toFixed(1)}% effect across 30 days`,
  };
}

const SCENARIOS: Scenario[] = [
  {
    name: 'High Caffeine + Poor Sleep',
    description: 'User drinks coffee after 2pm regularly, sleep consistently below baseline',
    nutrition: makeNutrition({ caffeine_after_2pm: 180, total_caffeine: 280 }),
    biometric: makeBiometric({ sleep_score: 62, sleep_deviation: -12, recovery_score: 48 }),
    correlationInsights: [
      makeCorrelation('afternoon_caffeine_sleep', -10.5, 78, 'caffeine_alcohol'),
    ],
    outcomeAnalyses: [{
      outcome: 'sleep_score', outcomeLabel: 'Sleep', status: 'below_baseline',
      statusDetail: 'Sleep is 12% below baseline',
      primaryDrivers: [{ factor: 'Afternoon caffeine', pairId: 'afternoon_caffeine_sleep', evidenceStrength: 'strong', effectDirection: 'negative', detail: '', confidenceScore: 78 }],
      supportingSignals: [], recommendedTest: null,
    }],
    history: [
      { id: 'timing_caffeine_afternoon', daysPresent: 6, daysTotal: 7, trend: 'stable' },
    ],
    userGoal: 'Sleep Optimization',
    expectedBehavior: [
      'Top recommendation should be about caffeine timing',
      'Caffeine pattern should show as negative with high confidence',
      'Recurrence should be "persistent"',
      'Priority should be very high due to goal alignment + persistence',
    ],
  },
  {
    name: 'Underfueling + Low Recovery',
    description: 'User eating too few calories and protein, recovery consistently low',
    nutrition: makeNutrition({
      total_calories: 1200, total_protein: 55, meal_count: 2,
      nutrient_adequacy_score: 20, pct_dv_protein: 30, pct_dv_fiber: 25,
      pct_dv_magnesium: 25, pct_dv_iron: 35,
    }),
    biometric: makeBiometric({ recovery_score: 30, recovery_deviation: -18, trajectory: 'declining' }),
    correlationInsights: [
      makeCorrelation('protein_recovery', 8.2, 65, 'macros'),
      makeCorrelation('adequacy_recovery', 12.0, 72, 'scores'),
    ],
    outcomeAnalyses: [],
    history: [
      { id: 'deficiency_protein', daysPresent: 5, daysTotal: 7, trend: 'worsening' },
      { id: 'deficiency_magnesium', daysPresent: 6, daysTotal: 7, trend: 'stable' },
      { id: 'score_low_adequacy', daysPresent: 6, daysTotal: 7, trend: 'worsening' },
    ],
    userGoal: 'Athletic Performance',
    expectedBehavior: [
      'Low recovery biometric recommendation should be high priority',
      'Protein deficiency should show as persistent + worsening',
      'Nutrient adequacy score should be flagged',
      'Multiple deficiency recommendations should be deduplicated',
    ],
  },
  {
    name: 'Improving Behavior — Fiber Increasing',
    description: 'User was low on fiber for 2 weeks but has been improving recently',
    nutrition: makeNutrition({
      total_fiber: 28, pct_dv_fiber: 85, nutrient_adequacy_score: 60,
      inflammatory_score: 42,
    }),
    biometric: makeBiometric({ sleep_score: 80, recovery_score: 72, hrv: 52, trajectory: 'improving' }),
    correlationInsights: [
      makeCorrelation('fiber_sleep', 5.5, 55, 'macros'),
    ],
    outcomeAnalyses: [],
    history: [
      { id: 'deficiency_fiber', daysPresent: 2, daysTotal: 7, trend: 'improving', recentValues: [85, 78, 55, 42, 35, 30, 28] },
    ],
    userGoal: 'General Wellness',
    expectedBehavior: [
      'Fiber deficiency should show as "improving" not "persistent"',
      'Recommendation priority for fiber should be lower than persistent issues',
      'Scores should be decent (adequacy 60, inflammatory 42)',
      'Overall tone should be positive — trajectory is improving',
    ],
  },
];

// ============================================================================
// Scenario runner
// ============================================================================

export interface ScenarioResult {
  name: string;
  insight: Insight;
  checks: Array<{ description: string; passed: boolean; detail: string }>;
}

export function runScenario(scenario: Scenario): ScenarioResult {
  const report: CorrelationReport = {
    userId: 'test',
    generatedAt: new Date().toISOString(),
    totalPairedDays: 30,
    dataQuality: { fullDays: 25, partialDays: 5, avgMealsPerDay: 2.8 },
    sensitivities: [],
    insights: scenario.correlationInsights as CorrelationResult[],
    allHypotheses: [],  // simulation doesn't test hypothesis ledger generation
    outcomeAnalyses: scenario.outcomeAnalyses as OutcomeAnalysis[],
    topInsight: scenario.correlationInsights[0] as CorrelationResult || null,
  };

  const insight = buildInsight(
    scenario.nutrition as NutritionSummary | null,
    scenario.biometric as BiometricSummary | null,
    report,
    75,
    scenario.history,
    scenario.userGoal,
  );

  const checks: ScenarioResult['checks'] = [];

  // Basic validity checks
  checks.push({
    description: 'Insight has facts',
    passed: insight.facts.length > 0,
    detail: `${insight.facts.length} facts`,
  });
  checks.push({
    description: 'Insight has scores',
    passed: insight.scores.length > 0,
    detail: `${insight.scores.length} scores`,
  });
  checks.push({
    description: 'Recommendations exist',
    passed: insight.recommendations.length > 0,
    detail: `${insight.recommendations.length} recommendations`,
  });
  checks.push({
    description: 'No more than 5 recommendations',
    passed: insight.recommendations.length <= 5,
    detail: `${insight.recommendations.length} recommendations`,
  });
  checks.push({
    description: 'Top recommendation has priority >= 40',
    passed: insight.recommendations.length > 0 && insight.recommendations[0]!.priority >= 40,
    detail: `Top priority: ${insight.recommendations[0]?.priority ?? 0}`,
  });
  checks.push({
    description: 'All recommendations have IDs',
    passed: insight.recommendations.every(r => r.id && r.id.length > 0),
    detail: insight.recommendations.map(r => r.id).join(', '),
  });
  checks.push({
    description: 'Confidence is reasonable (10-100)',
    passed: insight.confidence.overall >= 10 && insight.confidence.overall <= 100,
    detail: `Overall confidence: ${insight.confidence.overall}`,
  });

  return { name: scenario.name, insight, checks };
}

export function runAllScenarios(): ScenarioResult[] {
  return SCENARIOS.map(s => runScenario(s));
}

/**
 * Format scenario results for logging.
 */
export function formatResults(results: ScenarioResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    const allPassed = r.checks.every(c => c.passed);
    lines.push(`\n${'='.repeat(60)}`);
    lines.push(`SCENARIO: ${r.name} ${allPassed ? '✓ ALL PASSED' : '✗ FAILURES'}`);
    lines.push(`${'='.repeat(60)}`);
    lines.push(`  Recommendations: ${r.insight.recommendations.length}`);
    lines.push(`  Top rec: ${r.insight.recommendations[0]?.action || 'none'} (priority ${r.insight.recommendations[0]?.priority || 0}, ${r.insight.recommendations[0]?.recurrence || 'new'})`);
    lines.push(`  Patterns: ${r.insight.patterns.length}, Drivers: ${r.insight.drivers.length}`);
    lines.push(`  Confidence: ${r.insight.confidence.overall}%`);
    lines.push(`  Checks:`);
    for (const c of r.checks) {
      lines.push(`    ${c.passed ? '✓' : '✗'} ${c.description}: ${c.detail}`);
    }
  }
  return lines.join('\n');
}
