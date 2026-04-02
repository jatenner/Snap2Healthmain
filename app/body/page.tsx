'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../components/client/ClientAuthProvider';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';
import { Moon, Heart, Activity, Flame, Wind, Thermometer, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

function TrendArrow({ val, baseline, higherBetter = true }: { val: number | null; baseline: number | null; higherBetter?: boolean }) {
  if (val == null || baseline == null) return <Minus className="w-3 h-3 text-gray-600" />;
  const diff = ((val - baseline) / baseline) * 100;
  const good = higherBetter ? diff > 3 : diff < -3;
  const bad = higherBetter ? diff < -3 : diff > 3;
  if (good) return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (bad) return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-gray-500" />;
}

function Sparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MetricCard({ icon: Icon, label, value, unit, weekAvg, baseline, color, higherBetter = true, sparkData, sparkKey }: {
  icon: any; label: string; value: number | null; unit?: string; weekAvg: number | null; baseline: number | null; color: string; higherBetter?: boolean; sparkData: any[]; sparkKey: string;
}) {
  const displayVal = value != null ? (Number.isInteger(value) ? value : value.toFixed(1)) : '—';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
        <TrendArrow val={value} baseline={baseline} higherBetter={higherBetter} />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{displayVal}</span>
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>

      <div className="flex gap-4 mt-1 text-[10px] text-gray-500">
        {weekAvg != null && <span>7d avg: {weekAvg}</span>}
        {baseline != null && <span>30d: {baseline}</span>}
      </div>

      {sparkData.length > 2 && (
        <div className="mt-2">
          <Sparkline data={sparkData} dataKey={sparkKey} color={color} />
        </div>
      )}
    </div>
  );
}

function BodyContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/body')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">Loading body data...</div>;

  if (!data?.today && !data?.yesterday) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <Heart className="w-10 h-10 mx-auto mb-3 text-gray-600" />
        <p className="text-gray-400">No biometric data yet.</p>
        <p className="text-xs text-gray-500 mt-1">Connect WHOOP on your <Link href="/profile" className="text-blue-400">Profile page</Link> and sync your data.</p>
      </div>
    );
  }

  const t = data.today || data.yesterday || {};
  const wa = data.weekAvg || {};
  const bl = data.baseline || {};
  const sparkData = data.recentDays || [];
  const sleep = data.sleepDetail;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Your Body</h1>
        {data.trajectory && (
          <p className={`text-sm mt-1 ${
            data.trajectory === 'improving' ? 'text-green-400' :
            data.trajectory === 'declining' ? 'text-red-400' : 'text-gray-400'
          }`}>
            Trending {data.trajectory} over the last week
          </p>
        )}
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={Moon} label="Sleep" value={t.sleep_score} unit="%" weekAvg={wa.sleepScore} baseline={bl.sleepScore} color="#60a5fa" sparkData={sparkData} sparkKey="sleep_score" />
        <MetricCard icon={Heart} label="Recovery" value={t.recovery_score} unit="%" weekAvg={wa.recovery} baseline={bl.recovery} color="#4ade80" sparkData={sparkData} sparkKey="recovery_score" />
        <MetricCard icon={Activity} label="HRV" value={t.hrv} unit="ms" weekAvg={wa.hrv} baseline={bl.hrv} color="#c084fc" sparkData={sparkData} sparkKey="hrv" />
        <MetricCard icon={Flame} label="Strain" value={t.strain} weekAvg={wa.strain} baseline={null} color="#fb923c" higherBetter={false} sparkData={sparkData} sparkKey="strain" />
        <MetricCard icon={Wind} label="Resting HR" value={t.resting_heart_rate} unit="bpm" weekAvg={wa.rhr} baseline={bl.rhr} color="#f87171" higherBetter={false} sparkData={sparkData} sparkKey="resting_heart_rate" />
        <MetricCard icon={Wind} label="Respiratory" value={t.respiratory_rate} unit="/min" weekAvg={wa.respiratoryRate} baseline={null} color="#38bdf8" sparkData={sparkData} sparkKey="respiratory_rate" />
      </div>

      {/* Sleep breakdown */}
      {sleep && sleep.score_state === 'SCORED' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-blue-400" /> Last Night&apos;s Sleep
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{sleep.total_slow_wave_sleep_minutes || 0}</div>
              <div className="text-[10px] text-gray-500">Deep (min)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{sleep.total_rem_sleep_minutes || 0}</div>
              <div className="text-[10px] text-gray-500">REM (min)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-400">{sleep.total_light_sleep_minutes || 0}</div>
              <div className="text-[10px] text-gray-500">Light (min)</div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Efficiency</span>
              <span className="text-white">{sleep.sleep_efficiency_pct ? Math.round(sleep.sleep_efficiency_pct) + '%' : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Consistency</span>
              <span className="text-white">{sleep.sleep_consistency_pct ? Math.round(sleep.sleep_consistency_pct) + '%' : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time in bed</span>
              <span className="text-white">{sleep.total_in_bed_minutes ? Math.floor(sleep.total_in_bed_minutes / 60) + 'h ' + (sleep.total_in_bed_minutes % 60) + 'm' : '—'}</span>
            </div>
            {sleep.start_time && (
              <div className="flex justify-between">
                <span className="text-gray-400">Bedtime</span>
                <span className="text-white">{new Date(sleep.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
            {sleep.end_time && (
              <div className="flex justify-between">
                <span className="text-gray-400">Wake time</span>
                <span className="text-white">{new Date(sleep.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recovery detail */}
      {t.recovery_score != null && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-green-400" /> Recovery Detail
          </h2>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Recovery Score</span>
              <span className={`font-medium ${t.recovery_score >= 67 ? 'text-green-400' : t.recovery_score >= 34 ? 'text-yellow-400' : 'text-red-400'}`}>{Math.round(t.recovery_score)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">HRV</span>
              <span className="text-white">{t.hrv?.toFixed(1) || '—'} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Resting HR</span>
              <span className="text-white">{t.resting_heart_rate || '—'} bpm</span>
            </div>
            {t.spo2 != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">SpO2</span>
                <span className="text-white">{t.spo2.toFixed(1)}%</span>
              </div>
            )}
            {t.skin_temp != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Skin Temp</span>
                <span className="text-white">{t.skin_temp.toFixed(1)}°C</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/trends" className="text-xs text-blue-400 hover:text-blue-300">See how your diet affects these metrics →</Link>
      </div>
    </div>
  );
}

export default function BodyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><p className="text-gray-400">Please <Link href="/login" className="text-blue-400">log in</Link>.</p></div>;
  return <ClientOnly><div className="min-h-screen bg-slate-900"><BodyContent /></div></ClientOnly>;
}
