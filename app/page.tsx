'use client';

import Link from 'next/link';
import { Camera, MessageSquare, Zap, TrendingUp, TrendingDown, ChevronRight, Sparkles, Moon, Heart, Activity, Flame } from 'lucide-react';
import { useAuth } from './components/client/ClientAuthProvider';
import ClientOnly from './components/ClientOnly';
import { useEffect, useState } from 'react';

interface HomeData {
  greeting: string;
  narrative?: string;
  biometric?: {
    sleepScore: number | null;
    recoveryScore: number | null;
    hrv: number | null;
    strain: number | null;
    sleepDeviation: number | null;
    recoveryDeviation: number | null;
    hrvDeviation: number | null;
    dayQuality: string | null;
    trajectory: string | null;
  };
  nutrition: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    mealCount: number;
    nutrientAdequacy: number | null;
    nutrientGaps: Array<{ name: string; pct: number }>;
  };
  meals: Array<{ id: string; name: string; calories: number; time: string; hasImage: boolean }>;
  recommendation?: { text: string };
  dataStatus: {
    hasBiometrics: boolean;
    hasNutritionToday: boolean;
    pairedDays: number;
    neededForInsights: number;
  };
}

// Daily targets (Attia-informed for active adult)
const TARGETS = { calories: 2200, protein: 120, carbs: 250, fat: 65, fiber: 30 };

function ProgressBar({ value, target, color, warn }: { value: number; target: number; color: string; warn?: boolean }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function BiometricBadge({ icon: Icon, label, value, unit, deviation, inverted }: {
  icon: any; label: string; value: number | null; unit: string; deviation: number | null; inverted?: boolean;
}) {
  if (value == null) return null;
  const devGood = deviation != null ? (inverted ? deviation < 0 : deviation > 0) : null;
  return (
    <div className="flex-1 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] text-gray-400 uppercase">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-900">{typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}{unit}</div>
      {deviation != null && Math.abs(deviation) >= 1 && (
        <div className={`flex items-center justify-center gap-0.5 mt-0.5 ${devGood ? 'text-green-500' : 'text-red-500'}`}>
          {devGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="text-[10px] font-medium">{deviation > 0 ? '+' : ''}{Math.round(deviation)}%</span>
        </div>
      )}
    </div>
  );
}

function AuthenticatedHome() {
  const [data, setData] = useState<HomeData | null>(null);
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

  return (
    <div className="max-w-md mx-auto px-5 py-6 space-y-4">

      {/* Greeting + Upload */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{data.greeting}</h1>
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5">
          <Camera className="w-4 h-4" /> Log Meal
        </Link>
      </div>

      {/* ====== TODAY'S NUTRITION ====== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Today&apos;s Nutrition</h2>
          <span className="text-[10px] text-gray-400">{nut.mealCount} meal{nut.mealCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Calorie ring */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#3b82f6" strokeWidth="3"
                strokeDasharray={`${Math.min(100, (nut.totalCalories / TARGETS.calories) * 100)}, 100`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{nut.totalCalories}</span>
              <span className="text-[9px] text-gray-400">/ {TARGETS.calories}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {([
              { label: 'Protein', value: nut.totalProtein, target: TARGETS.protein, color: 'bg-blue-500' },
              { label: 'Carbs', value: nut.totalCarbs, target: TARGETS.carbs, color: 'bg-yellow-500' },
              { label: 'Fat', value: nut.totalFat, target: TARGETS.fat, color: 'bg-orange-500' },
            ] as const).map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-gray-500">{m.label}</span>
                  <span className="font-medium text-gray-700">{m.value}g <span className="text-gray-400">/ {m.target}g</span></span>
                </div>
                <ProgressBar value={m.value} target={m.target} color={m.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Nutrient gaps */}
        {nut.nutrientGaps.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <span className="text-[10px] text-amber-600 font-medium uppercase">Low today</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {nut.nutrientGaps.map(g => (
                <span key={g.name} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                  {g.name} ({g.pct}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====== WHOOP BIOMETRICS ====== */}
      {bio && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Body Status</h2>
            {bio.trajectory && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                bio.trajectory === 'improving' ? 'bg-green-50 text-green-700' :
                bio.trajectory === 'declining' ? 'bg-red-50 text-red-700' :
                'bg-gray-50 text-gray-500'
              }`}>{bio.trajectory}</span>
            )}
          </div>
          <div className="flex">
            <BiometricBadge icon={Heart} label="Recovery" value={bio.recoveryScore} unit="%" deviation={bio.recoveryDeviation} />
            <BiometricBadge icon={Moon} label="Sleep" value={bio.sleepScore} unit="%" deviation={bio.sleepDeviation} />
            <BiometricBadge icon={Activity} label="HRV" value={bio.hrv} unit="ms" deviation={bio.hrvDeviation} />
            <BiometricBadge icon={Flame} label="Strain" value={bio.strain} unit="" deviation={null} />
          </div>
        </div>
      )}

      {/* ====== INSIGHT (compact) ====== */}
      {data.narrative && (
        <Link href="/insights" className="block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{data.narrative}</p>
              <span className="text-xs text-blue-600 font-medium mt-1 inline-block">View insights &rarr;</span>
            </div>
          </div>
        </Link>
      )}

      {/* ====== RECOMMENDATION (1-liner) ====== */}
      {data.recommendation && !data.narrative && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-800">{data.recommendation.text}</p>
        </div>
      )}

      {/* ====== PROGRESS BAR for data collection ====== */}
      {!data.narrative && data.dataStatus.pairedDays < data.dataStatus.neededForInsights && (
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Collecting data for insights</span>
            <span className="text-gray-700 font-medium">{data.dataStatus.pairedDays}/{data.dataStatus.neededForInsights} days</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (data.dataStatus.pairedDays / data.dataStatus.neededForInsights) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* ====== TODAY'S MEALS ====== */}
      {nut.mealCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">Meals</span>
            <Link href="/meal-history" className="text-xs text-blue-600 font-medium flex items-center gap-0.5">History <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-1.5">
            {data.meals.slice(0, 5).map(meal => (
              <Link key={meal.id} href={`/meal/${meal.id}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{meal.hasImage ? '📸' : '📝'}</span>
                  <span className="text-sm text-gray-900 font-medium truncate max-w-[180px]">{meal.name}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {meal.calories} cal &middot; {new Date(meal.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ====== QUICK ACTIONS ====== */}
      <div className="flex gap-2 pt-1">
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

      {/* Navigation links */}
      <div className="flex gap-2 text-xs">
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
            <p className="text-gray-500 mb-2 text-lg">Upload meals. Connect biomarkers. Ask questions.</p>
            <p className="text-gray-400 mb-8">See how your diet affects your body over time.</p>
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
