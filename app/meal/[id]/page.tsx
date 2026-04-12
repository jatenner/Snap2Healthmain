'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../components/client/ClientAuthProvider';
import ClientOnly from '../../components/ClientOnly';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Moon, Heart, Activity, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

function TagChip({ tag }: { tag: string }) {
  const label = tag.replace(/_/g, ' ');
  const isRisk = tag.includes('sleep') || tag.includes('caffeine') || tag.includes('alcohol') || tag.includes('late') || tag.includes('high_sugar');
  const isGood = tag.includes('recovery') || tag.includes('protein') || tag.includes('nutrient') || tag.includes('fiber');
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
      isRisk ? 'bg-red-500/20 text-red-300' : isGood ? 'bg-green-500/20 text-green-300' : 'bg-gray-100 text-gray-400'
    }`}>{label}</span>
  );
}

function MacroBar({ label, grams, pctDV, color }: { label: string; grams: number; pctDV: number | null; color: string }) {
  const pct = pctDV != null ? Math.min(100, pctDV) : 0;
  const targetGrams = pctDV && pctDV > 0 ? Math.round(grams / (pctDV / 100)) : null;
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span className="text-gray-900 font-medium">{label}</span>
        <span className="text-gray-500">
          <span className="text-gray-900 font-semibold">{Math.round(grams)}g</span>
          {targetGrams && <span className="text-gray-400"> / {targetGrams}g</span>}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 relative">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {pctDV != null && <div className="text-[10px] text-gray-400 mt-0.5 text-right">{Math.round(pctDV)}% of daily target</div>}
    </div>
  );
}

function NutrientRow({ name, amount, unit, pctDV }: { name: string; amount: number; unit: string; pctDV: number | null }) {
  const pct = pctDV != null ? Math.min(100, pctDV) : 0;
  const barColor = pct >= 75 ? 'bg-green-400' : pct >= 25 ? 'bg-blue-400' : 'bg-gray-300';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-24 flex-shrink-0 truncate">{name}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-500 w-16 text-right flex-shrink-0">
        {amount}{unit}
      </span>
      {pctDV != null && (
        <span className={`text-[10px] w-10 text-right flex-shrink-0 font-medium ${pct >= 75 ? 'text-green-600' : pct >= 25 ? 'text-blue-600' : 'text-gray-400'}`}>
          {Math.round(pctDV)}%
        </span>
      )}
    </div>
  );
}

function MealDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [meal, setMeal] = useState<any>(null);
  const [bio, setBio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllMicros, setShowAllMicros] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('meals').select('*').eq('id', id).single();
      if (data) {
        setMeal(data);
        const mealDate = (data.meal_time || data.created_at)?.substring(0, 10);
        if (mealDate) {
          const nextDay = new Date(mealDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDateStr = nextDay.toISOString().split('T')[0];
          const [sameNight, nextMorning] = await Promise.all([
            supabase.from('daily_biometric_summaries').select('sleep_score, recovery_score, hrv, baseline_sleep_score, baseline_recovery, baseline_hrv').eq('summary_date', mealDate).single(),
            supabase.from('daily_biometric_summaries').select('recovery_score, hrv, resting_heart_rate, baseline_recovery, baseline_hrv').eq('summary_date', nextDateStr).single(),
          ]);
          setBio({ sameNight: sameNight.data, nextMorning: nextMorning.data });
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleCorrection = async () => {
    if (!correction.trim() || !meal) return;
    setCorrecting(true);
    await fetch('/api/meal/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealId: meal.id, corrections: correction }),
    });
    const supabase = createClient();
    const { data } = await supabase.from('meals').select('*').eq('id', id).single();
    if (data) setMeal(data);
    setCorrection('');
    setCorrecting(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">Loading meal...</div>;
  if (!meal) return <div className="text-center py-20 text-gray-400">Meal not found.</div>;

  const mealTime = new Date(meal.meal_time || meal.created_at);
  const macros = Array.isArray(meal.macronutrients) ? meal.macronutrients : [];
  const getMacroDV = (name: string) => macros.find((m: any) => (m.name || '').toLowerCase().includes(name))?.percentDailyValue ?? null;
  const micros = (Array.isArray(meal.micronutrients) ? meal.micronutrients : []).filter((m: any) => m.amount > 0);
  const micros75 = micros.filter((m: any) => (m.percentDailyValue || 0) >= 75).sort((a: any, b: any) => (b.percentDailyValue || 0) - (a.percentDailyValue || 0));
  const micros25 = micros.filter((m: any) => (m.percentDailyValue || 0) >= 25 && (m.percentDailyValue || 0) < 75).sort((a: any, b: any) => (b.percentDailyValue || 0) - (a.percentDailyValue || 0));
  const microsLow = micros.filter((m: any) => (m.percentDailyValue || 0) < 25).sort((a: any, b: any) => (b.percentDailyValue || 0) - (a.percentDailyValue || 0));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{meal.meal_name}</h1>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{mealTime.toLocaleDateString()} at {mealTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            <span className="text-gray-600">|</span>
            <span>{meal.calories} cal</span>
          </div>
        </div>
      </div>

      {/* Photo */}
      {meal.image_url && !meal.image_url.startsWith('data:') && (
        <div className="rounded-2xl overflow-hidden">
          <Image src={meal.image_url} alt={meal.meal_name} width={600} height={400} className="w-full h-56 object-cover" unoptimized />
        </div>
      )}

      {/* Description */}
      {meal.analysis?.mealDescription && (
        <p className="text-sm text-gray-500 -mt-2">{meal.analysis.mealDescription}</p>
      )}

      {/* Macros — actual vs daily target */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Macronutrients</h2>
          <span className="text-[10px] text-gray-400">% of daily target</span>
        </div>
        <MacroBar label="Protein" grams={meal.protein || 0} pctDV={getMacroDV('protein')} color="bg-blue-500" />
        <MacroBar label="Carbs" grams={meal.carbs || 0} pctDV={getMacroDV('carb')} color="bg-yellow-500" />
        <MacroBar label="Fat" grams={meal.fat || 0} pctDV={getMacroDV('fat')} color="bg-orange-500" />
        <MacroBar label="Fiber" grams={macros.find((m: any) => (m.name || '').toLowerCase().includes('fiber'))?.amount || 0} pctDV={getMacroDV('fiber')} color="bg-green-500" />
      </div>

      {/* Micronutrients — compact with %DV bars */}
      {micros.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Vitamins & Minerals</h2>
            <span className="text-[10px] text-gray-400">% Daily Value</span>
          </div>
          {micros75.length > 0 && (
            <div>
              <span className="text-[10px] text-green-600 font-medium uppercase">Strong sources (75%+ DV)</span>
              <div className="mt-1.5 space-y-1.5">
                {micros75.map((m: any) => <NutrientRow key={m.name} name={m.name} amount={m.amount} unit={m.unit} pctDV={m.percentDailyValue} />)}
              </div>
            </div>
          )}
          {micros25.length > 0 && (
            <div>
              <span className="text-[10px] text-blue-600 font-medium uppercase">Moderate sources (25-75% DV)</span>
              <div className="mt-1.5 space-y-1.5">
                {micros25.map((m: any) => <NutrientRow key={m.name} name={m.name} amount={m.amount} unit={m.unit} pctDV={m.percentDailyValue} />)}
              </div>
            </div>
          )}
          {showAllMicros && microsLow.length > 0 && (
            <div>
              <span className="text-[10px] text-gray-400 font-medium uppercase">Trace amounts (&lt;25% DV)</span>
              <div className="mt-1.5 space-y-1.5">
                {microsLow.map((m: any) => <NutrientRow key={m.name} name={m.name} amount={m.amount} unit={m.unit} pctDV={m.percentDailyValue} />)}
              </div>
            </div>
          )}
          {microsLow.length > 0 && (
            <button onClick={() => setShowAllMicros(!showAllMicros)} className="text-xs text-blue-600 flex items-center gap-1">
              {showAllMicros ? <><ChevronUp className="w-3 h-3" /> Hide trace nutrients</> : <><ChevronDown className="w-3 h-3" /> +{microsLow.length} trace nutrients</>}
            </button>
          )}
        </div>
      )}

      {/* Analysis — Benefits / Concerns / Suggestions */}
      {((meal.benefits?.length > 0) || (meal.concerns?.length > 0) || (meal.suggestions?.length > 0)) && (
        <div className="space-y-3">
          {meal.benefits?.length > 0 && (
            <div className="bg-white border border-green-200 rounded-2xl p-4">
              <h2 className="text-sm font-medium text-green-700 mb-2">What This Meal Does Well</h2>
              <ul className="space-y-2">
                {meal.benefits.map((b: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-green-400 before:rounded-full">{b}</li>
                ))}
              </ul>
            </div>
          )}
          {meal.concerns?.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-2xl p-4">
              <h2 className="text-sm font-medium text-amber-700 mb-2">Watch Out For</h2>
              <ul className="space-y-2">
                {meal.concerns.map((c: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-amber-400 before:rounded-full">{c}</li>
                ))}
              </ul>
            </div>
          )}
          {meal.suggestions?.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-2xl p-4">
              <h2 className="text-sm font-medium text-blue-700 mb-2">How to Upgrade This Meal</h2>
              <ul className="space-y-2">
                {meal.suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-400 before:rounded-full">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Biometric response */}
      {bio && (bio.sameNight || bio.nextMorning) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-1">What Happened After</h2>
          <p className="text-[10px] text-gray-400 mb-3">These metrics are influenced by many factors and are not solely caused by this meal.</p>
          <div className="space-y-2 text-xs">
            {bio.sameNight?.sleep_score != null && (
              <div className="flex justify-between"><span className="text-gray-400 flex items-center gap-1"><Moon className="w-3 h-3" /> Sleep</span><span className="text-gray-900">{Math.round(bio.sameNight.sleep_score)}%{bio.sameNight.baseline_sleep_score && <span className={`ml-1 text-[10px] ${bio.sameNight.sleep_score >= bio.sameNight.baseline_sleep_score ? 'text-green-400' : 'text-red-400'}`}>(avg {Math.round(bio.sameNight.baseline_sleep_score)}%)</span>}</span></div>
            )}
            {bio.nextMorning?.recovery_score != null && (
              <div className="flex justify-between"><span className="text-gray-400 flex items-center gap-1"><Heart className="w-3 h-3" /> Recovery</span><span className="text-gray-900">{Math.round(bio.nextMorning.recovery_score)}%{bio.nextMorning.baseline_recovery && <span className={`ml-1 text-[10px] ${bio.nextMorning.recovery_score >= bio.nextMorning.baseline_recovery ? 'text-green-400' : 'text-red-400'}`}>(avg {Math.round(bio.nextMorning.baseline_recovery)}%)</span>}</span></div>
            )}
            {bio.nextMorning?.hrv != null && (
              <div className="flex justify-between"><span className="text-gray-400 flex items-center gap-1"><Activity className="w-3 h-3" /> HRV</span><span className="text-gray-900">{bio.nextMorning.hrv.toFixed(1)}ms{bio.nextMorning.baseline_hrv && <span className={`ml-1 text-[10px] ${bio.nextMorning.hrv >= bio.nextMorning.baseline_hrv ? 'text-green-400' : 'text-red-400'}`}>(avg {bio.nextMorning.baseline_hrv.toFixed(1)})</span>}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Correction */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <button onClick={() => setCorrecting(!correcting)} className="text-xs text-blue-600 flex items-center gap-1">
          <Edit3 className="w-3 h-3" /> Something wrong? Tap to correct
        </button>
        {correcting && (
          <div className="mt-3 space-y-2">
            <textarea value={correction} onChange={e => setCorrection(e.target.value)} placeholder="e.g., 'I ate the full box, not half'" className="w-full bg-gray-100 text-gray-900 text-sm rounded-xl p-3 resize-none outline-none placeholder-gray-400" rows={3} />
            <button onClick={handleCorrection} disabled={!correction.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 text-gray-900 text-sm py-2 px-4 rounded-xl">Apply Correction</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MealDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Please <Link href="/login" className="text-blue-600">log in</Link>.</p></div>;
  return <ClientOnly><div className="min-h-screen bg-gray-50"><MealDetailContent /></div></ClientOnly>;
}
