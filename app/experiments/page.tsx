'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../components/client/ClientAuthProvider';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';
import { Beaker, CheckCircle, XCircle, Clock, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  baselineN: number | null;
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">Active</span>;
  if (status === 'completed') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">Completed</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
}

function OutcomeBadge({ outcome, confidence }: { outcome: string; confidence: string }) {
  const colors = {
    improved: 'bg-green-500/20 text-green-300',
    worsened: 'bg-red-500/20 text-red-300',
    no_change: 'bg-yellow-500/20 text-yellow-300',
  };
  return (
    <div className="flex gap-2">
      <span className={`text-xs px-2 py-0.5 rounded-full ${(colors as any)[outcome] || colors.no_change}`}>
        {outcome === 'improved' ? 'Improved' : outcome === 'worsened' ? 'Not Effective' : 'No Change'}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        confidence === 'high' ? 'bg-green-500/20 text-green-300' :
        confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
        'bg-gray-500/20 text-gray-400'
      }`}>
        {confidence} confidence
      </span>
    </div>
  );
}

function ExperimentCard({ exp, onComplete }: { exp: Experiment; onComplete: (id: string) => void }) {
  const daysElapsed = Math.max(0, Math.floor((Date.now() - new Date(exp.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, exp.durationDays - daysElapsed);
  const progress = Math.min(100, Math.round((daysElapsed / exp.durationDays) * 100));
  const compliantDays = exp.logs.filter(l => l.compliant === true).length;
  const loggedDays = exp.logs.filter(l => l.compliant != null).length;
  const complianceRate = loggedDays > 0 ? Math.round((compliantDays / loggedDays) * 100) : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Beaker className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-medium text-white">{exp.title}</h3>
          </div>
          <StatusBadge status={exp.status} />
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">{exp.targetBehavior}</p>

      {exp.status === 'active' && (
        <>
          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Day {daysElapsed} of {exp.durationDays}</span>
              <span>{daysRemaining} days left</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Compliance */}
          {loggedDays > 0 && (
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="text-gray-400">Compliance</span>
              <span className={`font-medium ${complianceRate >= 70 ? 'text-green-400' : complianceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {complianceRate}% ({compliantDays}/{loggedDays} days)
              </span>
            </div>
          )}

          {/* Day grid */}
          <div className="flex gap-1 flex-wrap mb-3">
            {Array.from({ length: exp.durationDays }, (_, i) => {
              const dayDate = new Date(exp.startDate);
              dayDate.setDate(dayDate.getDate() + i);
              const dateStr = dayDate.toISOString().split('T')[0];
              const log = exp.logs.find(l => l.date === dateStr);
              const isPast = dayDate < new Date();
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={i}
                  className={`w-6 h-6 rounded text-[9px] flex items-center justify-center ${
                    log?.compliant === true ? 'bg-green-500/30 text-green-300' :
                    log?.compliant === false ? 'bg-red-500/30 text-red-300' :
                    isToday ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-400' :
                    isPast ? 'bg-slate-700 text-gray-500' :
                    'bg-slate-700/50 text-gray-600'
                  }`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>

          {/* Baseline comparison */}
          {exp.baselineValue != null && (
            <div className="text-xs text-gray-500">
              Baseline {exp.measurementField.replace(/_/g, ' ')}: {exp.baselineValue}
            </div>
          )}

          {/* Complete button */}
          {daysElapsed >= exp.durationDays && (
            <button
              onClick={() => onComplete(exp.id)}
              className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-sm font-medium"
            >
              Complete Experiment
            </button>
          )}
        </>
      )}

      {/* Completed result */}
      {exp.status === 'completed' && exp.result && (
        <div className="space-y-3">
          <OutcomeBadge outcome={exp.result.outcome} confidence={exp.result.confidence} />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Baseline</div>
              <div className="text-lg font-bold text-white">{exp.result.baselineAvg}</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">During Test</div>
              <div className={`text-lg font-bold ${
                exp.result.outcome === 'improved' ? 'text-green-400' :
                exp.result.outcome === 'worsened' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {exp.result.experimentAvg}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Change</span>
            <span className={`font-medium ${
              exp.result.outcome === 'improved' ? 'text-green-400' :
              exp.result.outcome === 'worsened' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {exp.result.percentChange > 0 ? '+' : ''}{exp.result.percentChange}%
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">{exp.result.summary}</p>

          <div className="text-xs text-gray-500">
            Compliance: {exp.result.complianceRate}%
          </div>
        </div>
      )}
    </div>
  );
}

function ExperimentsContent() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchExperiments = () => {
    setLoading(true);
    fetch('/api/experiments')
      .then(r => r.json())
      .then(d => setExperiments(d.experiments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExperiments(); }, []);

  const handleComplete = async (id: string) => {
    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', experimentId: id }),
    });
    if (res.ok) fetchExperiments();
  };

  const handleQuickCreate = async (preset: any) => {
    setCreating(true);
    await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
    });
    setCreating(false);
    fetchExperiments();
  };

  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">Loading experiments...</div>;

  const active = experiments.filter(e => e.status === 'active');
  const completed = experiments.filter(e => e.status === 'completed');

  const presets = [
    {
      title: 'Reduce late carbs',
      hypothesis: 'Eating fewer carbs after 8pm may improve sleep quality',
      targetBehavior: 'Keep carbs under 30g after 8pm',
      measurementField: 'sleep_score',
      expectedDirection: 'increase',
      durationDays: 7,
    },
    {
      title: 'No caffeine after 2pm',
      hypothesis: 'Eliminating afternoon caffeine may improve sleep',
      targetBehavior: 'No coffee, tea, or energy drinks after 2pm',
      measurementField: 'sleep_score',
      expectedDirection: 'increase',
      durationDays: 7,
    },
    {
      title: 'High protein week',
      hypothesis: 'Higher protein intake may improve recovery',
      targetBehavior: 'Hit 120g+ protein daily',
      measurementField: 'recovery_score',
      expectedDirection: 'increase',
      durationDays: 7,
    },
    {
      title: 'No alcohol week',
      hypothesis: 'Eliminating alcohol may improve HRV and recovery',
      targetBehavior: 'Zero alcohol for 7 days',
      measurementField: 'hrv',
      expectedDirection: 'increase',
      durationDays: 7,
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Experiments</h1>
      <p className="text-sm text-gray-400">Test how diet changes affect your body. Each experiment tracks a specific behavior change and measures the outcome.</p>

      {/* Active Experiments */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Active ({active.length})</h2>
          <div className="space-y-3">
            {active.map(exp => <ExperimentCard key={exp.id} exp={exp} onComplete={handleComplete} />)}
          </div>
        </div>
      )}

      {/* Start New Experiment */}
      {active.length === 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Start an Experiment</h2>
          <div className="space-y-2">
            {presets.map((preset, i) => (
              <button
                key={i}
                onClick={() => handleQuickCreate(preset)}
                disabled={creating}
                className="w-full text-left bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{preset.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{preset.targetBehavior}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{preset.durationDays} days · Measures: {preset.measurementField.replace(/_/g, ' ')}</div>
                  </div>
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed Experiments */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Past Results ({completed.length})</h2>
          <div className="space-y-3">
            {completed.map(exp => <ExperimentCard key={exp.id} exp={exp} onComplete={handleComplete} />)}
          </div>
        </div>
      )}

      {experiments.length === 0 && (
        <div className="text-center py-10">
          <Beaker className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No experiments yet. Start one above to test how diet changes affect your body.</p>
        </div>
      )}
    </div>
  );
}

export default function ExperimentsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><p className="text-gray-400">Please <Link href="/login" className="text-blue-400">log in</Link>.</p></div>;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-slate-900">
        <ExperimentsContent />
      </div>
    </ClientOnly>
  );
}
