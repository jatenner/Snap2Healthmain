'use client';

import Link from 'next/link';
import { Camera, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { useAuth } from './components/client/ClientAuthProvider';
import ClientOnly from './components/ClientOnly';
import WeeklyCard from './components/insights/WeeklyCard';
import { useEffect, useState } from 'react';

/**
 * Home Page — Lightweight dashboard.
 *
 * Shows: greeting, top insight, today's meals, quick actions.
 * Intelligence lives on /insights. Trends on /trends. History on /meal-history.
 */

interface HomeData {
  greeting: string;
  narrative?: string;
  insight?: {
    scores: Array<{ name: string; value: number; max: number; interpretation: string }>;
    recommendations: Array<{ id: string; action: string; priority?: number; recurrence?: string }>;
    confidence: { overall: number; sampleSize: number };
  };
  nutrition: {
    totalCalories: number;
    totalProtein: number;
    mealCount: number;
  };
  meals: Array<{ id: string; name: string; calories: number; time: string; tags: string[]; hasImage: boolean }>;
  dataStatus: {
    hasBiometrics: boolean;
    hasNutritionToday: boolean;
    pairedDays: number;
    neededForInsights: number;
  };
}

function AuthenticatedHome() {
  const [data, setData] = useState<HomeData | null>(null);
  const [weekly, setWeekly] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
    const headers: Record<string, string> = tz ? { 'x-timezone': tz } : {};
    // Fetch today and weekly in parallel
    Promise.all([
      fetch('/api/today', { headers }).then(r => r.json()).then(d => { if (!d.error) setData(d); }),
      fetch('/api/weekly', { headers }).then(r => r.json()).then(d => { if (!d.error && d.daysLogged > 0) setWeekly(d); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-slate-400 animate-pulse">Loading...</div></div>;

  if (!data) return (
    <div className="max-w-md mx-auto px-5 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Welcome to Snap2Health</h1>
      <p className="text-slate-500 mb-8">Upload your first meal to get started.</p>
      <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700">
        <Camera className="w-5 h-5" /> Upload a Meal
      </Link>
    </div>
  );

  const topRec = data.insight?.recommendations?.[0];
  const nut = data.nutrition;

  return (
    <div className="max-w-md mx-auto px-5 py-6 space-y-5">

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">{data.greeting}</h1>
        {nut.mealCount > 0 && (
          <p className="text-sm text-slate-500 mt-0.5">{nut.mealCount} meal{nut.mealCount !== 1 ? 's' : ''} logged &middot; {nut.totalCalories} cal &middot; {nut.totalProtein}g protein</p>
        )}
      </div>

      {/* Top insight card — links to /insights */}
      {data.narrative ? (
        <Link href="/insights" className="block bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Today&apos;s Insight</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{data.narrative}</p>
          <span className="text-xs text-blue-600 font-medium mt-2 inline-block">See all insights &rarr;</span>
        </Link>
      ) : data.dataStatus.pairedDays < data.dataStatus.neededForInsights ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-700 font-medium">
            {data.dataStatus.pairedDays === 0
              ? 'Log meals and connect WHOOP to unlock insights'
              : `${data.dataStatus.pairedDays}/${data.dataStatus.neededForInsights} days of paired data collected`}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (data.dataStatus.pairedDays / data.dataStatus.neededForInsights) * 100)}%` }} />
          </div>
        </div>
      ) : null}

      {/* Top action */}
      {topRec && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Top Action</span>
          <p className="text-sm text-slate-800 font-medium mt-1">{topRec.action}</p>
          {topRec.recurrence && topRec.recurrence !== 'new' && (
            <span className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded ${
              topRec.recurrence === 'persistent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}>{topRec.recurrence}</span>
          )}
        </div>
      )}

      {/* Weekly review */}
      {weekly && <WeeklyCard data={weekly} />}

      {/* Today's meals */}
      {nut.mealCount > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900">Today&apos;s Meals</span>
            <Link href="/meal-history" className="text-xs text-blue-600 font-medium">See all &rarr;</Link>
          </div>
          <div className="space-y-2">
            {data.meals.slice(0, 5).map(meal => (
              <Link key={meal.id} href={`/meal/${meal.id}`} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-shadow">
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm flex-shrink-0">
                  {meal.hasImage ? '🍽' : '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{meal.name}</p>
                  <p className="text-xs text-slate-400">{new Date(meal.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} &middot; {meal.calories} cal</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-slate-500 text-sm">No meals logged today</p>
        </div>
      )}

      {/* Upload actions */}
      <div className="flex gap-3">
        <Link href="/upload" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
          <Camera className="w-4 h-4" /> Take Photo
        </Link>
        <Link href="/upload?mode=text" className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl py-3.5 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
          <MessageSquare className="w-4 h-4" /> Describe
        </Link>
        <Link href="/upload?mode=quick" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl py-3.5 px-4 text-sm font-medium flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-slate-400 animate-pulse">Loading...</div></div>;

  if (!isAuthenticated || !user) {
    return (
      <ClientOnly>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Snap2Health</h1>
            <p className="text-slate-500 mb-2 text-lg">Upload meals. Connect biomarkers. Ask questions.</p>
            <p className="text-slate-400 mb-8">See how your diet affects your body over time.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium">Log In</Link>
              <Link href="/signup" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-3 rounded-xl font-medium">Sign Up</Link>
            </div>
          </div>
        </div>
      </ClientOnly>
    );
  }

  return <ClientOnly><AuthenticatedHome /></ClientOnly>;
}
