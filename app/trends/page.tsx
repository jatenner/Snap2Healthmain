'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../components/client/ClientAuthProvider';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ChevronRight, Beaker, BarChart3, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface CorrelationInsight {
  pairId: string;
  pairName: string;
  category: string;
  highGroup: { avg: number; n: number };
  lowGroup: { avg: number; n: number };
  difference: number;
  percentDifference: number;
  direction: string;
  confidence: string;
  confidenceScore: number;
  displaySentence: string;
  confounderControlled: boolean;
  confounderWarning?: string;
}

const RANGE_OPTIONS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles = {
    high: 'bg-green-500/20 text-green-300',
    medium: 'bg-yellow-500/20 text-yellow-300',
    low: 'bg-gray-500/20 text-gray-400',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${(styles as any)[confidence] || styles.low}`}>
      {confidence}
    </span>
  );
}

function ComparisonBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CorrelationCard({ insight }: { insight: CorrelationInsight }) {
  const maxVal = Math.max(insight.highGroup.avg, insight.lowGroup.avg);
  const absDiff = Math.abs(insight.difference).toFixed(1);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">{insight.pairName}</span>
        <ConfidenceBadge confidence={insight.confidence} />
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-gray-400">{insight.pairName.split(' vs ')[0]}</span>
            <span className="text-white font-medium">{insight.highGroup.avg.toFixed(1)}</span>
          </div>
          <ComparisonBar value={insight.highGroup.avg} max={maxVal * 1.1} color="bg-blue-500" />
          <div className="text-[10px] text-gray-500 mt-0.5">n={insight.highGroup.n} days</div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-gray-400">Without</span>
            <span className="text-white font-medium">{insight.lowGroup.avg.toFixed(1)}</span>
          </div>
          <ComparisonBar value={insight.lowGroup.avg} max={maxVal * 1.1} color="bg-slate-500" />
          <div className="text-[10px] text-gray-500 mt-0.5">n={insight.lowGroup.n} days</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-xs text-gray-300 leading-relaxed">{insight.displaySentence}</p>
        {insight.confounderWarning && (
          <p className="text-[10px] text-yellow-400 mt-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> {insight.confounderWarning}
          </p>
        )}
      </div>
    </div>
  );
}

function TrendsContent() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trends?days=${range}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 animate-pulse">Loading trends...</div>;
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400">Unable to load trends.</div>;
  }

  const { biometrics, nutrition, correlations } = data;

  // Prepare chart data
  const chartData = biometrics.map((b: any) => {
    const nutDay = nutrition.find((n: any) => n.summary_date === b.summary_date);
    return {
      date: b.summary_date.substring(5), // MM-DD
      sleep: b.sleep_score,
      recovery: b.recovery_score,
      hrv: b.hrv ? Math.round(b.hrv * 10) / 10 : null,
      rhr: b.resting_heart_rate,
      protein: nutDay?.total_protein || null,
      calories: nutDay?.total_calories || null,
      fiber: nutDay?.total_fiber || null,
    };
  });

  const hasCorrelations = correlations.length > 0;
  const hasNutrition = nutrition.length > 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header + Range */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Trends</h1>
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setRange(opt.days)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                range === opt.days ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====== KEY INSIGHTS (top) ====== */}
      {hasCorrelations && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Patterns Found ({correlations.length})</h2>
          <div className="space-y-3">
            {correlations.slice(0, 3).map((c: CorrelationInsight) => (
              <CorrelationCard key={c.pairId} insight={c} />
            ))}
          </div>
        </div>
      )}

      {!hasCorrelations && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-500" />
          <p className="text-sm text-gray-400">No patterns detected yet.</p>
          <p className="text-xs text-gray-500 mt-1">Log meals consistently for 2+ weeks to unlock diet-biometric insights.</p>
        </div>
      )}

      {/* ====== BODY TRENDS ====== */}
      {biometrics.length > 5 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Body Trends</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <div className="flex gap-4 mb-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Sleep</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Recovery</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="sleep" stroke="#60a5fa" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="recovery" stroke="#4ade80" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ====== HRV + RHR TREND ====== */}
      {biometrics.length > 5 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <div className="flex gap-4 mb-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> HRV</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> RHR</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="hrv" stroke="#c084fc" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="rhr" stroke="#f87171" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ====== NUTRITION TRENDS ====== */}
      {hasNutrition && nutrition.length > 3 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Nutrition Trends</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <div className="flex gap-4 mb-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Protein (g)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Fiber (g)</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData.filter((d: any) => d.protein != null)}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="protein" stroke="#60a5fa" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="fiber" stroke="#facc15" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ====== QUICK PATTERNS ====== */}
      {hasNutrition && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Diet Patterns</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
            {(() => {
              const lateNights = nutrition.filter((n: any) => n.has_late_night_meal).length;
              const totalDays = nutrition.length;
              const lowProtein = nutrition.filter((n: any) => n.total_protein < 60).length;
              const highSugar = nutrition.filter((n: any) => n.total_sugar > 50).length;
              const patterns: Array<{ label: string; value: string; color: string }> = [];

              if (lateNights > 0) patterns.push({ label: 'Late-night meals', value: `${lateNights}/${totalDays} days`, color: lateNights > totalDays / 2 ? 'text-red-400' : 'text-yellow-400' });
              if (lowProtein > 0) patterns.push({ label: 'Low protein days (<60g)', value: `${lowProtein}/${totalDays} days`, color: lowProtein > totalDays / 2 ? 'text-red-400' : 'text-yellow-400' });
              if (highSugar > 0) patterns.push({ label: 'High sugar days (>50g)', value: `${highSugar}/${totalDays} days`, color: highSugar > totalDays / 2 ? 'text-red-400' : 'text-yellow-400' });

              if (patterns.length === 0) {
                return <p className="text-xs text-gray-400">Not enough data to show patterns yet.</p>;
              }

              return patterns.map((p, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">{p.label}</span>
                  <span className={`text-xs font-medium ${p.color}`}>{p.value}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrendsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><p className="text-gray-400">Please <Link href="/login" className="text-blue-400">log in</Link> to view trends.</p></div>;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-slate-900">
        <TrendsContent />
      </div>
    </ClientOnly>
  );
}
