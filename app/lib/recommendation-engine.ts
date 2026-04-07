/**
 * Recommendation Engine — Adaptive, Priority-Ranked Actions
 *
 * Consumes structured insight data (scores, patterns, drivers, deficiencies)
 * and produces ranked, deduplicated, provenance-linked recommendations.
 *
 * ALL logic is deterministic. No LLM calls.
 */

import type { Recommendation, RecurrenceStatus, Score, Pattern, Driver } from './insight-schema';
import type { NutritionSummary, BiometricSummary } from './insight-builder';
import type { HistoricalSignal } from './recommendation-history';
import { classifyRecurrence } from './recommendation-history';

// ============================================================================
// Raw candidate (before ranking + dedup)
// ============================================================================

interface RawCandidate {
  id: string;
  action: string;
  rationale: string;
  confidence: number;
  category: Recommendation['category'];
  expectedImpact: 'high' | 'medium' | 'low';
  source: Recommendation['source'];
  linkedTo: Recommendation['linkedTo'];
  supportingSignals?: string[];
  // Priority factors (used for scoring)
  severityFactor: number;       // 0-1: how bad is the issue
  effectSizeFactor: number;     // 0-1: how big is the potential improvement
  signalCountFactor: number;    // 0-1: how many signals support this
  goalRelevanceFactor: number;  // 0-1: how relevant to user's goal
}

// ============================================================================
// Main engine
// ============================================================================

export function generateRankedRecommendations(
  nutrition: NutritionSummary | null,
  biometric: BiometricSummary | null,
  patterns: Pattern[],
  scores: Score[],
  drivers: Driver[],
  history: HistoricalSignal[],
  userGoal?: string,
): Recommendation[] {
  const candidates: RawCandidate[] = [];

  // Generate candidates from each source
  if (nutrition) candidates.push(...fromDeficiencies(nutrition));
  if (nutrition) candidates.push(...fromTimingIssues(nutrition));
  candidates.push(...fromScores(scores, nutrition));
  candidates.push(...fromPatterns(patterns));
  if (biometric) candidates.push(...fromBiometrics(biometric));

  // Apply goal relevance boost
  for (const c of candidates) {
    c.goalRelevanceFactor = computeGoalRelevance(c, userGoal);
  }

  // Compute priority score
  const scored = candidates.map(c => ({
    ...c,
    priority: computePriority(c, history),
  }));

  // Sort by priority descending
  scored.sort((a, b) => b.priority - a.priority);

  // Deduplicate: merge candidates with similar actions
  const deduped = deduplicateCandidates(scored);

  // Assign recurrence status
  const final: Recommendation[] = deduped.slice(0, 5).map(c => ({
    id: c.id,
    action: c.action,
    rationale: c.rationale,
    confidence: c.confidence,
    priority: c.priority,
    source: c.source,
    category: c.category,
    expectedImpact: c.expectedImpact,
    recurrence: getRecurrence(c.id, history),
    linkedTo: c.linkedTo,
    supportingSignals: c.supportingSignals,
  }));

  return final;
}

// ============================================================================
// Candidate generators
// ============================================================================

function fromDeficiencies(n: NutritionSummary): RawCandidate[] {
  const candidates: RawCandidate[] = [];
  const checks: Array<{ id: string; field: string; nutrient: string; food: string; threshold: number }> = [
    { id: 'deficiency_protein', field: 'pct_dv_protein', nutrient: 'Protein', food: 'chicken, fish, eggs, Greek yogurt', threshold: 50 },
    { id: 'deficiency_fiber', field: 'pct_dv_fiber', nutrient: 'Fiber', food: 'beans, berries, oats', threshold: 50 },
    { id: 'deficiency_magnesium', field: 'pct_dv_magnesium', nutrient: 'Magnesium', food: 'spinach, almonds, dark chocolate', threshold: 50 },
    { id: 'deficiency_vitamin_d', field: 'pct_dv_vitamin_d', nutrient: 'Vitamin D', food: 'salmon, eggs, fortified foods', threshold: 50 },
    { id: 'deficiency_iron', field: 'pct_dv_iron', nutrient: 'Iron', food: 'red meat, lentils, spinach', threshold: 50 },
    { id: 'deficiency_calcium', field: 'pct_dv_calcium', nutrient: 'Calcium', food: 'dairy, leafy greens, fortified alternatives', threshold: 50 },
    { id: 'deficiency_zinc', field: 'pct_dv_zinc', nutrient: 'Zinc', food: 'meat, shellfish, legumes', threshold: 50 },
  ];

  for (const check of checks) {
    const pct = (n as any)[check.field] ?? 100;
    if (pct < check.threshold) {
      const severity = 1 - (pct / check.threshold); // 0 at threshold, 1 at 0%
      candidates.push({
        id: check.id,
        action: `Boost ${check.nutrient} — try ${check.food}`,
        rationale: `${check.nutrient} at ${pct}% of daily target`,
        confidence: 70,
        category: 'nutrition',
        expectedImpact: severity > 0.6 ? 'high' : severity > 0.3 ? 'medium' : 'low',
        source: 'deficiency',
        linkedTo: { type: 'deficiency', name: check.nutrient, value: pct },
        severityFactor: severity,
        effectSizeFactor: 0.5,
        signalCountFactor: 0.3,
        goalRelevanceFactor: 0.5,
      });
    }
  }

  return candidates;
}

