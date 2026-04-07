'use client';

import Link from 'next/link';
import { useAuth } from '../components/client/ClientAuthProvider';
import ClientOnly from '../components/ClientOnly';
import { useEffect, useState } from 'react';
import { Camera, ChevronDown, ChevronUp, Clock, Sparkles } from 'lucide-react';
import { InsightHero, FactsPanel, ScoresPanel, PatternsPanel, DriversPanel, RecommendationsPanel, ConfidencePanel, HypothesesPanel } from '../components/insights/InsightPanels';

interface InsightsData {
  personalizationStatus?: {
    isPersonalized: boolean;
    reason: string;
    missingFields: string[];
    defaultsApplied: Record<string, any>;
  };
  insight?: {
    facts: any[];
    scores: any[];
    patterns: any[];
    drivers: any[];
    recommendations: any[];
    hypotheses: any[];
    confidence: { overall: number; dataQuality: number; sampleSize: number; inputConfidence: number };
  };
  narrative?: string;
  dataStatus: {
    hasBiometrics: boolean;
    hasNutritionToday: boolean;
    hasCorrelations: boolean;
    pairedDays: number;
    neededForInsights: number;
  };
  correlationAge: number | null;
}

/**
 * Collapsible section wrapper for the evidence tier.
 */
function Section({ title, count, children, defaultOpen = false }: {
  title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">
          {title}{count != null && count > 0 ? <span className="text-slate-400 ml-1">({count})</span> : ''}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function InsightsContent() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
    fetch('/api/today', { headers: tz ? { 'x-timezone': tz } : {} })
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-slate-400 animate-pulse">Loading insights...</div></div>;

  if (!data) return (
    <div className="max-w-lg mx-auto px-5 py-16 text-center">
      <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">No Data Yet</h2>
      <p className="text-slate-500 mb-6">Upload meals and connect WHOOP to see how your diet affects your body.</p>
      <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700">
        <Camera className="w-5 h-5" /> Upload a Meal
      </Link>
    </div>
  );

  const ins = data.insight;
  const hasInsight = ins && (ins.facts.length > 0 || ins.patterns.length > 0 || (ins.hypotheses?.length || 0) > 0);

  // Separate patterns by finding type for editorial presentation
  const helpfulPatterns = ins?.patterns?.filter((p: any) => p.findingType === 'helpful') || [];
  const harmfulPatterns = ins?.patterns?.filter((p: any) => p.findingType === 'harmful') || [];

  return (
    <div className="max-w-lg mx-auto px-5 py-6 space-y-4">

      {/* ====== PAGE HEADER ====== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Insights</h1>
          <p className="text-xs text-slate-400 mt-0.5">How your diet appears to affect your body</p>
        </div>
        {data.correlationAge != null && data.dataStatus.hasCorrelations && (
          <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
            data.correlationAge < 24 ? 'bg-emerald-50 text-emerald-700'
            : data.correlationAge < 48 ? 'bg-amber-50 text-amber-700'
            : 'bg-red-50 text-red-700'
          }`}>
            <Clock className="w-3 h-3 inline mr-0.5" />
            {data.correlationAge < 24 ? 'Current' : `${Math.round(data.correlationAge)}h ago`}
          </span>
        )}
      </div>

      {/* ====== TIER 1: HERO SUMMARY ====== */}
      <InsightHero
        narrative={data.narrative || ''}
        confidence={ins?.confidence || { overall: 0, sampleSize: 0, dataQuality: 0, inputConfidence: 0 }}
        personalizationStatus={data.personalizationStatus}
      />

      {/* ====== BUILDING PROFILE (when not enough data) ====== */}
      {!hasInsight && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Building Your Profile</span>
          <p className="text-slate-800 font-medium mt-2">
            {data.dataStatus.pairedDays === 0
              ? 'Start logging meals to unlock insights'
              : `${data.dataStatus.pairedDays} of ${data.dataStatus.neededForInsights} paired days collected`}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (data.dataStatus.pairedDays / data.dataStatus.neededForInsights) * 100)}%` }} />
          </div>
          {!data.dataStatus.hasBiometrics && (
            <p className="text-sm text-slate-500 mt-3">Connect WHOOP on your <Link href="/profile" className="text-blue-600 underline">Profile</Link> to track biometrics.</p>
          )}
        </div>
      )}

      {/* ====== TIER 1: TOP ACTION ====== */}
      {ins && ins.recommendations.length > 0 && (
        <RecommendationsPanel recommendations={ins.recommendations.slice(0, 2)} />
      )}

      {/* ====== TIER 1: SCORES (always visible) ====== */}
      {ins && ins.scores.length > 0 && <ScoresPanel scores={ins.scores} />}

      {/* ====== TIER 2: EVIDENCE (expandable sections) ====== */}
      {hasInsight && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-1">Evidence</p>

          {/* What appears to help */}
          {helpfulPatterns.length > 0 && (
            <Section title="What appears to help" count={helpfulPatterns.length} defaultOpen={true}>
              <PatternsPanel patterns={helpfulPatterns} />
            </Section>
          )}

          {/* What appears to hurt */}
          {harmfulPatterns.length > 0 && (
            <Section title="What appears to hurt" count={harmfulPatterns.length} defaultOpen={true}>
              <PatternsPanel patterns={harmfulPatterns} />
            </Section>
          )}

          {/* Key drivers */}
          {ins && ins.drivers.length > 0 && (
            <Section title="Key drivers" count={ins.drivers.length}>
              <DriversPanel drivers={ins.drivers} />
            </Section>
          )}

          {/* Additional recommendations */}
          {ins && ins.recommendations.length > 2 && (
            <Section title="More recommendations" count={ins.recommendations.length - 2}>
              <RecommendationsPanel recommendations={ins.recommendations.slice(2)} />
            </Section>
          )}

          {/* Hypothesis testing transparency */}
          {ins && ins.hypotheses && ins.hypotheses.length > 0 && (
            <Section title="Tested hypotheses" count={ins.hypotheses.length}>
              <HypothesesPanel hypotheses={ins.hypotheses} />
            </Section>
          )}
        </div>
      )}

      {/* ====== TIER 3: DATA CONTEXT ====== */}
      {ins && ins.facts.length > 0 && (
        <Section title="Today's data">
          <FactsPanel facts={ins.facts} />
        </Section>
      )}

      {ins && (
        <ConfidencePanel confidence={ins.confidence} personalizationStatus={data.personalizationStatus} />
      )}
    </div>
  );
}

export default function InsightsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-slate-400 animate-pulse">Loading...</div></div>;

  if (!isAuthenticated) {
    return (
      <ClientOnly>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Sign in to see insights</h1>
            <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700">Sign In</Link>
          </div>
        </div>
      </ClientOnly>
    );
  }

  return <ClientOnly><InsightsContent /></ClientOnly>;
}
