// Correlation Engine: Connects nutrition patterns to biometric outcomes
// Pure deterministic statistics — no AI. AI interprets results separately.

import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================================
// Types
// ============================================================================

interface ComparisonPair {
  id: string;
  name: string;
  category: 'timing' | 'macros' | 'micros' | 'scores' | 'tags' | 'caffeine_alcohol';
  nutritionField: string;
  highThreshold: number;
  lowThreshold: number;
  thresholdType: 'above_below' | 'boolean';
  biometricField: string;
  higherIsBetter: boolean;
  lagDays: number; // 0 = same night, 1 = next day
  labels: { high: string; low: string; outcome: string };
}

export interface CorrelationResult {
  pairId: string;
  pairName: string;
  category: string;
  highGroup: { avg: number; n: number; avgStrain: number };
  lowGroup: { avg: number; n: number; avgStrain: number };
  difference: number;
  percentDifference: number;
  direction: 'better' | 'worse' | 'neutral';
  consistency: number;
  confounderControlled: boolean;
  confounderWarning?: string;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number;
  displaySentence: string;
}

export interface CorrelationReport {
  userId: string;
  generatedAt: string;
  totalPairedDays: number;
  insights: CorrelationResult[];
  topInsight: CorrelationResult | null;
}

// ============================================================================
// Comparison Pair Definitions (~25 pairs)
// ============================================================================

