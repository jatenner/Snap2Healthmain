'use client';

import Link from 'next/link';
import { Camera, MessageSquare, Zap, TrendingUp, TrendingDown, ChevronRight, Moon, Heart, Activity, Flame, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from './components/client/ClientAuthProvider';
import ClientOnly from './components/ClientOnly';
import { useEffect, useState } from 'react';

const TARGETS = { calories: 2200, protein: 120, carbs: 250, fat: 65 };

interface NarrativeInsight {
  headline: string;
  body: string;
  action: string;
  status: 'good' | 'mixed' | 'poor' | 'insufficient_data';
}

function parseNarrative(raw: string | undefined): NarrativeInsight | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.headline) return parsed as NarrativeInsight;
  } catch {
    // Legacy plain-text narrative — wrap it
    if (raw.length > 10) return { headline: raw.slice(0, 100), body: raw, action: '', status: 'mixed' };
  }
  return null;
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'good' ? 'bg-green-400' : status === 'poor' ? 'bg-red-400' : status === 'mixed' ? 'bg-amber-400' : 'bg-gray-300';
  return <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />;
}

function BiometricCard({ icon: Icon, label, value, unit, deviation, inverted, color }: {
  icon: any; label: string; value: number | null; unit: string; deviation: number | null; inverted?: boolean; color: string;
}) {
  if (value == null) return null;
  const devGood = deviation != null ? (inverted ? deviation < 0 : deviation > 0) : null;
  const bg = devGood === true ? 'bg-green-50 border-green-200' : devGood === false ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200';
  return (
    <div className={`flex-1 border rounded-xl p-3 text-center ${bg}`}>
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className="text-xl font-bold text-gray-900">{Number.isInteger(value) ? value : value.toFixed(1)}<span className="text-xs text-gray-400 font-normal">{unit}</span></div>
      <div className="text-[10px] text-gray-400">{label}</div>
      {deviation != null && Math.abs(deviation) >= 1 && (
        <div className={`flex items-center justify-center gap-0.5 mt-1 ${devGood ? 'text-green-600' : 'text-red-500'}`}>
          {devGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="text-[10px] font-medium">{deviation > 0 ? '+' : ''}{Math.round(deviation)}%</span>
        </div>
      )}
    </div>
  );
}

function AuthenticatedHome() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
    fetch('/api/today', { headers: tz ? { 'x-timezone': tz } : {} })
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 animate-pulse">Loading...</div></div>;

  if (!data) return (
    <div className="max-w-md mx-auto px-5 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Snap2Health</h1>
      <p className="text-gray-500 mb-8">Upload your first meal to get started.</p>
      <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700">
        <Camera className="w-5 h-5" /> Upload a Meal
      </Link>
    </div>
  );

  const nut = data.nutrition;
  const bio = data.biometric;
  const insight = parseNarrative(data.narrative);

  const statusColor = insight?.status === 'good' ? 'border-green-300 bg-green-50' :
    insight?.status === 'poor' ? 'border-red-300 bg-red-50' :
    insight?.status === 'mixed' ? 'border-amber-300 bg-amber-50' :
    'border-gray-200 bg-white';

  const statusIcon = insight?.status === 'good' ? CheckCircle :
    insight?.status === 'poor' ? AlertTriangle :
    insight?.status === 'mixed' ? AlertTriangle : null;

  const StatusIcon = statusIcon;

  return (
    <div className="max-w-md mx-auto px-5 py-6 space-y-4">

      {/* Greeting + Upload */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{data.greeting}</h1>
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5">
          <Camera className="w-4 h-4" /> Log Meal
        </Link>
      </div>

      {/* ====== HEALTH BRIEFING — headline / body / action ====== */}
      {insight && insight.status !== 'insufficient_data' && (
        <div className={`border rounded-2xl p-4 ${statusColor}`}>
          <div className="flex items-start gap-2.5 mb-2">
            {StatusIcon && <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              insight.status === 'good' ? 'text-green-600' : insight.status === 'poor' ? 'text-red-500' : 'text-amber-500'
            }`} />}
            <h2 className="text-sm font-semibold text-gray-900 leading-snug">{insight.headline}</h2>
          </div>
          {insight.body && (
            <p className="text-xs text-gray-600 leading-relaxed mb-3 ml-7">{insight.body}</p>
          )}
          {insight.action && (
            <div className="flex items-start gap-2 ml-7 bg-white/60 rounded-lg p-2.5">
              <ArrowRight className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-800 font-medium">{insight.action}</p>
            </div>
          )}
        </div>
      )}

      {/* ====== WHOOP BIOMETRICS ====== */}
      {bio && (
        <div className="flex gap-2">
          <BiometricCard icon={Heart} label="Recovery" value={bio.recoveryScore} unit="%" deviation={bio.recoveryDeviation} color="text-green-500" />
          <BiometricCard icon={Moon} label="Sleep" value={bio.sleepScore} unit="%" deviation={bio.sleepDeviation} color="text-blue-500" />
          <BiometricCard icon={Activity} label="HRV" value={bio.hrv} unit="ms" deviation={bio.hrvDeviation} color="text-purple-500" />
          <BiometricCard icon={Flame} label="Strain" value={bio.strain} unit="" deviation={null} color="text-orange-500" />
        </div>
      )}

      {/* ====== TODAY'S NUTRITION — compact ====== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Today</h2>
          <span className="text-xs text-gray-400">{nut.mealCount} meal{nut.mealCount !== 1 ? 's' : ''} &middot; {nut.totalCalories} cal</span>
        </div>
        <div className="space-y-2">
          {([
            { label: 'Protein', value: nut.totalProtein, target: TARGETS.protein, color: 'bg-blue-500' },
            { label: 'Carbs', value: nut.totalCarbs, target: TARGETS.carbs, color: 'bg-yellow-500' },
            { label: 'Fat', value: nut.totalFat, target: TARGETS.fat, color: 'bg-orange-400' },
          ] as const).map(m => {
            const pct = Math.min(100, (m.value / m.target) * 100);
            const isLow = pct < 40;
            return (
              <div key={m.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14">{m.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${m.color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-xs w-20 text-right ${isLow ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                  {m.value}g / {m.target}g
                </span>
              </div>
            );
          })}
        </div>

        {/* Nutrient gaps */}
        {nut.nutrientGaps?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-gray-100">
            <span className="text-[10px] text-amber-600 font-medium">Low:</span>
            {nut.nutrientGaps.map((g: any) => (
              <span key={g.name} className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{g.name} {g.pct}%</span>
            ))}
          </div>
        )}
      </div>

      {/* ====== DATA PROGRESS (early days) ====== */}
      {(!insight || insight.status === 'insufficient_data') && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Building your health profile</p>
              <p className="text-[11px] text-gray-400">
                {data.dataStatus.pairedDays} of {data.dataStatus.neededForInsights} days collected
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (data.dataStatus.pairedDays / data.dataStatus.neededForInsights) * 100)}%` }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Log meals daily + keep WHOOP synced to unlock diet → biometric insights.</p>
        </div>
      )}

      {/* ====== TODAY'S MEALS ====== */}
      {nut.mealCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">Meals</span>
            <Link href="/meal-history" className="text-xs text-blue-600 font-medium flex items-center gap-0.5">All <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-1.5">
            {data.meals.slice(0, 5).map((meal: any) => (
              <Link key={meal.id} href={`/meal/${meal.id}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-900 font-medium truncate max-w-[200px]">{meal.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {meal.calories} cal &middot; {new Date(meal.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ====== QUICK ACTIONS ====== */}
      <div className="flex gap-2">
        <Link href="/upload" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-center text-sm font-medium flex items-center justify-center gap-1.5">
          <Camera className="w-4 h-4" /> Photo
        </Link>
        <Link href="/upload?mode=text" className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-3 text-center text-sm font-medium flex items-center justify-center gap-1.5">
          <MessageSquare className="w-4 h-4" /> Describe
        </Link>
        <Link href="/upload?mode=quick" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-3 px-4 text-sm font-medium flex items-center justify-center">
          <Zap className="w-4 h-4" />
        </Link>
      </div>

      {/* Nav footer */}
      <div className="flex gap-2 text-xs pb-4">
        <Link href="/trends" className="flex-1 text-center text-gray-400 hover:text-blue-600 py-2">Trends</Link>
        <Link href="/body" className="flex-1 text-center text-gray-400 hover:text-blue-600 py-2">Body</Link>
        <Link href="/insights" className="flex-1 text-center text-gray-400 hover:text-blue-600 py-2">Insights</Link>
        <Link href="/chat" className="flex-1 text-center text-gray-400 hover:text-blue-600 py-2">Chat</Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 animate-pulse">Loading...</div></div>;

  if (!isAuthenticated || !user) {
    return (
      <ClientOnly>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Snap2Health</h1>
            <p className="text-gray-500 mb-2 text-lg">See how your diet affects your body.</p>
            <p className="text-gray-400 mb-8">Log meals. Connect WHOOP. Get answers.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium">Log In</Link>
              <Link href="/signup" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-xl font-medium">Sign Up</Link>
            </div>
          </div>
        </div>
      </ClientOnly>
    );
  }

  return <ClientOnly><AuthenticatedHome /></ClientOnly>;
}
