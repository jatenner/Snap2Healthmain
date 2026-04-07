'use client';

import { useState } from 'react';
import { Activity, AlertTriangle, ArrowDown, ArrowUp, BarChart3, Brain, CheckCircle, ChevronRight, Flame, Heart, Info, Lightbulb, Moon, Shield, Sparkles, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import SourceBadge from '../SourceBadge';
import type { Insight, Fact, Score, Pattern, Driver, Recommendation, HypothesisResult } from '../../lib/insight-schema';

// ============================================================================
// HERO SUMMARY
// ============================================================================

export function InsightHero({ narrative, confidence, personalizationStatus }: {
  narrative: string;
  confidence: { overall: number; sampleSize: number };
  personalizationStatus?: { isPersonalized: boolean; reason: string; missingFields: string[] };
}) {
  return (
    <div className="space-y-3">
      {/* Personalization warning */}
      {personalizationStatus && !personalizationStatus.isPersonalized && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-800">Using default profile</p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              {personalizationStatus.missingFields.length > 0
                ? `Complete your profile (${personalizationStatus.missingFields.join(', ')}) for personalized analysis.`
                : personalizationStatus.reason}
            </p>
          </div>
        </div>
      )}

      {/* Narrative card */}
      {narrative && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Today&apos;s Summary</span>
            </div>
            <div className="flex items-center gap-2">
              <SourceBadge source="ai_interpretation" />
              {confidence.sampleSize > 0 && (
                <span className="text-[10px] text-slate-400">{confidence.sampleSize}d data</span>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{narrative}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FACTS PANEL
// ============================================================================

const FACT_ICONS: Record<string, any> = {
  'Calories': Flame, 'Protein': Target, 'Carbs': Zap, 'Fat': Zap,
  'Sleep': Moon, 'Recovery': Heart, 'HRV': Activity, 'Resting HR': Heart, 'Strain': Flame,
};
const FACT_COLORS: Record<string, { text: string; bg: string }> = {
  'Calories': { text: 'text-orange-600', bg: 'bg-orange-50' },
  'Protein': { text: 'text-blue-600', bg: 'bg-blue-50' },
  'Carbs': { text: 'text-yellow-600', bg: 'bg-yellow-50' },
  'Fat': { text: 'text-pink-600', bg: 'bg-pink-50' },
  'Fiber': { text: 'text-green-600', bg: 'bg-green-50' },
  'Sleep': { text: 'text-indigo-600', bg: 'bg-indigo-50' },
  'Recovery': { text: 'text-emerald-600', bg: 'bg-emerald-50' },
  'HRV': { text: 'text-purple-600', bg: 'bg-purple-50' },
  'Resting HR': { text: 'text-red-600', bg: 'bg-red-50' },
  'Strain': { text: 'text-orange-600', bg: 'bg-orange-50' },
};

export function FactsPanel({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null;

  // Split into nutrition and biometric groups
  const nutritionLabels = ['Calories', 'Protein', 'Carbs', 'Fat', 'Fiber', 'Caffeine', 'Alcohol', 'Water', 'Meals logged'];
  const nutritionFacts = facts.filter(f => nutritionLabels.includes(f.label));
  const biometricFacts = facts.filter(f => !nutritionLabels.includes(f.label) && !f.label.includes('vs baseline'));
  const deviations = facts.filter(f => f.label.includes('vs baseline'));

  return (
    <div className="space-y-4">
      {/* Nutrition row */}
      {nutritionFacts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Nutrition</span>
            <SourceBadge source="ai_estimate" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {nutritionFacts.filter(f => f.label !== 'Meals logged').map(f => {
              const color = FACT_COLORS[f.label] || { text: 'text-slate-600', bg: 'bg-slate-50' };
              return (
                <div key={f.label} className={`${color.bg} rounded-xl p-3`}>
                  <span className="text-[10px] text-slate-500 font-medium">{f.label}</span>
                  <div className={`text-lg font-bold ${color.text}`}>
                    {f.value}<span className="text-xs font-normal ml-0.5">{f.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Biometric row */}
      {biometricFacts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Body</span>
            <SourceBadge source="user_data" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {biometricFacts.map(f => {
              const color = FACT_COLORS[f.label] || { text: 'text-slate-600', bg: 'bg-slate-50' };
              const deviation = deviations.find(d => d.label.startsWith(f.label));
              return (
                <div key={f.label} className={`${color.bg} rounded-xl p-3`}>
                  <span className="text-[10px] text-slate-500 font-medium">{f.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${color.text}`}>{f.value}</span>
                    <span className="text-xs text-slate-400">{f.unit}</span>
                  </div>
                  {deviation && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {String(deviation.value).startsWith('+')
                        ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                        : <TrendingDown className="w-3 h-3 text-red-500" />}
                      <span className={`text-[10px] font-medium ${String(deviation.value).startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                        {deviation.value}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SCORES PANEL
// ============================================================================

function scoreColor(name: string, value: number, max: number): string {
  const pct = value / max;
  if (name === 'Inflammatory Index') {
    return pct <= 0.4 ? 'text-emerald-600' : pct <= 0.6 ? 'text-amber-600' : 'text-red-600';
  }
  return pct >= 0.7 ? 'text-emerald-600' : pct >= 0.4 ? 'text-amber-600' : 'text-red-600';
}

function scoreBarColor(name: string, value: number, max: number): string {
  const pct = value / max;
  if (name === 'Inflammatory Index') {
    return pct <= 0.4 ? 'bg-emerald-400' : pct <= 0.6 ? 'bg-amber-400' : 'bg-red-400';
  }
  return pct >= 0.7 ? 'bg-emerald-400' : pct >= 0.4 ? 'bg-amber-400' : 'bg-red-400';
}

export function ScoresPanel({ scores }: { scores: Score[] }) {
  if (scores.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Scores</span>
        <SourceBadge source="computed" />
      </div>
      <div className="space-y-3">
        {scores.map(s => (
          <div key={s.name} className="bg-white border border-slate-100 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700">{s.name}</span>
              <span className={`text-sm font-bold ${scoreColor(s.name, s.value, s.max)}`}>{s.value}<span className="text-xs font-normal text-slate-400">/{s.max}</span></span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full rounded-full transition-all ${scoreBarColor(s.name, s.value, s.max)}`} style={{ width: `${Math.min(100, (s.value / s.max) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">{s.interpretation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PATTERNS PANEL
// ============================================================================

export function PatternsPanel({ patterns }: { patterns: Pattern[] }) {
  if (patterns.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Detected Patterns</span>
        <SourceBadge source="computed" />
      </div>
      <div className="space-y-2">
        {patterns.map((p, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {p.direction === 'negative'
                    ? <ArrowDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    : <ArrowUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                  <span className={`text-xs font-semibold ${p.direction === 'negative' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {p.effect}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">{p.category}</span>
                </div>
                <p className="text-[12px] text-slate-600 leading-snug">{p.description.split('. Confidence')[0]}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  p.confidence >= 70 ? 'bg-emerald-50 text-emerald-700'
                  : p.confidence >= 50 ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-50 text-slate-500'
                }`}>
                  {p.confidence >= 70 ? 'strong' : p.confidence >= 50 ? 'moderate' : 'weak'}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{p.sampleSize}d</span>
              </div>
            </div>
            {p.confounderWarnings && p.confounderWarnings.length > 0 && (
              <p className="text-[10px] text-amber-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Potential confounder: {p.confounderWarnings[0]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DRIVERS PANEL
// ============================================================================

export function DriversPanel({ drivers }: { drivers: Driver[] }) {
  if (drivers.length === 0) return null;

  // Group by outcome
  const grouped = new Map<string, Driver[]>();
  for (const d of drivers) {
    const list = grouped.get(d.outcome) || [];
    list.push(d);
    grouped.set(d.outcome, list);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Key Drivers</span>
        <SourceBadge source="computed" />
      </div>
      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([outcome, items]) => (
          <div key={outcome} className="bg-white border border-slate-100 rounded-xl p-3.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{outcome}</span>
            <div className="mt-2 space-y-1.5">
              {items.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    d.direction === 'negative' ? 'bg-red-400' : 'bg-emerald-400'
                  }`} />
                  <span className="text-xs text-slate-700 flex-1">{d.factor}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    d.impact === 'high' ? 'bg-red-50 text-red-600'
                    : d.impact === 'medium' ? 'bg-amber-50 text-amber-600'
                    : 'bg-slate-50 text-slate-500'
                  }`}>{d.impact}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// RECOMMENDATIONS PANEL
// ============================================================================

const SOURCE_LABELS: Record<string, string> = {
  score: 'Based on score',
  deficiency: 'Nutrient gap',
  correlation: 'Pattern-based',
  driver: 'From driver',
};

const RECURRENCE_BADGES: Record<string, { label: string; color: string }> = {
  persistent: { label: 'Persistent', color: 'bg-red-50 text-red-600' },
  recurring:  { label: 'Recurring',  color: 'bg-amber-50 text-amber-600' },
  improving:  { label: 'Improving',  color: 'bg-emerald-50 text-emerald-600' },
  new:        { label: 'New',        color: 'bg-blue-50 text-blue-600' },
  resolved:   { label: 'Resolved',   color: 'bg-slate-50 text-slate-400' },
};

const IMPACT_BADGES: Record<string, { label: string; color: string }> = {
  high:   { label: 'High impact', color: 'bg-rose-50 text-rose-600' },
  medium: { label: 'Medium',      color: 'bg-amber-50 text-amber-600' },
  low:    { label: 'Low',         color: 'bg-slate-50 text-slate-400' },
};

export function RecommendationsPanel({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Recommendations</span>
      </div>
      <div className="space-y-2">
        {recommendations.map((r, i) => {
          const rec = r as any; // handles Phase 4 extended fields safely
          const recurrence = rec.recurrence ? RECURRENCE_BADGES[rec.recurrence] : null;
          const impact = rec.expectedImpact ? IMPACT_BADGES[rec.expectedImpact] : null;
          const isTopPriority = i === 0 && (rec.priority ?? 0) >= 60;

          return (
            <div key={rec.id || i} className={`bg-white border rounded-xl p-3.5 ${isTopPriority ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-100'}`}>
              <div className="flex items-start gap-2.5">
                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  r.confidence >= 70 ? 'text-emerald-500' : r.confidence >= 50 ? 'text-amber-500' : 'text-slate-400'
                }`} />
                <div className="flex-1 min-w-0">
                  {/* Top priority label */}
                  {isTopPriority && (
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Top Priority</span>
                  )}
                  <p className="text-sm font-medium text-slate-800">{r.action}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.rationale}</p>

                  {/* Metadata row: provenance + recurrence + impact + confidence */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {r.linkedTo && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {r.linkedTo.type === 'score' ? `↗ ${r.linkedTo.name}`
                          : r.linkedTo.type === 'deficiency' ? `⚠ Low ${r.linkedTo.name}`
                          : r.linkedTo.type === 'pattern' ? '📊 Pattern'
                          : r.linkedTo.name}
                      </span>
                    )}
                    {recurrence && recurrence.label !== 'New' && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${recurrence.color}`}>
                        {recurrence.label}
                      </span>
                    )}
                    {impact && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${impact.color}`}>
                        {impact.label}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{r.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// CONFIDENCE PANEL
// ============================================================================

export function ConfidencePanel({ confidence, personalizationStatus }: {
  confidence: { overall: number; dataQuality: number; sampleSize: number; inputConfidence: number };
  personalizationStatus?: { isPersonalized: boolean };
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <Shield className="w-4 h-4 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Data Confidence</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ConfidenceRow label="Overall" value={confidence.overall} />
        <ConfidenceRow label="Data quality" value={confidence.dataQuality} />
        <ConfidenceRow label="Paired days" value={confidence.sampleSize} isCount />
        <ConfidenceRow label="Input confidence" value={confidence.inputConfidence} />
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${personalizationStatus?.isPersonalized ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className="text-[11px] text-slate-500">
          {personalizationStatus?.isPersonalized ? 'Personalized to your profile' : 'Using default profile estimates'}
        </span>
      </div>
    </div>
  );
}

function ConfidenceRow({ label, value, isCount }: { label: string; value: number; isCount?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400">{label}</span>
      <div className="flex items-center gap-2 mt-0.5">
        {!isCount && (
          <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${value >= 70 ? 'bg-emerald-400' : value >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.min(100, value)}%` }} />
          </div>
        )}
        <span className="text-xs font-medium text-slate-600">{isCount ? value : `${value}%`}</span>
      </div>
    </div>
  );
}

// ============================================================================
// HYPOTHESES PANEL — what was tested, including null findings
// ============================================================================

const FINDING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  helpful:           { label: 'Helpful',           color: 'text-emerald-700', bg: 'bg-emerald-50' },
  harmful:           { label: 'Harmful',           color: 'text-red-700',     bg: 'bg-red-50' },
  neutral:           { label: 'No effect',         color: 'text-slate-600',   bg: 'bg-slate-50' },
  insufficient_data: { label: 'Needs more data',   color: 'text-blue-600',    bg: 'bg-blue-50' },
};

export function HypothesesPanel({ hypotheses }: { hypotheses: HypothesisResult[] }) {
  if (!hypotheses || hypotheses.length === 0) return null;

  const [expanded, setExpanded] = useState(false);

  const helpful = hypotheses.filter(h => h.findingType === 'helpful');
  const harmful = hypotheses.filter(h => h.findingType === 'harmful');
  const neutral = hypotheses.filter(h => h.findingType === 'neutral');
  const insufficient = hypotheses.filter(h => h.findingType === 'insufficient_data');
  const detected = helpful.length + harmful.length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Hypothesis Testing</span>
        <SourceBadge source="computed" />
      </div>

      {/* Summary bar */}
      <div className="bg-white border border-slate-100 rounded-xl p-3.5 mb-2">
        <p className="text-sm text-slate-700">
          Tested <span className="font-semibold">{hypotheses.length}</span> diet-biomarker relationships
        </p>
        <div className="flex gap-3 mt-2">
          {helpful.length > 0 && <span className="text-[11px] text-emerald-600 font-medium">{helpful.length} helpful</span>}
          {harmful.length > 0 && <span className="text-[11px] text-red-600 font-medium">{harmful.length} harmful</span>}
          {neutral.length > 0 && <span className="text-[11px] text-slate-500 font-medium">{neutral.length} no effect</span>}
          {insufficient.length > 0 && <span className="text-[11px] text-blue-600 font-medium">{insufficient.length} need data</span>}
        </div>

        {/* Honesty statement */}
        {neutral.length > 0 && detected > 0 && (
          <p className="text-[11px] text-slate-400 mt-2">
            {neutral.length} factor{neutral.length !== 1 ? 's' : ''} tested but showed no meaningful effect on your biomarkers.
            {neutral.length > detected && ' Diet may not be the primary driver for some outcomes.'}
          </p>
        )}
      </div>

      {/* Expandable detail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] text-blue-600 font-medium hover:text-blue-700 mb-2"
      >
        {expanded ? 'Hide details' : `See all ${hypotheses.length} tested hypotheses`}
      </button>

      {expanded && (
        <div className="space-y-1.5">
          {/* Show neutral findings prominently — these ARE findings */}
          {neutral.map((h, i) => (
            <div key={`n-${i}`} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">No effect</span>
                <span className="text-[10px] text-slate-400 capitalize">{h.category}</span>
              </div>
              <p className="text-[11px] text-slate-600">{h.detail}</p>
            </div>
          ))}

          {/* Insufficient data with progress */}
          {insufficient.map((h, i) => (
            <div key={`i-${i}`} className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-blue-600">{h.pairName}</span>
                <span className="text-[10px] text-blue-400">{h.sampleSize}/{h.requiredSampleSize} days</span>
              </div>
              <div className="w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, (h.sampleSize / h.requiredSampleSize) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
