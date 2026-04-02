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

function MacroBar({ label, grams, color, maxGrams }: { label: string; grams: number; color: string; maxGrams: number }) {
  const pct = maxGrams > 0 ? Math.min(100, (grams / maxGrams) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-900 font-medium">{Math.round(grams)}g</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
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
  const macroMax = Math.max(meal.protein || 0, meal.carbs || 0, meal.fat || 0, 1);
  const micros = Array.isArray(meal.micronutrients) ? meal.micronutrients : [];
  const topMicros = micros.filter((m: any) => (m.percentDailyValue || 0) >= 15).sort((a: any, b: any) => (b.percentDailyValue || 0) - (a.percentDailyValue || 0));
  const tags = Array.isArray(meal.meal_tags) ? meal.meal_tags : [];

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

      {/* Tags */}
      {tags.length > 0 && <div className="flex flex-wrap gap-1.5">{tags.map((t: string) => <TagChip key={t} tag={t} />)}</div>}

      {/* Macros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-medium text-gray-900">Macronutrients</h2>
        <MacroBar label="Protein" grams={meal.protein || 0} color="bg-blue-500" maxGrams={macroMax * 1.2} />
        <MacroBar label="Carbs" grams={meal.carbs || 0} color="bg-yellow-500" maxGrams={macroMax * 1.2} />
        <MacroBar label="Fat" grams={meal.fat || 0} color="bg-orange-500" maxGrams={macroMax * 1.2} />
      </div>

      {/* Micronutrients */}
      {micros.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Nutrients</h2>
          {topMicros.length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] text-green-400 uppercase">Good sources</span>
              <div className="mt-1 space-y-1">
                {topMicros.slice(0, 5).map((m: any) => (
                  <div key={m.name} className="flex justify-between text-xs">
                    <span className="text-gray-600">{m.name}</span>
                    <span className="text-green-400">{m.amount}{m.unit} ({m.percentDailyValue}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showAllMicros && (
            <div className="space-y-1 mb-2">
              {micros.map((m: any) => (
                <div key={m.name} className="flex justify-between text-xs">
                  <span className="text-gray-400">{m.name}</span>
                  <span className="text-gray-600">{m.amount}{m.unit}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowAllMicros(!showAllMicros)} className="text-xs text-blue-600 flex items-center gap-1 mt-1">
            {showAllMicros ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> All {micros.length} nutrients</>}
          </button>
        </div>
      )}

      {/* Benefits / Concerns */}
      {((meal.benefits?.length > 0) || (meal.concerns?.length > 0)) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
          {meal.benefits?.length > 0 && <div><span className="text-[10px] text-green-400 uppercase">Benefits</span>{meal.benefits.map((b: string, i: number) => <p key={i} className="text-xs text-gray-600 mt-0.5">{b}</p>)}</div>}
          {meal.concerns?.length > 0 && <div><span className="text-[10px] text-yellow-400 uppercase">Concerns</span>{meal.concerns.map((c: string, i: number) => <p key={i} className="text-xs text-gray-600 mt-0.5">{c}</p>)}</div>}
        </div>
      )}

      {/* Biometric response */}
      {bio && (bio.sameNight || bio.nextMorning) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-3">What Happened After</h2>
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