const COMPARISON_PAIRS: ComparisonPair[] = [
  // Timing
  {
    id: 'late_carbs_sleep', name: 'Late carbs vs sleep', category: 'timing',
    nutritionField: 'carbs_after_8pm', highThreshold: 40, lowThreshold: 10, thresholdType: 'above_below',
    biometricField: 'sleep_score', higherIsBetter: true, lagDays: 0,
    labels: { high: '40g+ carbs after 8pm', low: '<10g carbs after 8pm', outcome: 'sleep score' }
  },
  {
    id: 'late_sugar_sleep', name: 'Late sugar vs sleep', category: 'timing',
    nutritionField: 'sugar_after_8pm', highThreshold: 20, lowThreshold: 5, thresholdType: 'above_below',
    biometricField: 'sleep_score', higherIsBetter: true, lagDays: 0,
    labels: { high: '20g+ sugar after 8pm', low: '<5g sugar after 8pm', outcome: 'sleep score' }
  },
  {
    id: 'late_meal_sleep', name: 'Late night eating vs sleep', category: 'timing',
    nutritionField: 'has_late_night_meal', highThreshold: 1, lowThreshold: 0, thresholdType: 'boolean',
    biometricField: 'sleep_efficiency', higherIsBetter: true, lagDays: 0,
    labels: { high: 'meal after 9pm', low: 'no meal after 9pm', outcome: 'sleep efficiency' }
  },

  // Caffeine & Alcohol
  {
    id: 'afternoon_caffeine_sleep', name: 'Afternoon caffeine vs sleep', category: 'caffeine_alcohol',
    nutritionField: 'caffeine_after_2pm', highThreshold: 50, lowThreshold: 0, thresholdType: 'above_below',
    biometricField: 'sleep_score', higherIsBetter: true, lagDays: 0,
    labels: { high: 'caffeine after 2pm', low: 'no caffeine after 2pm', outcome: 'sleep score' }
  },
  {
    id: 'caffeine_sleep_duration', name: 'Total caffeine vs sleep duration', category: 'caffeine_alcohol',
    nutritionField: 'total_caffeine', highThreshold: 200, lowThreshold: 50, thresholdType: 'above_below',
    biometricField: 'sleep_duration_minutes', higherIsBetter: true, lagDays: 0,
    labels: { high: '200mg+ caffeine', low: '<50mg caffeine', outcome: 'sleep duration' }
  },
  {
    id: 'alcohol_recovery', name: 'Alcohol vs recovery', category: 'caffeine_alcohol',
    nutritionField: 'total_alcohol', highThreshold: 14, lowThreshold: 0, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: 'days with alcohol', low: 'no alcohol', outcome: 'next-day recovery' }
  },
  {
    id: 'alcohol_hrv', name: 'Alcohol vs HRV', category: 'caffeine_alcohol',
    nutritionField: 'total_alcohol', highThreshold: 14, lowThreshold: 0, thresholdType: 'above_below',
    biometricField: 'hrv', higherIsBetter: true, lagDays: 1,
    labels: { high: 'days with alcohol', low: 'no alcohol', outcome: 'next-day HRV' }
  },
  {
    id: 'late_alcohol_sleep', name: 'Late alcohol vs sleep', category: 'caffeine_alcohol',
    nutritionField: 'alcohol_after_8pm', highThreshold: 14, lowThreshold: 0, thresholdType: 'above_below',
    biometricField: 'sleep_score', higherIsBetter: true, lagDays: 0,
    labels: { high: 'alcohol after 8pm', low: 'no alcohol after 8pm', outcome: 'sleep score' }
  },

  // Macros
  {
    id: 'protein_recovery', name: 'Protein vs recovery', category: 'macros',
    nutritionField: 'total_protein', highThreshold: 100, lowThreshold: 60, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: '100g+ protein', low: '<60g protein', outcome: 'next-day recovery' }
  },
  {
    id: 'fiber_sleep', name: 'Fiber vs sleep', category: 'macros',
    nutritionField: 'total_fiber', highThreshold: 25, lowThreshold: 12, thresholdType: 'above_below',
    biometricField: 'sleep_score', higherIsBetter: true, lagDays: 0,
    labels: { high: '25g+ fiber', low: '<12g fiber', outcome: 'sleep score' }
  },
  {
    id: 'sugar_recovery', name: 'Sugar vs recovery', category: 'macros',
    nutritionField: 'total_sugar', highThreshold: 50, lowThreshold: 20, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: '50g+ sugar', low: '<20g sugar', outcome: 'next-day recovery' }
  },
  {
    id: 'sodium_rhr', name: 'Sodium vs resting heart rate', category: 'macros',
    nutritionField: 'total_sodium', highThreshold: 2300, lowThreshold: 1500, thresholdType: 'above_below',
    biometricField: 'resting_heart_rate', higherIsBetter: false, lagDays: 1,
    labels: { high: '2300mg+ sodium', low: '<1500mg sodium', outcome: 'next-day resting HR' }
  },

  // Micronutrients
  {
    id: 'magnesium_sleep', name: 'Magnesium vs sleep', category: 'micros',
    nutritionField: 'pct_dv_magnesium', highThreshold: 80, lowThreshold: 40, thresholdType: 'above_below',
    biometricField: 'sleep_score', higherIsBetter: true, lagDays: 0,
    labels: { high: '>80% magnesium target', low: '<40% magnesium target', outcome: 'sleep score' }
  },
  {
    id: 'magnesium_hrv', name: 'Magnesium vs HRV', category: 'micros',
    nutritionField: 'pct_dv_magnesium', highThreshold: 80, lowThreshold: 40, thresholdType: 'above_below',
    biometricField: 'hrv', higherIsBetter: true, lagDays: 1,
    labels: { high: '>80% magnesium target', low: '<40% magnesium target', outcome: 'next-day HRV' }
  },
  {
    id: 'vitamin_d_recovery', name: 'Vitamin D vs recovery', category: 'micros',
    nutritionField: 'pct_dv_vitamin_d', highThreshold: 60, lowThreshold: 20, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: '>60% vitamin D target', low: '<20% vitamin D target', outcome: 'next-day recovery' }
  },
  {
    id: 'vitamin_c_recovery', name: 'Vitamin C vs recovery', category: 'micros',
    nutritionField: 'pct_dv_vitamin_c', highThreshold: 80, lowThreshold: 30, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: '>80% vitamin C target', low: '<30% vitamin C target', outcome: 'next-day recovery' }
  },
  {
    id: 'zinc_recovery', name: 'Zinc vs recovery', category: 'micros',
    nutritionField: 'pct_dv_zinc', highThreshold: 80, lowThreshold: 30, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: '>80% zinc target', low: '<30% zinc target', outcome: 'next-day recovery' }
  },
  {
    id: 'iron_recovery', name: 'Iron vs recovery', category: 'micros',
    nutritionField: 'pct_dv_iron', highThreshold: 80, lowThreshold: 30, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: '>80% iron target', low: '<30% iron target', outcome: 'next-day recovery' }
  },

  // Composite scores
  {
    id: 'adequacy_recovery', name: 'Nutrient adequacy vs recovery', category: 'scores',
    nutritionField: 'nutrient_adequacy_score', highThreshold: 60, lowThreshold: 30, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: '>60% nutrient adequacy', low: '<30% nutrient adequacy', outcome: 'next-day recovery' }
  },
  {
    id: 'inflammatory_hrv', name: 'Inflammatory diet vs HRV', category: 'scores',
    nutritionField: 'inflammatory_score', highThreshold: 65, lowThreshold: 45, thresholdType: 'above_below',
    biometricField: 'hrv', higherIsBetter: true, lagDays: 1,
    labels: { high: 'high inflammatory score', low: 'low inflammatory score', outcome: 'next-day HRV' }
  },
  {
    id: 'inflammatory_recovery', name: 'Inflammatory diet vs recovery', category: 'scores',
    nutritionField: 'inflammatory_score', highThreshold: 65, lowThreshold: 45, thresholdType: 'above_below',
    biometricField: 'recovery_score', higherIsBetter: true, lagDays: 1,
    labels: { high: 'high inflammatory score', low: 'low inflammatory score', outcome: 'next-day recovery' }
  },
];

