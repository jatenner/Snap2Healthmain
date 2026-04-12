'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../components/client/ClientAuthProvider';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ChevronRight, Beaker, BarChart3, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface CorrelationInsight {
  pairId: string;
  pairName: string;
  category: string;
  highGroup: { avg: number; n: number };
  lowGroup: { avg: number; n: number };
  difference: number;
  percentDifference: number;
  direction: string;
  confidence: string;
  confidenceScore: number;
  displaySentence: string;
  confounderControlled: boolean;
  confounderWarning?: string;
}

const RANGE_OPTIONS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${(styles as any)[confidence] || styles.low}`}>
      {confidence}
    </span>
  );
}

function ComparisonBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CorrelationCard({ insight }: { insight: CorrelationInsight }) {
  const maxVal = Math.max(insight.highGroup.avg, insight.lowGroup.avg);
  const absDiff = Math.abs(insight.difference).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">{insight.pairName}</span>
        <ConfidenceBadge confidence={insight.confidence} />
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-gray-400">{insight.pairName.split(' vs ')[0]}</span>
            <span className="text-gray-900 font-medium">{insight.highGroup.avg.toFixed(1)}</span>
          </div>
          <ComparisonBar value={insight.highGroup.avg} max={maxVal * 1.1} color="bg-blue-500" />
          <div className="text-[10px] text-gray-400 mt-0.5">n={insight.highGroup.n} days</div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-gray-400">Without</span>
            <span className="text-gray-900 font-medium">{insight.lowGroup.avg.toFixed(1)}</span>
          </div>
          <ComparisonBar value={insight.lowGroup.avg} max={maxVal * 1.1} color="bg-slate-500" />
          <div className="text-[10px] text-gray-400 mt-0.5">n={insight.lowGroup.n} days</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600 leading-relaxed">{insight.displaySentence}</p>
        {insight.confounderWarning && (
          <p className="text-[10px] text-yellow-400 mt-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> {insight.confounderWarning}
          </p>
        )}
      </div>
    </div>
  );
}

const BIOMETRIC_OPTIONS = [
  { key: 'sleep', label: 'Sleep Score', color: '#60a5fa' },
  { key: 'recovery', label: 'Recovery', color: '#4ade80' },
  { key: 'hrv', label: 'HRV (ms)', color: '#c084fc' },
  { key: 'rhr', label: 'Resting HR', color: '#f87171' },
  { key: 'strain', label: 'Strain', color: '#f59e0b' },
  { key: 'respiratoryRate', label: 'Resp Rate', color: '#06b6d4' },
  { key: 'deepSleep', label: 'Deep Sleep (min)', color: '#1d4ed8' },
  { key: 'remSleep', label: 'REM Sleep (min)', color: '#7c3aed' },
  { key: 'sleepEfficiency', label: 'Sleep Efficiency', color: '#059669' },
];

const NUTRITION_OPTIONS = [
  { key: 'protein', label: 'Protein (g)', color: '#60a5fa' },
  { key: 'carbs', label: 'Carbs (g)', color: '#facc15' },
  { key: 'fat', label: 'Fat (g)', color: '#fb923c' },
  { key: 'fiber', label: 'Fiber (g)', color: '#34d399' },
  { key: 'sugar', label: 'Sugar (g)', color: '#f472b6' },
  { key: 'calories', label: 'Calories', color: '#a78bfa' },
  { key: 'caffeine', label: 'Caffeine (mg)', color: '#fbbf24' },
  { key: 'sodium', label: 'Sodium (mg)', color: '#f97316' },
  { key: 'water', label: 'Water (ml)', color: '#0ea5e9' },
  { key: 'vitaminD', label: 'Vitamin D (mcg)', color: '#d97706' },
  { key: 'vitaminC', label: 'Vitamin C (mg)', color: '#ea580c' },
  { key: 'magnesium', label: 'Magnesium (mg)', color: '#16a34a' },
  { key: 'iron', label: 'Iron (mg)', color: '#dc2626' },
  { key: 'zinc', label: 'Zinc (mg)', color: '#8b5cf6' },
  { key: 'calcium', label: 'Calcium (mg)', color: '#94a3b8' },
  { key: 'potassium', label: 'Potassium (mg)', color: '#ca8a04' },
  { key: 'omega3', label: 'Omega-3 (mg)', color: '#0d9488' },
  { key: 'alcohol', label: 'Alcohol (g)', color: '#be123c' },
];

function MetricToggle({ options, selected, onSelect, label }: {
  options: Array<{ key: string; label: string; color: string }>;
  selected: string;
  onSelect: (key: string) => void;
  label: string;
}) {
  return (
    <div>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
              selected === opt.key
                ? 'text-gray-900 font-medium'
                : 'text-gray-400 hover:text-gray-600 bg-gray-100/50'
            }`}
            style={selected === opt.key ? { backgroundColor: opt.color + '30', color: opt.color } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ chartData, hasBiometrics, hasNutrition }: { chartData: any[]; hasBiometrics: boolean; hasNutrition: boolean }) {
  const [bioMetric, setBioMetric] = useState('sleep');
  const [nutMetric, setNutMetric] = useState('protein');

  if (!hasBiometrics) return null;

  const bioOption = BIOMETRIC_OPTIONS.find(o => o.key === bioMetric)!;
  const nutOption = NUTRITION_OPTIONS.find(o => o.key === nutMetric)!;
  const hasNutData = hasNutrition && chartData.some((d: any) => d[nutMetric] != null);

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Compare Trends</h2>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        {/* Toggles */}
        <div className="space-y-2">
          <MetricToggle options={BIOMETRIC_OPTIONS} selected={bioMetric} onSelect={setBioMetric} label="Body metric" />
          {hasNutrition && (
            <MetricToggle options={NUTRITION_OPTIONS} selected={nutMetric} onSelect={setNutMetric} label="Nutrition metric" />
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bioOption.color }} />
            {bioOption.label}
          </span>
          {hasNutData && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nutOption.color }} />
              {nutOption.label}
            </span>
          )}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={30} />
            {hasNutData && (
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={30} />
            )}
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Line yAxisId="left" type="monotone" dataKey={bioMetric} stroke={bioOption.color} strokeWidth={2} dot={{ r: 3, fill: bioOption.color }} />
            {hasNutData && (
              <Line yAxisId="right" type="monotone" dataKey={nutMetric} stroke={nutOption.color} strokeWidth={2} dot={{ r: 3, fill: nutOption.color }} strokeDasharray="5 5" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TrendsContent() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
    fetch(`/api/trends?days=${range}`, { headers: tz ? { 'x-timezone': tz } : {} })
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 animate-pulse">Loading trends...</div>;
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400">Unable to load trends.</div>;
  }

  const { biometrics, nutrition, correlations, outcomeAnalyses, sensitivities } = data;

  // Prepare chart data — null (not zero) for days without data
  const chartData = biometrics.map((b: any) => {
    const nutDay = nutrition.find((n: any) => n.summary_date === b.summary_date);
    // Only include nutrition values if the user actually logged meals that day
    const hasMeals = nutDay && (nutDay.meal_count || 0) > 0;
    return {
      date: b.summary_date.substring(5), // MM-DD
      // Biometrics (from WHOOP — always present if biometric row exists)
      sleep: b.sleep_score ?? null,
      recovery: b.recovery_score ?? null,
      hrv: b.hrv ? Math.round(b.hrv * 10) / 10 : null,
      rhr: b.resting_heart_rate ?? null,
      strain: b.strain ?? null,
      respiratoryRate: b.respiratory_rate ?? null,
      deepSleep: b.deep_sleep_minutes ?? null,
      remSleep: b.rem_sleep_minutes ?? null,
      sleepEfficiency: b.sleep_efficiency ?? null,
      // Nutrition (null if no meals logged — never fake data)
      protein: hasMeals ? nutDay.total_protein : null,
      carbs: hasMeals ? nutDay.total_carbs : null,
      fat: hasMeals ? nutDay.total_fat : null,
      calories: hasMeals ? nutDay.total_calories : null,
      fiber: hasMeals ? nutDay.total_fiber : null,
      sugar: hasMeals ? nutDay.total_sugar : null,
      caffeine: hasMeals ? nutDay.total_caffeine : null,
      sodium: hasMeals ? nutDay.total_sodium : null,
      water: hasMeals ? nutDay.total_water_ml : null,
      vitaminD: hasMeals ? nutDay.total_vitamin_d : null,
      vitaminC: hasMeals ? nutDay.total_vitamin_c : null,
      magnesium: hasMeals ? nutDay.total_magnesium : null,
      iron: hasMeals ? nutDay.total_iron : null,
      zinc: hasMeals ? nutDay.total_zinc : null,
      calcium: hasMeals ? nutDay.total_calcium : null,
      potassium: hasMeals ? nutDay.total_potassium : null,
      omega3: hasMeals ? nutDay.total_omega3 : null,
      alcohol: hasMeals ? nutDay.total_alcohol : null,
    };
  });

  const hasCorrelations = correlations.length > 0;
  const hasNutrition = nutrition.length > 0;

  // Compute daily averages for the selected period
  const nutWithMeals = nutrition.filter((n: any) => (n.meal_count || 0) > 0);
  const avgDays = nutWithMeals.length || 1;
  const dailyAvg = {
    calories: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_calories || 0), 0) / avgDays),
    protein: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_protein || 0), 0) / avgDays),
    carbs: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_carbs || 0), 0) / avgDays),
    fat: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_fat || 0), 0) / avgDays),
    fiber: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_fiber || 0), 0) / avgDays),
    sugar: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_sugar || 0), 0) / avgDays),
    caffeine: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_caffeine || 0), 0) / avgDays),
    sodium: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_sodium || 0), 0) / avgDays),
    water: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_water_ml || 0), 0) / avgDays),
    vitD: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_vitamin_d || 0), 0) / avgDays * 10) / 10,
    vitC: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_vitamin_c || 0), 0) / avgDays),
    mag: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_magnesium || 0), 0) / avgDays),
    iron: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_iron || 0), 0) / avgDays * 10) / 10,
    omega3: Math.round(nutWithMeals.reduce((s: number, n: any) => s + (n.total_omega3 || 0), 0) / avgDays),
    mealsPerDay: (nutWithMeals.reduce((s: number, n: any) => s + (n.meal_count || 0), 0) / avgDays).toFixed(1),
  };

  // Daily targets (FDA + Attia-informed)
  const targets = { protein: 120, carbs: 250, fat: 65, fiber: 30, sugar: 25, caffeine: 400, sodium: 2300, vitD: 20, vitC: 90, mag: 400, iron: 18, omega3: 1000 };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header + Range */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Trends</h1>
        <div className="flex gap-1 bg-white rounded-lg p-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setRange(opt.days)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                range === opt.days ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====== DAILY AVERAGES ====== */}
      {hasNutrition && nutWithMeals.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Daily Averages ({avgDays} days)</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
            {/* Macro averages with targets */}
            <div className="space-y-2">
              {([
                { label: 'Protein', value: dailyAvg.protein, target: targets.protein, unit: 'g', color: 'bg-blue-500' },
                { label: 'Carbs', value: dailyAvg.carbs, target: targets.carbs, unit: 'g', color: 'bg-yellow-500' },
                { label: 'Fat', value: dailyAvg.fat, target: targets.fat, unit: 'g', color: 'bg-orange-500' },
                { label: 'Fiber', value: dailyAvg.fiber, target: targets.fiber, unit: 'g', color: 'bg-green-500' },
              ] as const).map(m => {
                const pct = Math.min(100, (m.value / m.target) * 100);
                const isLow = pct < 50;
                return (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-900 font-medium">{m.label}</span>
                      <span className={isLow ? 'text-red-500 font-medium' : 'text-gray-600'}>
                        {m.value}{m.unit} <span className="text-gray-400">/ {m.target}{m.unit}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${m.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Secondary metrics grid */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{dailyAvg.calories}</div>
                <div className="text-[10px] text-gray-400">cal/day</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{dailyAvg.sugar}g</div>
                <div className={`text-[10px] ${dailyAvg.sugar > targets.sugar ? 'text-red-400' : 'text-gray-400'}`}>sugar {dailyAvg.sugar > targets.sugar ? '(high)' : ''}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{dailyAvg.caffeine}mg</div>
                <div className="text-[10px] text-gray-400">caffeine</div>
              </div>
            </div>

            {/* Key micros */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase">Key vitamin & mineral averages</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5">
                {([
                  { label: 'Vitamin D', value: dailyAvg.vitD, target: targets.vitD, unit: 'mcg' },
                  { label: 'Vitamin C', value: dailyAvg.vitC, target: targets.vitC, unit: 'mg' },
                  { label: 'Magnesium', value: dailyAvg.mag, target: targets.mag, unit: 'mg' },
                  { label: 'Iron', value: dailyAvg.iron, target: targets.iron, unit: 'mg' },
                  { label: 'Omega-3', value: dailyAvg.omega3, target: targets.omega3, unit: 'mg' },
                  { label: 'Sodium', value: dailyAvg.sodium, target: targets.sodium, unit: 'mg' },
                ] as const).map(v => {
                  const pct = Math.round((v.value / v.target) * 100);
                  const isLow = pct < 50;
                  const isHigh = v.label === 'Sodium' && pct > 100;
                  return (
                    <div key={v.label} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-500">{v.label}</span>
                      <span className={isHigh ? 'text-red-500 font-medium' : isLow ? 'text-amber-500' : 'text-gray-700'}>
                        {v.value}{v.unit} <span className="text-gray-400 text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== LINK TO INSIGHTS FOR INTERPRETATION ====== */}
      {(hasCorrelations || (outcomeAnalyses && outcomeAnalyses.length > 0)) && (
        <Link href="/insights" className="block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Diet-biomarker analysis available</p>
              <p className="text-xs text-blue-600 mt-0.5">{correlations.length} patterns detected across your data</p>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400" />
          </div>
        </Link>
      )}

      {!hasCorrelations && (!outcomeAnalyses || outcomeAnalyses.length === 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-400">No patterns detected yet.</p>
          <p className="text-xs text-gray-400 mt-1">Log meals consistently for 2+ weeks to unlock diet-biometric insights.</p>
        </div>
      )}

      {/* Personal sensitivities */}
      {sensitivities && sensitivities.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Your Sensitivities</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
            {sensitivities.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{s.variable.replace(/_/g, ' ')}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  s.sensitivity === 'high' ? 'bg-red-100 text-red-700' :
                  s.sensitivity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-400'
                }`}>{s.sensitivity} sensitivity</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== FLEXIBLE TREND CHART (toggle any nutrition vs any biometric) ====== */}
      <TrendChart chartData={chartData} hasBiometrics={biometrics.length > 5} hasNutrition={hasNutrition && nutrition.length > 3} />

      {/* ====== QUICK PATTERNS ====== */}
      {hasNutrition && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Diet Patterns</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
            {(() => {
              const lateNights = nutrition.filter((n: any) => n.has_late_night_meal).length;
              const totalDays = nutrition.length;
              const lowProtein = nutrition.filter((n: any) => n.total_protein < 60).length;
              const highSugar = nutrition.filter((n: any) => n.total_sugar > 50).length;
              const patterns: Array<{ label: string; value: string; color: string }> = [];

              if (lateNights > 0) patterns.push({ label: 'Late-night meals', value: `${lateNights}/${totalDays} days`, color: lateNights > totalDays / 2 ? 'text-red-400' : 'text-yellow-400' });
              if (lowProtein > 0) patterns.push({ label: 'Low protein days (<60g)', value: `${lowProtein}/${totalDays} days`, color: lowProtein > totalDays / 2 ? 'text-red-400' : 'text-yellow-400' });
              if (highSugar > 0) patterns.push({ label: 'High sugar days (>50g)', value: `${highSugar}/${totalDays} days`, color: highSugar > totalDays / 2 ? 'text-red-400' : 'text-yellow-400' });

              if (patterns.length === 0) {
                return <p className="text-xs text-gray-400">Not enough data to show patterns yet.</p>;
              }

              return patterns.map((p, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">{p.label}</span>
                  <span className={`text-xs font-medium ${p.color}`}>{p.value}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrendsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Please <Link href="/login" className="text-blue-600">log in</Link> to view trends.</p></div>;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50">
        <TrendsContent />
      </div>
    </ClientOnly>
  );
}
