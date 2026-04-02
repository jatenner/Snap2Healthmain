'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../components/client/ClientAuthProvider';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';
import { Beaker, CheckCircle, Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface Experiment {
  id: string;
  title: string;
  hypothesis: string;
  targetBehavior: string;
  measurementField: string;
  expectedDirection: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  baselineValue: number | null;
  status: string;
  logs: Array<{ date: string; compliant: boolean | null; measurementValue: number | null }>;
  result?: {
    experimentAvg: number;
    baselineAvg: number;
    difference: number;
    percentChange: number;
    complianceRate: number;
    outcome: string;
    confidence: string;
    summary: string;
  };
}

interface SystemSuggestion {
  action: string;
  targetBehavior: string;
  measurementField: string;
  expectedDirection: string;
  durationDays: number;
  outcomeLabel: string;
  statusDetail: string;
  evidenceStrength: string;
  sourceCorrelationId: string;
}

function ExperimentsContent() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [suggestions, setSuggestions] = useState<SystemSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, trendRes] = await Promise.all([
        fetch('/api/experiments').then(r => r.json()),
        fetch('/api/trends?days=30').then(r => r.json()),
      ]);

      setExperiments(expRes.experiments || []);

      // Extract system suggestions from outcome analyses
      const outcomeAnalyses = trendRes.outcomeAnalyses || [];
      const systemSuggestions: SystemSuggestion[] = [];
      for (const oa of outcomeAnalyses) {
        if (oa.recommendedTest && oa.status !== 'good') {
          systemSuggestions.push({
            action: oa.recommendedTest.action,
            targetBehavior: oa.recommendedTest.targetBehavior,
            measurementField: oa.recommendedTest.measurementField,
            expectedDirection: oa.recommendedTest.expectedDirection,
            durationDays: oa.recommendedTest.durationDays,
            outcomeLabel: oa.outcomeLabel,
            statusDetail: oa.statusDetail,
            evidenceStrength: oa.primaryDrivers?.[0]?.evidenceStrength || 'moderate',
            sourceCorrelationId: `outcome_${oa.outcome}_${oa.primaryDrivers?.[0]?.pairId || 'unknown'}`,
          });
        }
      }
      setSuggestions(systemSuggestions);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStartExperiment = async (suggestion: SystemSuggestion) => {
    setCreating(true);
    await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: suggestion.action.split(' for ')[0] || suggestion.action.substring(0, 60),
        hypothesis: `${suggestion.action} may improve ${suggestion.outcomeLabel.toLowerCase()}`,
        targetBehavior: suggestion.targetBehavior,
        measurementField: suggestion.measurementField,
        expectedDirection: suggestion.expectedDirection,
        durationDays: suggestion.durationDays,
        sourceCorrelationId: suggestion.sourceCorrelationId,
      }),
    });
    setCreating(false);
    fetchData();
  };

  const handleComplete = async (id: string) => {
    await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', experimentId: id }),
    });
    fetchData();
  };

  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">Loading...</div>;

  const active = experiments.filter(e => e.status === 'active');
  const completed = experiments.filter(e => e.status === 'completed');
  const hasActiveExperiment = active.length > 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Insights & Experiments</h1>
        <p className="text-sm text-gray-400 mt-1">The system analyzes your data and suggests what to test next.</p>
      </div>

      {/* ====== ACTIVE EXPERIMENT ====== */}
      {active.map(exp => {
        const daysElapsed = Math.max(0, Math.floor((Date.now() - new Date(exp.startDate).getTime()) / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, exp.durationDays - daysElapsed);
        const progress = Math.min(100, Math.round((daysElapsed / exp.durationDays) * 100));
        const compliantDays = exp.logs.filter(l => l.compliant === true).length;
        const loggedDays = exp.logs.filter(l => l.compliant != null).length;
        const complianceRate = loggedDays > 0 ? Math.round((compliantDays / loggedDays) * 100) : 0;

        // Current measurement vs baseline
        const recentMeasurements = exp.logs.filter(l => l.measurementValue != null).map(l => l.measurementValue!);
        const currentAvg = recentMeasurements.length > 0
          ? Math.round((recentMeasurements.reduce((a, b) => a + b, 0) / recentMeasurements.length) * 10) / 10
          : null;

        return (
          <div key={exp.id} className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Beaker className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">Active Experiment</span>
            </div>

            <p className="text-gray-900 font-medium text-sm">{exp.title}</p>
            <p className="text-xs text-gray-400 mt-1">{exp.targetBehavior}</p>

            {/* Progress */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Day {daysElapsed} of {exp.durationDays}</span>
                <span>{daysRemaining} days left</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Day grid */}
            <div className="flex gap-1 flex-wrap mt-3">
              {Array.from({ length: exp.durationDays }, (_, i) => {
                const dayDate = new Date(exp.startDate);
                dayDate.setDate(dayDate.getDate() + i);
                const dateStr = dayDate.toISOString().split('T')[0];
                const log = exp.logs.find(l => l.date === dateStr);
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-md text-[10px] flex items-center justify-center font-medium ${
                      log?.compliant === true ? 'bg-green-500/30 text-green-700' :
                      log?.compliant === false ? 'bg-red-500/30 text-red-700' :
                      isToday ? 'bg-purple-500/30 text-purple-600 ring-1 ring-purple-400' :
                      'bg-gray-100/50 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mt-3 text-xs">
              {loggedDays > 0 && (
                <div>
                  <span className="text-gray-400">Compliance</span>
                  <span className={`ml-1 font-medium ${complianceRate >= 70 ? 'text-green-400' : complianceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {complianceRate}%
                  </span>
                </div>
              )}
              {currentAvg != null && exp.baselineValue != null && (
                <div>
                  <span className="text-gray-400">{exp.measurementField.replace(/_/g, ' ')}</span>
                  <span className={`ml-1 font-medium ${
                    (exp.expectedDirection === 'increase' ? currentAvg > exp.baselineValue : currentAvg < exp.baselineValue)
                      ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {currentAvg} <span className="text-gray-500">(was {exp.baselineValue})</span>
                  </span>
                </div>
              )}
            </div>

            {daysElapsed >= exp.durationDays && (
              <button
                onClick={() => handleComplete(exp.id)}
                className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                Complete & See Results
              </button>
            )}
          </div>
        );
      })}

      {/* ====== SYSTEM SUGGESTIONS (not user-chosen presets) ====== */}
      {!hasActiveExperiment && suggestions.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Suggested by Your Data
          </h2>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${
                    s.evidenceStrength === 'strong' ? 'bg-blue-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-xs text-gray-400">{s.statusDetail}</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">{s.action}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Measures: {s.measurementField.replace(/_/g, ' ')} over {s.durationDays} days
                </p>
                <button
                  onClick={() => handleStartExperiment(s)}
                  disabled={creating}
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 rounded-xl text-sm font-medium"
                >
                  {creating ? 'Starting...' : 'Start This Experiment'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasActiveExperiment && suggestions.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Not Enough Data Yet</span>
          <p className="text-gray-900 font-medium mt-2">The system can&apos;t suggest experiments until it finds patterns in your data.</p>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <p>Here&apos;s what&apos;s needed:</p>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
              <span><strong>Log meals consistently</strong> — upload or describe what you eat each day (lunch, dinner, snacks, drinks, supplements)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
              <span><strong>Keep WHOOP synced</strong> — the system needs sleep, recovery, and HRV data alongside your meals</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
              <span><strong>~10 days of overlap</strong> — once the system has 10+ days with both meal and biometric data, it will start detecting patterns and suggesting experiments</span>
            </div>
          </div>
        </div>
      )}

      {/* ====== COMPLETED EXPERIMENTS ====== */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Past Results</h2>
          <div className="space-y-3">
            {completed.map(exp => (
              <div key={exp.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{exp.title}</span>
                  {exp.result && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      exp.result.outcome === 'improved' ? 'bg-green-100 text-green-700' :
                      exp.result.outcome === 'worsened' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {exp.result.outcome === 'improved' ? 'Worked' : exp.result.outcome === 'worsened' ? 'No effect' : 'Inconclusive'}
                    </span>
                  )}
                </div>

                {exp.result && (
                  <>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-gray-100/50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400">Before</div>
                        <div className="text-sm font-bold text-gray-900">{exp.result.baselineAvg}</div>
                      </div>
                      <div className="bg-gray-100/50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400">During</div>
                        <div className={`text-sm font-bold ${
                          exp.result.outcome === 'improved' ? 'text-green-400' : 'text-gray-900'
                        }`}>{exp.result.experimentAvg}</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{exp.result.summary}</p>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Compliance: {exp.result.complianceRate}% | {exp.result.confidence} confidence
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExperimentsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Please <Link href="/login" className="text-blue-600">log in</Link>.</p></div>;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50">
        <ExperimentsContent />
      </div>
    </ClientOnly>
  );
}
