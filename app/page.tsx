'use client';

import Link from 'next/link';
import { Camera, MessageSquare, Moon, Heart, Activity, Flame, ChevronRight, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from './components/client/ClientAuthProvider';
import ClientOnly from './components/ClientOnly';
import { useEffect, useState } from 'react';

interface TodayData {
  greeting: string;
  goal: string;
  biometric: {
    sleepScore: number | null;
    recoveryScore: number | null;
    hrv: number | null;
    strain: number | null;
    sleepDeviation: number | null;
    recoveryDeviation: number | null;
    hrvDeviation: number | null;
    dayQuality: string | null;
    trajectory: string | null;
  } | null;
  nutrition: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    mealCount: number;
    nutrientAdequacy: number | null;
    nutrientGaps: Array<{ name: string; pct: number }>;
  };
  heroInsight: {
    title: string;
    sentence: string;
    confidence: string;
    direction: string;
    category: string;
    primaryDrivers?: string[];
    supportingSignals?: string[];
    recommendedAction?: string;
  } | null;
  recommendation: string | null;
  meals: Array<{ id: string; name: string; calories: number; time: string; tags: string[]; hasImage: boolean }>;
  experiment: { id: string; title: string; targetBehavior: string; durationDays: number; startDate: string; endDate: string } | null;
}

function MetricCard({ icon: Icon, label, value, unit, color, bgColor, deviation }: {
  icon: any; label: string; value: number | null; unit?: string; color: string; bgColor: string; deviation?: number | null;
}) {
  const display = value != null ? (Number.isInteger(value) ? String(value) : value.toFixed(1)) : '—';
  return (
    <div className={`${bgColor} rounded-2xl p-4 flex-1`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {deviation != null && Math.abs(deviation) > 3 && (
          deviation > 0
            ? <TrendingUp className="w-3 h-3 text-green-500 ml-auto" />
            : <TrendingDown className="w-3 h-3 text-red-500 ml-auto" />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold`} style={{ color }}>{display}</span>
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

function AuthenticatedHome({ userId }: { userId: string }) {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/today')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
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

  const bio = data.biometric;
  const nut = data.nutrition;
  const expDaysElapsed = data.experiment ? Math.max(0, Math.floor((Date.now() - new Date(data.experiment.startDate).getTime()) / 86400000)) : 0;

  return (
    <div className="max-w-md mx-auto px-5 py-6 space-y-5">

      {/* ====== HERO INSIGHT (the brain — biggest, first, colored) ====== */}
      {data.heroInsight ? (
        <div className={`rounded-2xl p-5 ${
          data.heroInsight.direction === 'worse'
            ? 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {data.heroInsight.direction === 'worse'
                ? <AlertTriangle className="w-4 h-4 text-red-500" />
                : <CheckCircle className="w-4 h-4 text-blue-500" />
              }
              <span className={`text-xs font-semibold uppercase tracking-wide ${
                data.heroInsight.direction === 'worse' ? 'text-red-600' : 'text-blue-600'
              }`}>{data.heroInsight.category}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              data.heroInsight.confidence === 'high' ? 'bg-green-100 text-green-700' :
              data.heroInsight.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>{data.heroInsight.confidence} confidence</span>
          </div>

          <p className={`font-semibold text-base leading-snug ${
            data.heroInsight.direction === 'worse' ? 'text-red-900' : 'text-blue-900'
          }`}>{data.heroInsight.title}</p>

          {/* Contributors */}
          {data.heroInsight.primaryDrivers && data.heroInsight.primaryDrivers.length > 0 && (
            <div className="mt-3 space-y-1">
              {data.heroInsight.primaryDrivers.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-400' : 'bg-orange-400'}`} />
                  <span className="text-sm text-gray-700">{d}</span>
                </div>
              ))}
              {data.heroInsight.supportingSignals?.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-500">{s}</span>
                </div>
              ))}
            </div>
          )}

          {data.heroInsight.recommendedAction && (
            <div className="mt-3 pt-3 border-t border-black/5">
              <p className="text-sm font-medium text-gray-800">{data.heroInsight.recommendedAction}</p>
            </div>
          )}
        </div>
      ) : bio ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-700 uppercase">All Good</span>
          </div>
          <p className="text-green-900 font-medium">Your body is in good shape today.</p>
          <p className="text-sm text-green-700 mt-1">Keep logging meals to build your personal pattern library.</p>
        </div>
      ) : null}

      {/* ====== BODY METRICS (colored cards) ====== */}
      {bio && (
        <Link href="/body" className="flex gap-3">
          <MetricCard icon={Moon} label="Sleep" value={bio.sleepScore} unit="%" color="#3b82f6" bgColor="bg-blue-50" deviation={bio.sleepDeviation} />
          <MetricCard icon={Heart} label="Recovery" value={bio.recoveryScore} unit="%" color="#22c55e" bgColor="bg-green-50" deviation={bio.recoveryDeviation} />
          <MetricCard icon={Activity} label="HRV" value={bio.hrv} unit="ms" color="#8b5cf6" bgColor="bg-purple-50" deviation={bio.hrvDeviation} />
        </Link>
      )}

      {/* ====== TODAY'S TIP / RECOMMENDATION ====== */}
      {data.recommendation && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Today&apos;s Tip</span>
          <p className="text-sm text-gray-800 mt-1 leading-relaxed">{data.recommendation}</p>
        </div>
      )}

      {/* ====== ACTIVE EXPERIMENT (inline, not separate page) ====== */}
      {data.experiment && (
        <Link href="/experiments" className="block bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Active Experiment</span>
            <span className="text-xs text-gray-400">{expDaysElapsed} of {data.experiment.durationDays} days</span>
          </div>
          <p className="text-sm font-medium text-gray-900">{data.experiment.title}</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (expDaysElapsed / data.experiment.durationDays) * 100)}%` }} />
          </div>
        </Link>
      )}

      {/* ====== MEAL TIMELINE ====== */}
      {nut.mealCount > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">Today&apos;s Meals</span>
            <span className="text-xs text-gray-400">{nut.totalCalories} cal total</span>
          </div>
          <div className="space-y-2">
            {data.meals.map(meal => (
              <Link key={meal.id} href={`/meal/${meal.id}`} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                  {meal.hasImage ? '🍽' : '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{meal.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{new Date(meal.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    <span>{meal.calories} cal</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {meal.tags.slice(0, 2).map(tag => (
                    <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      tag.includes('sleep') || tag.includes('caffeine') || tag.includes('alcohol')
                        ? 'bg-red-100 text-red-600'
                        : tag.includes('protein') || tag.includes('recovery')
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>{tag.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-gray-500 text-sm">No meals logged today</p>
          <p className="text-gray-400 text-xs mt-1">Upload a photo or describe what you ate</p>
        </div>
      )}

      {/* ====== UPLOAD BUTTONS ====== */}
      <div className="flex gap-3">
        <Link href="/upload" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
          <Camera className="w-4 h-4" /> Take Photo
        </Link>
        <Link href="/upload?mode=text" className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-3.5 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
          <MessageSquare className="w-4 h-4" /> Describe It
        </Link>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Snap2Health</h1>
            <p className="text-gray-500 mb-8 text-lg">Track what you eat. See how your body responds. Improve.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium">Log In</Link>
              <Link href="/signup" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-xl font-medium">Sign Up</Link>
            </div>
          </div>
        </div>
      </ClientOnly>
    );
  }

  return <ClientOnly><AuthenticatedHome userId={user.id} /></ClientOnly>;
}
