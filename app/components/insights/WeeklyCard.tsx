'use client';

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface WeeklyData {
  weekOf: string;
  daysLogged: number;
  totalMeals: number;
  avgCaloriesDelta: number | null;
  avgProteinDelta: number | null;
  avgSleepDelta: number | null;
  avgRecoveryDelta: number | null;
  wins: Array<{ label: string; detail: string }>;
  risks: Array<{ label: string; detail: string; severity: string }>;
  unresolvedCount: number;
  resolvedCount: number;
  improvingCount: number;
  focusRecommendation: string | null;
  narrative?: string;
}

function Delta({ label, value, unit, inverted }: { label: string; value: number | null; unit?: string; inverted?: boolean }) {
  if (value == null || Math.abs(value) < 0.5) return null;
  const isGood = inverted ? value < 0 : value > 0;
  return (
    <div className="flex items-center gap-1.5">
      {isGood ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
      <span className={`text-[11px] font-medium ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
        {value > 0 ? '+' : ''}{Math.round(value)}{unit || ''}
      </span>
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

export default function WeeklyCard({ data }: { data: WeeklyData }) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">Weekly Review</span>
        </div>
        <span className="text-[10px] text-slate-400">{data.daysLogged}d logged &middot; {data.totalMeals} meals</span>
      </div>

      {/* Narrative */}
      {data.narrative && (
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{data.narrative}</p>
      )}

      {/* Deltas row */}
      <div className="flex flex-wrap gap-3 mb-2">
        <Delta label="cal/day" value={data.avgCaloriesDelta} />
        <Delta label="protein" value={data.avgProteinDelta} unit="g" />
        <Delta label="sleep" value={data.avgSleepDelta} unit="%" />
        <Delta label="recovery" value={data.avgRecoveryDelta} unit="%" />
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {data.wins.length > 0 && (
          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {data.wins.length} win{data.wins.length !== 1 ? 's' : ''}
          </span>
        )}
        {data.resolvedCount > 0 && (
          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
            {data.resolvedCount} resolved
          </span>
        )}
        {data.improvingCount > 0 && (
          <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            {data.improvingCount} improving
          </span>
        )}
        {data.unresolvedCount > 0 && (
          <span className="text-[10px] font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {data.unresolvedCount} unresolved
          </span>
        )}
      </div>

      {/* Focus recommendation */}
      {data.focusRecommendation && (
        <div className="mt-3 pt-2.5 border-t border-indigo-100">
          <p className="text-[11px] text-indigo-700 font-medium">{data.focusRecommendation}</p>
        </div>
      )}
    </div>
  );
}
