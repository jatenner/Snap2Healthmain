'use client';

import Link from 'next/link';
import { Camera, MessageSquare, Moon, Heart, Activity, Flame, AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronRight, Beaker, Clock } from 'lucide-react';
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
    inflammatoryScore: number | null;
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
  meals: Array<{
    id: string;
    name: string;
    calories: number;
    time: string;
    tags: string[];
    hasImage: boolean;
  }>;
  experiment: {
    id: string;
    title: string;
    hypothesis: string;
    targetBehavior: string;
    durationDays: number;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
}

// Trend arrow component
function TrendArrow({ deviation }: { deviation: number | null }) {
  if (deviation == null) return <Minus className="w-3 h-3 text-gray-500" />;
  if (deviation > 3) return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (deviation < -3) return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-gray-500" />;
}

// Quality color
function qualityColor(value: number | null, higherBetter = true): string {
  if (value == null) return 'text-gray-400';
  if (higherBetter) {
    if (value >= 70) return 'text-green-400';
    if (value >= 45) return 'text-yellow-400';
    return 'text-red-400';
  }
  // For strain: lower can be better for recovery
  return 'text-blue-400';
}

function qualityBg(value: number | null): string {
  if (value == null) return 'bg-slate-800';
  if (value >= 70) return 'bg-green-500/10 border-green-500/20';
  if (value >= 45) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-red-500/10 border-red-500/20';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading your day...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-lg mx-auto text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Welcome to Snap2Health</h1>
          <p className="text-gray-400 mb-8">Upload your first meal, beverage, or supplement to get started.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/upload" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
              <Camera className="w-5 h-5" /> Take Photo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bio = data.biometric;
  const nut = data.nutrition;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-white">{data.greeting}</h1>
          {bio?.dayQuality && (
            <p className="text-gray-400 mt-1">
              {bio.dayQuality === 'good' && 'Your body is in good shape today.'}
              {bio.dayQuality === 'neutral' && 'Moderate recovery today — take it steady.'}
              {bio.dayQuality === 'poor' && 'Your body needs rest today. Focus on recovery.'}
            </p>
          )}
          {!bio && <p className="text-gray-400 mt-1">Log meals to track your nutrition and health trends.</p>}
        </div>

        {/* ====== HERO INSIGHT CARD (outcome-first contributor model) ====== */}
        {data.heroInsight ? (
          <div className={`rounded-2xl p-5 border ${
            data.heroInsight.direction === 'worse'
              ? 'bg-gradient-to-br from-red-600/10 to-orange-600/10 border-red-500/20'
              : 'bg-gradient-to-br from-blue-600/15 to-purple-600/15 border-blue-500/20'
          }`}>
            {/* Header: outcome + confidence */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-medium uppercase tracking-wider ${
                data.heroInsight.direction === 'worse' ? 'text-red-300' : 'text-blue-300'
              }`}>
                {data.heroInsight.category || 'Pattern Detected'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                data.heroInsight.confidence === 'high' ? 'bg-green-500/20 text-green-300' :
                data.heroInsight.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {data.heroInsight.confidence}
              </span>
            </div>

            {/* Outcome status — the headline */}
            <p className="text-white font-semibold text-[15px] leading-snug">{data.heroInsight.title}</p>

            {/* Primary drivers with strength bars */}
            {data.heroInsight.primaryDrivers && data.heroInsight.primaryDrivers.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Likely contributors</span>
                <div className="mt-1.5 space-y-2">
                  {data.heroInsight.primaryDrivers.map((driver: string, i: number) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="text-xs text-gray-200">{driver}</span>
                      </div>
                      <div className="ml-3.5 w-full bg-slate-700/50 rounded-full h-1">
                        <div className={`h-1 rounded-full ${i === 0 ? 'bg-blue-400 w-[85%]' : 'bg-blue-400/60 w-[60%]'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting signals — subdued */}
            {data.heroInsight.supportingSignals && data.heroInsight.supportingSignals.length > 0 && (
              <div className="mt-2 space-y-1">
                {data.heroInsight.supportingSignals.map((signal: string, i: number) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-1 h-1 rounded-full bg-gray-600 flex-shrink-0" />
                      <span className="text-[11px] text-gray-500">{signal}</span>
                    </div>
                    <div className="ml-3 w-full bg-slate-700/30 rounded-full h-0.5">
                      <div className="h-0.5 rounded-full bg-gray-600 w-[30%]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link href="/trends" className="inline-flex items-center gap-1 text-blue-400 text-[11px] mt-3 hover:text-blue-300">
              See full analysis <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        ) : !bio ? null : (
          /* Empty state: no insights yet — guide user to log more */
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
            <div className="text-sm text-gray-300 mb-2">Log meals for 2 weeks to unlock your personal patterns</div>
            <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
              <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (nut.mealCount / 28) * 100)}%` }} />
            </div>
            <div className="text-[10px] text-gray-500">~14 days of consistent logging needed</div>
          </div>
        )}

        {/* ====== BODY STATUS (4 cards) ====== */}
        {bio && (
          <div className="grid grid-cols-4 gap-3">
            <div className={`rounded-xl p-3 border text-center ${qualityBg(bio.sleepScore)}`}>
              <Moon className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              <div className={`text-lg font-bold ${qualityColor(bio.sleepScore)}`}>
                {bio.sleepScore != null ? `${Math.round(bio.sleepScore)}` : '—'}
              </div>
              <div className="text-[10px] text-gray-400 uppercase">Sleep</div>
              <div className="flex justify-center mt-1"><TrendArrow deviation={bio.sleepDeviation} /></div>
            </div>
            <div className={`rounded-xl p-3 border text-center ${qualityBg(bio.recoveryScore)}`}>
              <Heart className="w-4 h-4 mx-auto mb-1 text-green-400" />
              <div className={`text-lg font-bold ${qualityColor(bio.recoveryScore)}`}>
                {bio.recoveryScore != null ? `${Math.round(bio.recoveryScore)}` : '—'}
              </div>
              <div className="text-[10px] text-gray-400 uppercase">Recovery</div>
              <div className="flex justify-center mt-1"><TrendArrow deviation={bio.recoveryDeviation} /></div>
            </div>
            <div className={`rounded-xl p-3 border text-center bg-slate-800 border-slate-700`}>
              <Activity className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <div className="text-lg font-bold text-purple-400">
                {bio.hrv != null ? `${bio.hrv}` : '—'}
              </div>
              <div className="text-[10px] text-gray-400 uppercase">HRV</div>
              <div className="flex justify-center mt-1"><TrendArrow deviation={bio.hrvDeviation} /></div>
            </div>
            <div className={`rounded-xl p-3 border text-center bg-slate-800 border-slate-700`}>
              <Flame className="w-4 h-4 mx-auto mb-1 text-orange-400" />
              <div className="text-lg font-bold text-orange-400">
                {bio.strain != null ? `${bio.strain}` : '—'}
              </div>
              <div className="text-[10px] text-gray-400 uppercase">Strain</div>
            </div>
          </div>
        )}

        {/* ====== NUTRITION STATUS ====== */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Today&apos;s Nutrition</span>
            {nut.nutrientAdequacy != null && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                nut.nutrientAdequacy >= 60 ? 'bg-green-500/20 text-green-300' :
                nut.nutrientAdequacy >= 30 ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {nut.nutrientAdequacy}% nutrient target
              </span>
            )}
          </div>

          {nut.mealCount === 0 ? (
            <p className="text-gray-400 text-sm">No meals logged yet today. Upload or describe what you ate.</p>
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{nut.totalCalories} cal</div>
              <div className="flex gap-4 mt-1 text-xs text-gray-400">
                <span><span className="text-blue-400 font-medium">{nut.totalProtein}g</span> protein</span>
                <span><span className="text-yellow-400 font-medium">{nut.totalCarbs}g</span> carbs</span>
                <span><span className="text-orange-400 font-medium">{nut.totalFat}g</span> fat</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{nut.mealCount} meal{nut.mealCount !== 1 ? 's' : ''} logged</div>

              {/* Nutrient gaps */}
              {nut.nutrientGaps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-gray-400 mb-2">Missing today:</div>
                  <div className="space-y-1.5">
                    {nut.nutrientGaps.map((gap) => (
                      <div key={gap.name} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-300">{gap.name}</span>
                            <span className="text-xs text-red-400">{gap.pct}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1 mt-0.5">
                            <div
                              className={`h-1 rounded-full ${gap.pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(gap.pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ====== RECOMMENDATION (one action) ====== */}
        {data.recommendation && (
          <div className="bg-emerald-500/10 border-l-2 border-emerald-500 rounded-r-2xl rounded-l-sm p-4">
            <p className="text-sm text-white leading-relaxed">{data.recommendation}</p>
            {data.heroInsight?.recommendedAction && data.heroInsight.recommendedAction !== data.recommendation && (
              <p className="text-xs text-gray-400 mt-1.5">Based on your {data.heroInsight.primaryDrivers?.[0]?.toLowerCase() || 'patterns'}</p>
            )}
            <Link href="/experiments" className="inline-flex items-center gap-1 text-emerald-400 text-xs mt-2 hover:text-emerald-300">
              Start as experiment <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* ====== ACTIVE EXPERIMENT ====== */}
        {data.experiment && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-300 uppercase tracking-wider">Active Experiment</span>
            </div>
            <p className="text-sm text-white font-medium">{data.experiment.title}</p>
            <p className="text-xs text-gray-400 mt-1">{data.experiment.targetBehavior}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>
                {Math.max(0, Math.ceil((new Date(data.experiment.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days remaining
              </span>
            </div>
          </div>
        )}

        {/* ====== MEAL TIMELINE ====== */}
        {data.meals.length > 0 && (
          <div>
            <div className="text-sm font-medium text-white mb-3">Today&apos;s Timeline</div>
            <div className="space-y-2">
              {data.meals.map((meal) => (
                <Link key={meal.id} href={`/meal/${meal.id}`} className="block">
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 hover:border-slate-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white font-medium">{meal.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">
                            {new Date(meal.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span className="text-xs text-gray-500">{meal.calories} cal</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end max-w-[150px]">
                        {meal.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            tag.includes('sleep') || tag.includes('caffeine') || tag.includes('alcohol')
                              ? 'bg-red-500/20 text-red-300'
                              : tag.includes('recovery') || tag.includes('protein') || tag.includes('nutrient')
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-slate-700 text-gray-400'
                          }`}>
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ====== LOG ACTION ====== */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href="/upload" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 text-center transition-colors">
            <Camera className="w-6 h-6 mx-auto mb-1" />
            <div className="text-sm font-medium">Take Photo</div>
          </Link>
          <Link href="/upload?mode=text" className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl p-4 text-center transition-colors">
            <MessageSquare className="w-6 h-6 mx-auto mb-1" />
            <div className="text-sm font-medium">Describe It</div>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4">Snap2Health</h1>
            <p className="text-gray-400 mb-8 text-lg">Track what you eat. See how your body responds. Improve.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-medium border border-slate-700 transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <AuthenticatedHome userId={user.id} />
    </ClientOnly>
  );
}
