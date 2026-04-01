'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { useAuth } from './client/ClientAuthProvider';
import {
  Calendar,
  TrendingUp,
  Target,
  Flame,
  BarChart3,
  Activity,
  Heart,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { format, subDays, startOfWeek } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  health_score?: number;
  date: string;
}

interface WeeklyStats {
  totalCalories: number;
  avgCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  avgHealthScore: number;
  mealsLogged: number;
  bestDay: string;
  worstDay: string;
}

interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MACRO_COLORS = {
  protein: '#3b82f6',
  carbs: '#22c55e',
  fat: '#eab308',
  calories: '#f97316',
};

// Calculate goals from user profile using Mifflin-St Jeor BMR
function calculateGoalsFromProfile(profile: any): Goals | null {
  if (!profile) return null;

  const age = parseInt(profile.age);
  const weight = parseFloat(profile.weight);
  const height = parseFloat(profile.height);
  const gender = profile.gender;

  if (!age || !weight || !height) return null;

  // Convert to metric if needed
  const weightKg = profile.weight_unit === 'lb' ? weight * 0.453592 : weight;
  const heightCm = profile.height_unit === 'in' ? height * 2.54 : height;

  // Mifflin-St Jeor BMR
  let bmr: number;
  if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }

  // Activity multiplier
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    'lightly active': 1.375,
    moderately_active: 1.55,
    'moderately active': 1.55,
    active: 1.725,
    'very active': 1.9,
    very_active: 1.9,
    extremely_active: 2.0,
    'extremely active': 2.0,
  };
  const multiplier = activityMultipliers[(profile.activity_level || '').toLowerCase()] || 1.55;
  let tdee = Math.round(bmr * multiplier);

  // Goal adjustment
  const goal = (profile.goal || '').toLowerCase();
  if (goal.includes('weight loss') || goal.includes('lose')) {
    tdee = Math.round(tdee * 0.8); // 20% deficit
  } else if (goal.includes('muscle') || goal.includes('gain') || goal.includes('bulk')) {
    tdee = Math.round(tdee * 1.1); // 10% surplus
  }

  // Macro split (balanced by default, higher protein for muscle goals)
  const proteinRatio = goal.includes('muscle') || goal.includes('gain') ? 0.30 : 0.25;
  const fatRatio = 0.25;
  const carbRatio = 1 - proteinRatio - fatRatio;

  return {
    calories: tdee,
    protein: Math.round((tdee * proteinRatio) / 4),
    carbs: Math.round((tdee * carbRatio) / 4),
    fat: Math.round((tdee * fatRatio) / 9),
  };
}