// ============================================================================
// Core Computation
// ============================================================================

export async function computeCorrelations(userId: string): Promise<CorrelationReport> {
  const supabase = getSupabaseAdmin();

  // Fetch all daily summaries
  const [{ data: nutritionDays }, { data: biometricDays }] = await Promise.all([
    supabase.from('daily_nutrition_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('summary_date', { ascending: true }),
    supabase.from('daily_biometric_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('summary_date', { ascending: true }),
  ]);

  if (!nutritionDays || !biometricDays || nutritionDays.length === 0 || biometricDays.length === 0) {
    return {
      userId,
      generatedAt: new Date().toISOString(),
      totalPairedDays: 0,
      insights: [],
      topInsight: null,
    };
  }

  // Build lookup maps by date
  const nutritionByDate = new Map<string, any>();
  for (const day of nutritionDays) {
    nutritionByDate.set(day.summary_date, day);
  }

  const biometricByDate = new Map<string, any>();
  for (const day of biometricDays) {
    biometricByDate.set(day.summary_date, day);
  }

  // Build paired observations: nutrition Day N → biometrics Day N+offset
  function getPairedData(lagDays: number): Array<{ nutrition: any; biometric: any }> {
    const pairs: Array<{ nutrition: any; biometric: any }> = [];
    for (const [dateStr, nutrition] of Array.from(nutritionByDate.entries())) {
      const targetDate = lagDays === 0
        ? dateStr
        : addDays(dateStr, lagDays);
      const biometric = biometricByDate.get(targetDate);
      if (biometric) {
        pairs.push({ nutrition, biometric });
      }
    }
    return pairs;
  }

  // Run all comparisons
  const insights: CorrelationResult[] = [];

  for (const pair of COMPARISON_PAIRS) {
    const pairedData = getPairedData(pair.lagDays);
    if (pairedData.length < 10) continue; // Need minimum data

    const result = computeSingleCorrelation(pair, pairedData);
    if (result) {
      insights.push(result);
    }
  }

  // Sort by confidence score × absolute effect size
  insights.sort((a, b) => {
    const scoreA = a.confidenceScore * Math.abs(a.percentDifference);
    const scoreB = b.confidenceScore * Math.abs(b.percentDifference);
    return scoreB - scoreA;
  });

  const totalPairedDays = getPairedData(0).length + getPairedData(1).length;

  return {
    userId,
    generatedAt: new Date().toISOString(),
    totalPairedDays: Math.max(getPairedData(0).length, getPairedData(1).length),
    insights,
    topInsight: insights.length > 0 ? insights[0]! : null,
  };
}

function computeSingleCorrelation(
  pair: ComparisonPair,
  pairedData: Array<{ nutrition: any; biometric: any }>
): CorrelationResult | null {
  // Split into high and low groups
  const highGroup: Array<{ outcome: number; strain: number }> = [];
  const lowGroup: Array<{ outcome: number; strain: number }> = [];

  for (const { nutrition, biometric } of pairedData) {
    const nutritionValue = nutrition[pair.nutritionField];
    const outcomeValue = biometric[pair.biometricField];
    const strain = biometric.strain || 0;

    if (nutritionValue == null || outcomeValue == null) continue;

    if (pair.thresholdType === 'boolean') {
      if (nutritionValue) {
        highGroup.push({ outcome: outcomeValue, strain });
      } else {
        lowGroup.push({ outcome: outcomeValue, strain });
      }
    } else {
      if (nutritionValue >= pair.highThreshold) {
        highGroup.push({ outcome: outcomeValue, strain });
      } else if (nutritionValue <= pair.lowThreshold) {
        lowGroup.push({ outcome: outcomeValue, strain });
      }
      // Values between thresholds are excluded (middle zone)
    }
  }

  // Minimum 5 per group
  if (highGroup.length < 5 || lowGroup.length < 5) return null;

  // Compute averages
  const avg = (arr: Array<{ outcome: number }>) =>
    arr.reduce((s, v) => s + v.outcome, 0) / arr.length;
  const avgStrain = (arr: Array<{ strain: number }>) =>
    arr.reduce((s, v) => s + v.strain, 0) / arr.length;

  const highAvg = avg(highGroup);
  const lowAvg = avg(lowGroup);
  const highStrain = avgStrain(highGroup);
  const lowStrain = avgStrain(lowGroup);

  const difference = highAvg - lowAvg;
  const baseAvg = (highAvg + lowAvg) / 2;
  const percentDifference = baseAvg > 0 ? (difference / baseAvg) * 100 : 0;

  // Filter: minimum 3% effect size
  if (Math.abs(percentDifference) < 3) return null;

  // Confounder check: strain difference between groups
  const strainDiff = Math.abs(highStrain - lowStrain);
  const avgStrainOverall = (highStrain + lowStrain) / 2;
  const strainDiffPct = avgStrainOverall > 0 ? (strainDiff / avgStrainOverall) * 100 : 0;
  const confounderControlled = strainDiffPct < 20;
  const confounderWarning = !confounderControlled
    ? `Strain differed ${Math.round(strainDiffPct)}% between groups (${highStrain.toFixed(1)} vs ${lowStrain.toFixed(1)})`
    : undefined;

  // Consistency: what fraction of high-group observations are on the expected side of low-group mean
  const consistency = pair.higherIsBetter
    ? highGroup.filter(v => v.outcome > lowAvg).length / highGroup.length
    : highGroup.filter(v => v.outcome < lowAvg).length / highGroup.length;

  // For "inverse" pairs (high inflammatory → lower HRV = worse), flip direction logic
  const isNutrientBad = pair.nutritionField.includes('inflammatory') ||
    pair.nutritionField.includes('sugar') ||
    pair.nutritionField.includes('sodium') ||
    pair.nutritionField.includes('caffeine') ||
    pair.nutritionField.includes('alcohol') ||
    pair.nutritionField === 'has_late_night_meal';

  // Direction: did the high-nutrition group do better or worse on the biometric?
  let direction: 'better' | 'worse' | 'neutral';
  if (Math.abs(percentDifference) < 3) {
    direction = 'neutral';
  } else if (pair.higherIsBetter) {
    direction = difference > 0 ? (isNutrientBad ? 'worse' : 'better') : (isNutrientBad ? 'better' : 'worse');
  } else {
    // For metrics where lower is better (RHR)
    direction = difference < 0 ? (isNutrientBad ? 'worse' : 'better') : (isNutrientBad ? 'better' : 'worse');
  }

  // Confidence scoring
  const minN = Math.min(highGroup.length, lowGroup.length);
  let confidenceScore = 0;

  // Sample size component (0-40)
  if (minN >= 20) confidenceScore += 40;
  else if (minN >= 10) confidenceScore += 25;
  else if (minN >= 5) confidenceScore += 10;

  // Effect size component (0-30)
  const absEffect = Math.abs(percentDifference);
  if (absEffect >= 10) confidenceScore += 30;
  else if (absEffect >= 5) confidenceScore += 20;
  else if (absEffect >= 3) confidenceScore += 10;

  // Consistency component (0-20)
  if (consistency >= 0.7) confidenceScore += 20;
  else if (consistency >= 0.6) confidenceScore += 10;

  // Confounder control component (0-10)
  if (confounderControlled) confidenceScore += 10;

  const confidence: 'low' | 'medium' | 'high' =
    confidenceScore >= 70 ? 'high' :
    confidenceScore >= 40 ? 'medium' : 'low';

  // Generate display sentence
  const displaySentence = generateDisplaySentence(pair, highGroup.length, lowGroup.length, highAvg, lowAvg, difference, confidence);

  return {
    pairId: pair.id,
    pairName: pair.name,
    category: pair.category,
    highGroup: { avg: round(highAvg, 1), n: highGroup.length, avgStrain: round(highStrain, 1) },
    lowGroup: { avg: round(lowAvg, 1), n: lowGroup.length, avgStrain: round(lowStrain, 1) },
    difference: round(difference, 1),
    percentDifference: round(percentDifference, 1),
    direction,
    consistency: round(consistency, 2),
    confounderControlled,
    confounderWarning,
    confidence,
    confidenceScore,
    displaySentence,
  };
}

function generateDisplaySentence(
  pair: ComparisonPair,
  highN: number, lowN: number,
  highAvg: number, lowAvg: number,
  difference: number,
  confidence: string
): string {
  const absDiff = Math.abs(round(difference, 1));
  const totalN = highN + lowN;

  if (pair.thresholdType === 'boolean') {
    const better = pair.higherIsBetter ? (highAvg > lowAvg ? 'higher' : 'lower') : (highAvg < lowAvg ? 'lower' : 'higher');
    return `On nights with ${pair.labels.high}, your ${pair.labels.outcome} averaged ${round(highAvg, 1)} vs ${round(lowAvg, 1)} without (${absDiff}-point difference across ${totalN} nights). Confidence: ${confidence}.`;
  }

  const higherLabel = pair.labels.high;
  const lowerLabel = pair.labels.low;
  return `On days with ${higherLabel}, your ${pair.labels.outcome} averaged ${round(highAvg, 1)}. On days with ${lowerLabel}, it averaged ${round(lowAvg, 1)}. That's a ${absDiff}-point gap across ${totalN} days. Confidence: ${confidence}.`;
}

// ============================================================================
// Helpers
// ============================================================================

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]!;
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