function fromTimingIssues(n: NutritionSummary): RawCandidate[] {
  const candidates: RawCandidate[] = [];

  if (n.caffeine_after_2pm > 50) {
    candidates.push({
      id: 'timing_caffeine_afternoon',
      action: 'Move caffeine intake before 2pm',
      rationale: `${Math.round(n.caffeine_after_2pm)}mg caffeine consumed after 2pm`,
      confidence: 65,
      category: 'substance',
      expectedImpact: 'medium',
      source: 'score',
      linkedTo: { type: 'score', name: 'Caffeine timing' },
      severityFactor: Math.min(1, n.caffeine_after_2pm / 200),
      effectSizeFactor: 0.6,
      signalCountFactor: 0.4,
      goalRelevanceFactor: 0.5,
    });
  }

  if (n.has_late_night_meal) {
    candidates.push({
      id: 'timing_late_meal',
      action: 'Finish eating by 9pm',
      rationale: 'Late-night meal detected — may affect sleep quality',
      confidence: 60,
      category: 'timing',
      expectedImpact: 'medium',
      source: 'score',
      linkedTo: { type: 'score', name: 'Meal timing' },
      severityFactor: 0.5,
      effectSizeFactor: 0.5,
      signalCountFactor: 0.3,
      goalRelevanceFactor: 0.5,
    });
  }

  if (n.alcohol_after_8pm > 14) {
    candidates.push({
      id: 'timing_late_alcohol',
      action: 'Avoid alcohol in the evening',
      rationale: `${Math.round(n.alcohol_after_8pm)}g alcohol after 8pm — impacts sleep and recovery`,
      confidence: 70,
      category: 'substance',
      expectedImpact: 'high',
      source: 'score',
      linkedTo: { type: 'score', name: 'Alcohol timing' },
      severityFactor: Math.min(1, n.alcohol_after_8pm / 42),
      effectSizeFactor: 0.8,
      signalCountFactor: 0.4,
      goalRelevanceFactor: 0.6,
    });
  }

  return candidates;
}

function fromScores(scores: Score[], n: NutritionSummary | null): RawCandidate[] {
  const candidates: RawCandidate[] = [];

  const adequacy = scores.find(s => s.name === 'Nutrient Adequacy');
  if (adequacy && adequacy.value < 40) {
    candidates.push({
      id: 'score_low_adequacy',
      action: 'Prioritize nutrient-dense meals (vegetables, protein, whole grains)',
      rationale: `Nutrient adequacy is ${adequacy.value}% — most key nutrients below target`,
      confidence: 80,
      category: 'nutrition',
      expectedImpact: 'high',
      source: 'score',
      linkedTo: { type: 'score', name: 'Nutrient Adequacy', value: adequacy.value },
      severityFactor: 1 - (adequacy.value / 40),
      effectSizeFactor: 0.7,
      signalCountFactor: 0.5,
      goalRelevanceFactor: 0.7,
    });
  }

  const inflam = scores.find(s => s.name === 'Inflammatory Index');
  if (inflam && inflam.value > 60) {
    candidates.push({
      id: 'score_high_inflammatory',
      action: 'Reduce sugar and processed foods, add omega-3 and fiber',
      rationale: `Inflammatory index is ${inflam.value}/100`,
      confidence: 75,
      category: 'nutrition',
      expectedImpact: inflam.value > 75 ? 'high' : 'medium',
      source: 'score',
      linkedTo: { type: 'score', name: 'Inflammatory Index', value: inflam.value },
      severityFactor: (inflam.value - 60) / 40,
      effectSizeFactor: 0.6,
      signalCountFactor: 0.4,
      goalRelevanceFactor: 0.6,
    });
  }

  return candidates;
}

function fromPatterns(patterns: Pattern[]): RawCandidate[] {
  // Only generate from strong negative patterns
  const negativeStrong = patterns
    .filter(p => p.direction === 'negative' && p.confidence >= 50)
    .slice(0, 2);

  return negativeStrong.map(p => ({
    id: `pattern_${p.id}`,
    action: `Address: ${p.description.split('.')[0]}`,
    rationale: `Pattern with ${p.confidence}% confidence across ${p.sampleSize} days`,
    confidence: p.confidence,
    category: (p.category === 'caffeine_alcohol' ? 'substance' : p.category === 'timing' ? 'timing' : 'general') as RawCandidate['category'],
    expectedImpact: p.confidence >= 70 ? 'high' : 'medium',
    source: 'correlation' as const,
    linkedTo: { type: 'pattern' as const, name: p.id, value: p.confidence },
    supportingSignals: [`${p.effect} effect, ${p.sampleSize} days`],
    severityFactor: Math.min(1, Math.abs(parseFloat(p.effect)) / 15),
    effectSizeFactor: Math.min(1, Math.abs(parseFloat(p.effect)) / 10),
    signalCountFactor: Math.min(1, p.sampleSize / 30),
    goalRelevanceFactor: 0.5,
  }));
}