export default function NutritionDashboard() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<NutritionData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [todayData, setTodayData] = useState<NutritionData | null>(null);
  const [goals, setGoals] = useState<Goals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('week');

  const { user } = useAuth();

  // Load user profile to set personalized goals
  useEffect(() => {
    if (!user?.id) return;

    async function loadProfile() {
      try {
        const supabase = createClient();
        // Try profiles table first
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user!.id)
          .single();

        const profileData = profile || user?.user_metadata;
        if (profileData) {
          const calculatedGoals = calculateGoalsFromProfile(profileData);
          if (calculatedGoals) {
            setGoals(calculatedGoals);
          }
        }
      } catch {
        // Fall back to user_metadata
        const metadata = user?.user_metadata;
        if (metadata) {
          const calculatedGoals = calculateGoalsFromProfile(metadata);
          if (calculatedGoals) setGoals(calculatedGoals);
        }
      }
    }
    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadNutritionData();
    }
  }, [user?.id, selectedTimeframe]);

  const loadNutritionData = async () => {
    try {
      setLoading(true);

      const today = new Date();
      let startDate: Date;

      switch (selectedTimeframe) {
        case 'today':
          startDate = today;
          break;
        case 'week':
          startDate = startOfWeek(today);
          break;
        case 'month':
          startDate = subDays(today, 30);
          break;
        default:
          startDate = startOfWeek(today);
      }

      const supabase = createClient();
      const { data: meals, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading nutrition data:', error);
        return;
      }

      // Process meals into daily nutrition data
      const dailyData: Record<string, NutritionData> = {};

      meals?.forEach((meal: any) => {
        const date = format(new Date(meal.created_at), 'yyyy-MM-dd');

        if (!dailyData[date]) {
          dailyData[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, health_score: 0, date };
        }

        dailyData[date].calories += meal.calories || 0;
        dailyData[date].protein += meal.protein || 0;
        dailyData[date].carbs += meal.carbs || 0;
        dailyData[date].fat += meal.fat || 0;

        if (meal.health_score) {
          dailyData[date].health_score = (dailyData[date].health_score! + meal.health_score) / 2;
        }
      });

      const processedData = Object.values(dailyData);
      setWeeklyData(processedData);

      const todayString = format(today, 'yyyy-MM-dd');
      setTodayData(dailyData[todayString] || null);

      if (processedData.length > 0) {
        setWeeklyStats(calculateWeeklyStats(processedData));
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyStats = (data: NutritionData[]): WeeklyStats => {
    const totalCalories = data.reduce((sum, d) => sum + d.calories, 0);
    const totalProtein = data.reduce((sum, d) => sum + d.protein, 0);
    const totalCarbs = data.reduce((sum, d) => sum + d.carbs, 0);
    const totalFat = data.reduce((sum, d) => sum + d.fat, 0);
    const avgHealthScore = data.reduce((sum, d) => sum + (d.health_score || 0), 0) / data.length;

    const bestDay = data.reduce((best, d) => ((d.health_score || 0) > (best.health_score || 0) ? d : best));
    const worstDay = data.reduce((worst, d) => ((d.health_score || 0) < (worst.health_score || 0) ? d : worst));

    return {
      totalCalories,
      avgCalories: totalCalories / data.length,
      totalProtein,
      totalCarbs,
      totalFat,
      avgHealthScore,
      mealsLogged: data.length,
      bestDay: bestDay.date,
      worstDay: worstDay.date,
    };
  };

  const getProgressPercentage = (current: number, goal: number) => Math.min((current / goal) * 100, 100);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-4" />
              <div className="h-8 bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-2 bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = weeklyData.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    calories: Math.round(d.calories),
    protein: Math.round(d.protein),
    carbs: Math.round(d.carbs),
    fat: Math.round(d.fat),
  }));

  // Macro pie data for today
  const proteinCal = (todayData?.protein || 0) * 4;
  const carbsCal = (todayData?.carbs || 0) * 4;
  const fatCal = (todayData?.fat || 0) * 9;
  const totalMacroCal = proteinCal + carbsCal + fatCal;
  const pieData = totalMacroCal > 0
    ? [
        { name: 'Protein', value: Math.round(proteinCal), grams: Math.round(todayData?.protein || 0) },
        { name: 'Carbs', value: Math.round(carbsCal), grams: Math.round(todayData?.carbs || 0) },
        { name: 'Fat', value: Math.round(fatCal), grams: Math.round(todayData?.fat || 0) },
      ]
    : [];
  const PIE_COLORS = [MACRO_COLORS.protein, MACRO_COLORS.carbs, MACRO_COLORS.fat];

  return (
    <div className="space-y-6">
      {/* Header with timeframe selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Nutrition Dashboard</h2>
          <p className="text-gray-400 text-sm">Track your nutrition goals and progress</p>
        </div>

        <div className="flex bg-gray-800 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map(timeframe => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-gray-300 font-medium">Calories</span>
          </div>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-2xl font-bold text-white">{todayData?.calories?.toFixed(0) || 0}</span>
            <span className="text-gray-500 text-sm">/ {goals.calories}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getProgressPercentage(todayData?.calories || 0, goals.calories))}`}
              style={{ width: `${getProgressPercentage(todayData?.calories || 0, goals.calories)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.max(0, goals.calories - (todayData?.calories || 0)).toFixed(0)} remaining today
          </p>
        </div>

        {/* Protein */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300 font-medium">Protein</span>
          </div>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-2xl font-bold text-white">{todayData?.protein?.toFixed(0) || 0}g</span>
            <span className="text-gray-500 text-sm">/ {goals.protein}g</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getProgressPercentage(todayData?.protein || 0, goals.protein))}`}
              style={{ width: `${getProgressPercentage(todayData?.protein || 0, goals.protein)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.max(0, goals.protein - (todayData?.protein || 0)).toFixed(0)}g remaining today
          </p>
        </div>

        {/* Health Score */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Heart className="w-5 h-5 text-green-400" />
            <span className="text-gray-300 font-medium">Health Score</span>
          </div>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-2xl font-bold text-white">{todayData?.health_score?.toFixed(1) || 'N/A'}</span>
            <span className="text-gray-500 text-sm">/ 10</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${((todayData?.health_score || 0) / 10) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {todayData?.health_score ? 'Great job!' : 'Log meals to see score'}
          </p>
        </div>

        {/* Weekly Avg */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-gray-300 font-medium">Period Avg</span>
          </div>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-2xl font-bold text-white">{weeklyStats?.avgCalories?.toFixed(0) || 0}</span>
            <span className="text-gray-500 text-sm">cal/day</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-300"
              style={{ width: `${getProgressPercentage(weeklyStats?.avgCalories || 0, goals.calories)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {weeklyStats?.mealsLogged || 0} days with meals logged
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macro Distribution Pie Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Today's Macro Split</h3>

          {pieData.length > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={200}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#d1d5db' }}
                    formatter={(value: any, name: any) => [`${value} cal`, name]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-gray-300 text-sm">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-medium text-sm">{entry.grams}g</span>
                      <span className="text-gray-500 text-xs ml-1">
                        ({Math.round((entry.value / totalMacroCal) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="text-white font-medium text-sm">{todayData?.calories?.toFixed(0) || 0} cal</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No meals logged today</p>
              <Link href="/upload" className="inline-flex items-center mt-3 text-blue-400 hover:text-blue-300 text-sm">
                Log your first meal <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Calorie Trend Line Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Calorie Trend</h3>

          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#d1d5db' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <ReferenceLine y={goals.calories} stroke="#6b7280" strokeDasharray="6 4" label={{ value: 'Goal', fill: '#6b7280', fontSize: 11, position: 'right' }} />
                <Line type="monotone" dataKey="calories" stroke={MACRO_COLORS.calories} strokeWidth={2} dot={{ fill: MACRO_COLORS.calories, r: 4 }} activeDot={{ r: 6 }} name="Calories" />
              </LineChart>
            </ResponsiveContainer>
          ) : chartData.length === 1 ? (
            <div className="text-center py-8">
              <div className="text-3xl font-bold text-orange-400 mb-1">{chartData[0]?.calories}</div>
              <p className="text-gray-400 text-sm">calories on {chartData[0]?.date}</p>
              <p className="text-gray-500 text-xs mt-2">Log more days to see trends</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Not enough data for trends</p>
              <p className="text-gray-500 text-sm">Log meals on multiple days to see your trend</p>
            </div>
          )}
        </div>
      </div>

      {/* Macro Trend Chart (full width) */}
      {chartData.length > 1 && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Macronutrient Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} unit="g" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ color: '#d1d5db' }}
                labelStyle={{ color: '#f3f4f6' }}
                formatter={(value: any, name: any) => [`${value}g`, name]}
              />
              <Legend
                wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="protein" stroke={MACRO_COLORS.protein} strokeWidth={2} dot={{ r: 3 }} name="Protein" />
              <Line type="monotone" dataKey="carbs" stroke={MACRO_COLORS.carbs} strokeWidth={2} dot={{ r: 3 }} name="Carbs" />
              <Line type="monotone" dataKey="fat" stroke={MACRO_COLORS.fat} strokeWidth={2} dot={{ r: 3 }} name="Fat" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/upload"
            className="flex items-center space-x-3 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg hover:border-blue-600/40 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-white">Log Meal</div>
              <div className="text-sm text-gray-400">Upload a new meal photo</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/meal-history"
            className="flex items-center space-x-3 p-4 bg-green-600/10 border border-green-600/20 rounded-lg hover:border-green-600/40 transition-colors"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-white">View History</div>
              <div className="text-sm text-gray-400">See all your meals</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/profile"
            className="flex items-center space-x-3 p-4 bg-purple-600/10 border border-purple-600/20 rounded-lg hover:border-purple-600/40 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-white">Set Goals</div>
              <div className="text-sm text-gray-400">Customize your targets</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
}
