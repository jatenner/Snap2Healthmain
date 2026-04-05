'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../components/client/ClientAuthProvider';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';
import { Moon, Heart, Activity, Flame, Wind, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

function Spark({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data}>
        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Trend({ val, baseline, higher = true }: { val: number | null; baseline: number | null; higher?: boolean }) {
  if (val == null || baseline == null) return <Minus className="w-3 h-3 text-gray-300" />;
  const pct = ((val - baseline) / baseline) * 100;
  const good = higher ? pct > 3 : pct < -3;
  const bad = higher ? pct < -3 : pct > 3;
  if (good) return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
  if (bad) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-300" />;
}

function Metric({ icon: Icon, label, value, unit, avg7, baseline, color, bg, spark, sparkKey, higher = true }: {
  icon: any; label: string; value: number | null; unit?: string; avg7: number | null; baseline: number | null; color: string; bg: string; spark: any[]; sparkKey: string; higher?: boolean;
}) {
  const display = value != null ? (Number.isInteger(value) ? String(value) : value.toFixed(1)) : '—';
  return (
    <div className={`${bg} rounded-2xl p-4 border border-gray-100`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        </div>
        <Trend val={value} baseline={baseline} higher={higher} />
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-gray-900">{display}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      <div className="flex gap-3 text-[11px] text-gray-400 mb-2">
        {avg7 != null && <span>7d avg: <span className="text-gray-600">{avg7}</span></span>}
        {baseline != null && <span>30d: <span className="text-gray-600">{baseline}</span></span>}
      </div>
      {spark.length > 2 && <Spark data={spark} dataKey={sparkKey} color={color} />}
    </div>
  );
}

function BodyContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/body').then(r => r.json()).then(d => { if (!d.error) setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">Loading...</div>;

  if (!data?.today && !data?.yesterday) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No biometric data yet.</p>
        <p className="text-sm text-gray-400 mt-1">Connect WHOOP on your <Link href="/profile" className="text-blue-600 underline">Profile</Link> page.</p>
      </div>
    );
  }

  const t = data.today || data.yesterday || {};
  const wa = data.weekAvg || {};
  const bl = data.baseline || {};
  const spark = data.recentDays || [];
  const sleep = data.sleepDetail;

  return (
    <div className="max-w-md mx-auto px-5 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Body</h1>
        {data.trajectory && (
          <p className={`text-sm mt-0.5 ${data.trajectory === 'improving' ? 'text-green-600' : data.trajectory === 'declining' ? 'text-red-600' : 'text-gray-500'}`}>
            Trending {data.trajectory}
          </p>
        )}
      </div>

      {data.dataAgeDays > 0 && (
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl ${
          data.dataAgeDays <= 1 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
        }`}>
          <span>Data from {data.latestDate ? new Date(data.latestDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `${data.dataAgeDays}d ago`}</span>
          <span>·</span>
          <Link href="/profile" className="underline">Sync WHOOP</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={Moon} label="Sleep" value={t.sleep_score} unit="%" avg7={wa.sleepScore} baseline={bl.sleepScore} color="#3b82f6" bg="bg-blue-50" spark={spark} sparkKey="sleep_score" />
        <Metric icon={Heart} label="Recovery" value={t.recovery_score} unit="%" avg7={wa.recovery} baseline={bl.recovery} color="#22c55e" bg="bg-green-50" spark={spark} sparkKey="recovery_score" />
        <Metric icon={Activity} label="HRV" value={t.hrv} unit="ms" avg7={wa.hrv} baseline={bl.hrv} color="#8b5cf6" bg="bg-purple-50" spark={spark} sparkKey="hrv" />
        <Metric icon={Flame} label="Strain" value={t.strain} avg7={wa.strain} baseline={null} color="#f97316" bg="bg-orange-50" spark={spark} sparkKey="strain" higher={false} />
        <Metric icon={Wind} label="RHR" value={t.resting_heart_rate} unit="bpm" avg7={wa.rhr} baseline={bl.rhr} color="#ef4444" bg="bg-red-50" spark={spark} sparkKey="resting_heart_rate" higher={false} />
        <Metric icon={Wind} label="Respiratory" value={t.respiratory_rate} unit="/min" avg7={wa.respiratoryRate} baseline={null} color="#06b6d4" bg="bg-cyan-50" spark={spark} sparkKey="respiratory_rate" />
      </div>

      {/* Sleep breakdown */}
      {sleep && sleep.score_state === 'SCORED' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-blue-500" /> Last Night&apos;s Sleep
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Deep', val: sleep.total_slow_wave_sleep_minutes, color: 'text-blue-600' },
              { label: 'REM', val: sleep.total_rem_sleep_minutes, color: 'text-purple-600' },
              { label: 'Light', val: sleep.total_light_sleep_minutes, color: 'text-gray-500' },
            ].map(s => (
              <div key={s.label} className="text-center bg-gray-50 rounded-xl py-3">
                <div className={`text-xl font-bold ${s.color}`}>{s.val || 0}</div>
                <div className="text-[10px] text-gray-400 uppercase mt-0.5">{s.label} min</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Efficiency', val: sleep.sleep_efficiency_pct ? Math.round(sleep.sleep_efficiency_pct) + '%' : null },
              { label: 'Consistency', val: sleep.sleep_consistency_pct ? Math.round(sleep.sleep_consistency_pct) + '%' : null },
              { label: 'Time in bed', val: sleep.total_in_bed_minutes ? Math.floor(sleep.total_in_bed_minutes / 60) + 'h ' + (sleep.total_in_bed_minutes % 60) + 'm' : null },
              { label: 'Bedtime', val: sleep.start_time ? new Date(sleep.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null },
              { label: 'Wake', val: sleep.end_time ? new Date(sleep.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null },
            ].filter(r => r.val).map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-gray-500">{r.label}</span>
                <span className="text-gray-900 font-medium">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <Link href="/trends" className="text-sm text-blue-600 hover:underline">See how your diet affects these metrics →</Link>
      </div>
    </div>
  );
}

export default function BodyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Please <Link href="/login" className="text-blue-600">log in</Link>.</p></div>;
  return <ClientOnly><BodyContent /></ClientOnly>;
}