function fromBiometrics(b: BiometricSummary): RawCandidate[] {
  const candidates: RawCandidate[] = [];

  if (b.recovery_score != null && b.recovery_score < 34) {
    candidates.push({
      id: 'biometric_low_recovery',
      action: 'Prioritize recovery — lighter meals, hydration, earlier bedtime',
      rationale: `Recovery is ${Math.round(b.recovery_score)}% (red zone)`,
      confidence: 80,
      category: 'recovery',
      expectedImpact: 'high',
      source: 'score',
      linkedTo: { type: 'score', name: 'Recovery', value: b.recovery_score },
      severityFactor: 1 - (b.recovery_score / 34),
      effectSizeFactor: 0.8,
      signalCountFactor: 0.5,
      goalRelevanceFactor: 0.8,
    });
  }

  return candidates;
}

// ============================================================================
// Priority scoring
// ============================================================================

function computePriority(candidate: RawCandidate, history: HistoricalSignal[]): number {
  // Base priority from factors (0-100 scale)
  const base =
    candidate.severityFactor * 30 +       // how bad is the issue (0-30)
    candidate.effectSizeFactor * 25 +      // potential improvement (0-25)
    candidate.confidence * 0.15 +          // statistical confidence (0-15)
    candidate.signalCountFactor * 15 +     // supporting signals (0-15)
    candidate.goalRelevanceFactor * 15;    // goal alignment (0-15)

  // Recurrence boost: persistent issues get higher priority
  const signal = history.find(h => candidate.id.includes(h.id) || h.id.includes(candidate.id));
  let recurrenceBoost = 0;
  if (signal) {
    const freq = signal.daysPresent / signal.daysTotal;
    if (freq >= 0.7) recurrenceBoost = 12;      // persistent
    else if (freq >= 0.4) recurrenceBoost = 6;   // recurring
    if (signal.trend === 'worsening') recurrenceBoost += 5;
  }

  return Math.min(100, Math.round(base + recurrenceBoost));
}

function computeGoalRelevance(candidate: RawCandidate, goal?: string): number {
  if (!goal) return 0.5;
  const g = goal.toLowerCase();

  if (g.includes('sleep') && (candidate.category === 'timing' || candidate.category === 'substance')) return 0.9;
  if (g.includes('performance') && candidate.category === 'recovery') return 0.9;
  if (g.includes('performance') && candidate.id.includes('protein')) return 0.8;
  if (g.includes('weight') && candidate.id.includes('calorie')) return 0.8;
  if (g.includes('muscle') && candidate.id.includes('protein')) return 0.9;
  if (g.includes('heart') && candidate.id.includes('inflammatory')) return 0.8;
  if (g.includes('longev') && candidate.id.includes('inflammatory')) return 0.8;

  return 0.5; // neutral
}

// ============================================================================
// Deduplication
// ============================================================================

function deduplicateCandidates(
  candidates: Array<RawCandidate & { priority: number }>,
): Array<RawCandidate & { priority: number }> {
  const seen = new Map<string, RawCandidate & { priority: number }>();

  for (const c of candidates) {
    // Group by ID prefix (e.g., "deficiency_magnesium" dedupes with itself)
    const key = c.id;
    const existing = seen.get(key);
    if (!existing || c.priority > existing.priority) {
      seen.set(key, c);
    }
  }

  // Also merge similar categories: if we have both "score_low_adequacy" and 3 deficiencies,
  // keep the adequacy + top 1 specific deficiency, not all 3
  const result = Array.from(seen.values());
  const hasAdequacy = result.some(r => r.id === 'score_low_adequacy');
  if (hasAdequacy) {
    // Keep at most 1 specific deficiency alongside the general adequacy rec
    const deficiencies = result.filter(r => r.id.startsWith('deficiency_'));
    if (deficiencies.length > 1) {
      const keepId = deficiencies[0]!.id; // highest priority (already sorted)
      return result.filter(r => !r.id.startsWith('deficiency_') || r.id === keepId);
    }
  }

  return result;
}

// ============================================================================
// Recurrence assignment
// ============================================================================

function getRecurrence(recId: string, history: HistoricalSignal[]): RecurrenceStatus {
  const signal = history.find(h => recId.includes(h.id) || h.id.includes(recId));
  if (!signal) return 'new';
  return classifyRecurrence(signal.daysPresent, signal.daysTotal, signal.trend);
}
