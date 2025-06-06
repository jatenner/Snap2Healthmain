'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { useAuth } from './client/ClientAuthProvider';
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Award,
  Flame,
  BarChart3,
  PieChart,
  Activity,
  Heart,
  Zap,
  Clock,
  ChevronRight,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

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

export default function NutritionDashboard() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<NutritionData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [todayData, setTodayData] = useState<NutritionData | null>(null);
  const [goals, setGoals] = useState<Goals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('week');
  
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.id) {
      loadNutritionData();
    }
  }, [user?.id, selectedTimeframe]);
  
  const loadNutritionData = async () => {
    try {
      setLoading(true);
      
      // Get date range based on selected timeframe
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
      
      // Load data from Supabase
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
          dailyData[date] = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            health_score: 0,
            date
          };
        }
        
        // Aggregate nutrition data
        dailyData[date].calories += meal.calories || 0;
        dailyData[date].protein += meal.protein || 0;
        dailyData[date].carbs += meal.carbs || 0;
        dailyData[date].fat += meal.fat || 0;
        dailyData[date].fiber += meal.fiber || 0;
        dailyData[date].sugar += meal.sugar || 0;
        dailyData[date].sodium += meal.sodium || 0;
        
        // Average health score
        if (meal.health_score) {
          dailyData[date].health_score = (dailyData[date].health_score + meal.health_score) / 2;
        }
      });
      
      const processedData = Object.values(dailyData);
      setWeeklyData(processedData);
      
      // Set today's data
      const todayString = format(today, 'yyyy-MM-dd');
      setTodayData(dailyData[todayString] || null);
      
      // Calculate weekly stats
      if (processedData.length > 0) {
        const stats = calculateWeeklyStats(processedData);
        setWeeklyStats(stats);
      }
      
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateWeeklyStats = (data: NutritionData[]): WeeklyStats => {
    const totalCalories = data.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = data.reduce((sum, day) => sum + day.protein, 0);
    const totalCarbs = data.reduce((sum, day) => sum + day.carbs, 0);
    const totalFat = data.reduce((sum, day) => sum + day.fat, 0);
    const avgHealthScore = data.reduce((sum, day) => sum + (day.health_score || 0), 0) / data.length;
    
    const bestDay = data.reduce((best, day) => 
      (day.health_score || 0) > (best.health_score || 0) ? day : best
    );
    
    const worstDay = data.reduce((worst, day) => 
      (day.health_score || 0) < (worst.health_score || 0) ? day : worst
    );
    
    return {
      totalCalories,
      avgCalories: totalCalories / data.length,
      totalProtein,
      totalCarbs,
      totalFat,
      avgHealthScore,
      mealsLogged: data.length,
      bestDay: bestDay.date,
      worstDay: worstDay.date
    };
  };
  
  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };
  
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
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with timeframe selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Nutrition Dashboard</h1>
          <p className="text-gray-400">Track your nutrition goals and progress</p>
        </div>
        
        <div className="flex bg-gray-800 rounded-lg p-1">
          {['today', 'week', 'month'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Calories */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-gray-300 font-medium">Calories</span>
            </div>
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {todayData?.calories?.toFixed(0) || 0}
              </span>
              <span className="text-gray-400">/ {goals.calories}</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getProgressColor(getProgressPercentage(todayData?.calories || 0, goals.calories))
                }`}
                style={{ width: `${getProgressPercentage(todayData?.calories || 0, goals.calories)}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500">
              {getProgressPercentage(todayData?.calories || 0, goals.calories).toFixed(0)}% of daily goal
            </p>
          </div>
        </div>
        
        {/* Protein */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 font-medium">Protein</span>
            </div>
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {todayData?.protein?.toFixed(0) || 0}g
              </span>
              <span className="text-gray-400">/ {goals.protein}g</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getProgressColor(getProgressPercentage(todayData?.protein || 0, goals.protein))
                }`}
                style={{ width: `${getProgressPercentage(todayData?.protein || 0, goals.protein)}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500">
              {getProgressPercentage(todayData?.protein || 0, goals.protein).toFixed(0)}% of daily goal
            </p>
          </div>
        </div>
        
        {/* Health Score */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-green-400" />
              <span className="text-gray-300 font-medium">Health Score</span>
            </div>
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {todayData?.health_score?.toFixed(1) || 'N/A'}
              </span>
              <span className="text-gray-400">/ 10</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${((todayData?.health_score || 0) / 10) * 100}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500">
              {todayData?.health_score ? 'Great job!' : 'Log meals to see score'}
            </p>
          </div>
        </div>
        
        {/* Weekly Progress */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 font-medium">Weekly Avg</span>
            </div>
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {weeklyStats?.avgCalories?.toFixed(0) || 0}
              </span>
              <span className="text-gray-400">cal/day</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-300"
                style={{ width: `${getProgressPercentage(weeklyStats?.avgCalories || 0, goals.calories)}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500">
              {weeklyStats?.mealsLogged || 0} meals logged this week
            </p>
          </div>
        </div>
      </div>
      
      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macronutrient Breakdown */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Today's Macros</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          
          {todayData ? (
            <div className="space-y-4">
              {/* Protein */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">Protein</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-medium">{todayData.protein.toFixed(0)}g</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({((todayData.protein * 4) / Math.max(todayData.calories, 1) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              {/* Carbohydrates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Carbs</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-medium">{todayData.carbs.toFixed(0)}g</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({((todayData.carbs * 4) / Math.max(todayData.calories, 1) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              {/* Fat */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Fat</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-medium">{todayData.fat.toFixed(0)}g</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({((todayData.fat * 9) / Math.max(todayData.calories, 1) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No meals logged today</p>
              <Link
                href="/upload"
                className="inline-flex items-center mt-3 text-blue-400 hover:text-blue-300"
              >
                Log your first meal
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
        
        {/* Weekly Trends */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Weekly Trends</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          
          {weeklyStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {weeklyStats.avgHealthScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">Avg Health Score</div>
                </div>
                
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {weeklyStats.mealsLogged}
                  </div>
                  <div className="text-xs text-gray-400">Meals Logged</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Best Day</span>
                  <span className="text-green-400 font-medium">
                    {format(new Date(weeklyStats.bestDay), 'MMM d')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Protein</span>
                  <span className="text-blue-400 font-medium">
                    {weeklyStats.totalProtein.toFixed(0)}g
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Avg Calories</span>
                  <span className="text-orange-400 font-medium">
                    {weeklyStats.avgCalories.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Not enough data for trends</p>
              <p className="text-gray-500 text-sm">Log more meals to see insights</p>
            </div>
          )}
        </div>
      </div>
      
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