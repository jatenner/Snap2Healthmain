/**
 * Structured Insight Schema
 *
 * Every insight the system produces must conform to this schema.
 * LLMs receive this structure and may ONLY explain it — never invent beyond it.
 */

export type SourceType = 'user_data' | 'ai_estimate' | 'computed';

export interface Fact {
  label: string;
  value: string | number;
  unit?: string;
  source: SourceType;
}

export interface Score {
  name: string;
  value: number;
  max: number;
  interpretation: string;
  source: 'computed';
}

export type FindingType = 'helpful' | 'harmful' | 'neutral' | 'insufficient_data';

export interface Pattern {
  id: string;
  description: string;
  effect: string;
  confidence: number;
  adjustedConfidence?: number;
  survivedFDR?: boolean;
  sampleSize: number;
  direction: 'positive' | 'negative' | 'neutral';
  findingType: FindingType;     // classifies what this pattern means
  category: string;
  confounderWarnings?: string[];
  temporalType?: 'same_day' | 'next_day' | 'evening_overnight' | 'rolling_3d' | 'rolling_7d';
  temporalDescription?: string;
}

/** A hypothesis that was tested — including those with no effect or insufficient data. */
export interface HypothesisResult {
  pairId: string;
  pairName: string;
  category: string;
  findingType: FindingType;
  detail: string;               // human-readable: "Tested X across N days — no effect detected"
  sampleSize: number;           // 0 if insufficient data
  requiredSampleSize: number;   // how many days needed (10 for most pairs)
  effectSize?: number;          // percentDifference if tested
  confidence?: number;
}

export interface Driver {
  factor: string;
  outcome: string;
  impact: 'high' | 'medium' | 'low';
  direction: 'positive' | 'negative';
  confidence: number;
}

export interface Recommendation {
  id: string;                    // stable ID for tracking across days
  action: string;
  rationale: string;
  confidence: number;
  priority: number;              // 0-100, higher = more important to act on
  source: 'correlation' | 'deficiency' | 'score';
  category: 'nutrition' | 'timing' | 'substance' | 'recovery' | 'general';
  expectedImpact: 'high' | 'medium' | 'low';
  recurrence: RecurrenceStatus;
  linkedTo?: {
    type: 'score' | 'pattern' | 'driver' | 'deficiency';
    name: string;
    value?: number;
  };
  supportingSignals?: string[];  // additional evidence references
  // Effectiveness tracking (Phase 5)
  effectiveness?: 'unknown' | 'unresolved' | 'possibly_effective' | 'likely_effective' | 'ineffective';
  timesTriggered?: number;
  firstSeen?: string;
}

export type RecurrenceStatus =
  | 'new'          // first time this recommendation appears
  | 'recurring'    // appeared multiple recent days
  | 'persistent'   // appeared most days in the window
  | 'improving'    // was recurring but frequency is declining
  | 'resolved';    // was active, now resolved

export interface ConfidenceSummary {
  overall: number;
  dataQuality: number;
  sampleSize: number;
  inputConfidence: number;
}

export interface Insight {
  generatedAt: string;
  facts: Fact[];
  scores: Score[];
  patterns: Pattern[];
  drivers: Driver[];
  recommendations: Recommendation[];
  hypotheses: HypothesisResult[];  // ALL tested hypotheses — including null findings
  confidence: ConfidenceSummary;
}

export function emptyInsight(): Insight {
  return {
    generatedAt: new Date().toISOString(),
    facts: [],
    scores: [],
    patterns: [],
    drivers: [],
    recommendations: [],
    hypotheses: [],
    confidence: { overall: 0, dataQuality: 0, sampleSize: 0, inputConfidence: 0 },
  };
}
