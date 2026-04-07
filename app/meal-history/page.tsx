'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../components/client/ClientAuthProvider';
import AuthGate from '../components/AuthGate';
import { createClient } from '../lib/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Calendar,
  Clock,
  Utensils,
  TrendingUp,
  Eye,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  Coffee,
  Wine,
  Pill,
  Droplets,
  Cookie,
  MessageSquare
} from 'lucide-react';
import { formatTimeEST, getRelativeDateEST, formatDateEST } from '../lib/utils';

interface MealHistoryEntry {
  id: string;
  meal_name: string;
  meal_description?: string;
  image_url: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  goal?: string;
  created_at: string;
  intake_type?: string;
  confidence_score?: number;
  meal_tags?: string[];
}

interface ContextEvent {
  id: string;
  event_type: string;
  value: string;
  numeric_value: number;
  event_time: string;
  source: string;
}

interface DayGroup {
  date: string;
  displayDate: string;
  meals: MealHistoryEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// Optimized grouping with memoization
const groupMealsByDate = (meals: MealHistoryEntry[]): DayGroup[] => {
  const grouped: Record<string, MealHistoryEntry[]> = {};
  
  meals.forEach(meal => {
    // Group by user's local date
    const userTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'America/New_York'; } })();
    const date = new Date(meal.created_at).toLocaleDateString('en-CA', {
      timeZone: userTz
    }) || 'unknown';
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(meal);
  });
  
  return Object.entries(grouped)
    .map(([date, dateMeals]) => {
      const totalCalories = dateMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = dateMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
      const totalCarbs = dateMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
      const totalFat = dateMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
      
      // Fix: Create date in local timezone instead of UTC to show correct day of week
      const dateParts = date.split('-').map(Number);
      const year = dateParts[0] || 2025;
      const month = dateParts[1] || 1;
      const day = dateParts[2] || 1;
      const localDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
      
      let displayDate: string;
      
      if (dateParts.length === 3 && dateParts.every(part => !isNaN(part))) {
        displayDate = localDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else {
        // Fallback to old method if date parsing fails
        displayDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      return {
        date,
        displayDate,
        meals: dateMeals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Optimized time formatting
const formatTime = (timestamp: string) => {
  return formatTimeEST(timestamp);
};

// Optimized relative date calculation
const getRelativeDate = (date: string) => {
  return getRelativeDateEST(date);
};

// Create optimized Supabase client with safe fallback
const supabase = createClient();

// Lazy loading image component
const LazyMealImage = ({ src, alt, mealName }: { src: string; alt: string; mealName: string }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative h-40 w-full bg-slate-700/50 rounded-t-lg overflow-hidden">
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {!imageError ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-700/50">
          <div className="text-center">
            <Utensils className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">{mealName}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function MealHistoryPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateRange, setDateRange] = useState<number | null>(null); // null = all, 3/7/30
  const [nutritionSummaries, setNutritionSummaries] = useState<any[]>([]);

  const ITEMS_PER_PAGE = 20;

  // Filter meals by date range
  const filteredMeals = useMemo(() => {
    if (dateRange === null) return meals;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    return meals.filter(m => new Date(m.created_at) >= cutoff);
  }, [meals, dateRange]);

  // Memoized grouped meals from filtered set
  const groupedMeals = useMemo(() => groupMealsByDate(filteredMeals), [filteredMeals]);

  // Compute range summary from filtered meals
  const rangeSummary = useMemo(() => {
    if (filteredMeals.length === 0) return null;
    const days = groupedMeals.length || 1;
    return {
      avgDailyCal: Math.round(filteredMeals.reduce((s, m) => s + (m.calories || 0), 0) / days),
      avgDailyProtein: Math.round(filteredMeals.reduce((s, m) => s + (m.protein || 0), 0) / days),
      avgDailyCarbs: Math.round(filteredMeals.reduce((s, m) => s + (m.carbs || 0), 0) / days),
      avgDailyFat: Math.round(filteredMeals.reduce((s, m) => s + (m.fat || 0), 0) / days),
      mealsPerDay: (filteredMeals.length / days).toFixed(1),
      totalMeals: filteredMeals.length,
      totalDays: days,
    };
  }, [filteredMeals, groupedMeals]);

  // Fetch nutrition summaries for micro averages when dateRange changes
  useEffect(() => {
    if (!user || dateRange === null) { setNutritionSummaries([]); return; }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    supabase
      .from('daily_nutrition_summaries')
      .select('total_vitamin_d, total_vitamin_c, total_magnesium, total_iron, total_zinc, total_calcium, total_potassium')
      .eq('user_id', user.id)
      .gte('summary_date', cutoffStr)
      .order('summary_date', { ascending: false })
      .then(({ data }: { data: any }) => setNutritionSummaries(data || []));
  }, [user, dateRange]);

  const microAvgs = useMemo(() => {
    if (nutritionSummaries.length === 0) return null;
    const n = nutritionSummaries.length;
    const avg = (f: string) => Math.round(nutritionSummaries.reduce((s: number, r: any) => s + (r[f] || 0), 0) / n);
    return { vitD: avg('total_vitamin_d'), vitC: avg('total_vitamin_c'), mag: avg('total_magnesium'), iron: avg('total_iron'), zinc: avg('total_zinc') };
  }, [nutritionSummaries]);

  const fetchMealHistory = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      // Check if Supabase client is available
      if (!supabase) {
        setError('Database connection not available in development mode');
        setMeals([]); // Set empty meals for development
        return;
      }
      
      // Optimized query - only fetch essential fields
      const { data, error } = await supabase
        .from('meals')
        .select(`
          id,
          meal_name,
          meal_description,
          image_url,
          calories,
          protein,
          fat,
          carbs,
          goal,
          created_at,
          intake_type,
          confidence_score,
          meal_tags
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching meals:', error);
        setError('Failed to load meal history');
        return;
      }

      const newMeals = data || [];
      
      if (append) {
        setMeals(prev => [...prev, ...newMeals]);
      } else {
        setMeals(newMeals);
      }
      
      // Check if there are more items
      setHasMore(newMeals.length === ITEMS_PER_PAGE);
      setPage(pageNum);
      
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load meal history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchMealHistory(0, false);
    }
  }, [user, fetchMealHistory]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchMealHistory(page + 1, true);
    }
  }, [fetchMealHistory, page, loadingMore, hasMore]);

  const deleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal analysis?')) {
      return;
    }

    if (!supabase) {
      alert('Database operations not available in development mode');
      return;
    }

    try {
      setDeletingId(mealId);
      
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting meal:', error);
        alert('Failed to delete meal');
        return;
      }

      // Remove from local state
      setMeals(meals.filter(meal => meal.id !== mealId));
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete meal');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleDay = useCallback((date: string) => {
    setExpandedDays(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(date)) {
        newExpanded.delete(date);
      } else {
        newExpanded.add(date);
      }
      return newExpanded;
    });
  }, []);

  if (!user) {
    return <AuthGate>{null}</AuthGate>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your meal history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Error Loading History</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <Button onClick={() => fetchMealHistory(0, false)} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Simplified Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-2">
              Health Timeline
            </h1>
            <p className="text-slate-300">Track your nutrition journey day by day</p>
          </div>
          <Link href="/upload">
            <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Analyze New Meal
            </Button>
          </Link>
        </div>

        {/* Date range filter */}
        <div className="flex gap-2 mb-4">
          {([3, 7, 30, null] as const).map(d => (
            <button
              key={d ?? 'all'}
              onClick={() => setDateRange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dateRange === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {d ? `${d} days` : 'All'}
            </button>
          ))}
        </div>

        {/* Range summary card */}
        {rangeSummary && dateRange !== null && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-400 mb-2">{rangeSummary.totalDays} days &middot; {rangeSummary.totalMeals} meals &middot; {rangeSummary.mealsPerDay} meals/day avg</p>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{rangeSummary.avgDailyCal}</div>
                <div className="text-[10px] text-slate-400">cal/day</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{rangeSummary.avgDailyProtein}g</div>
                <div className="text-[10px] text-slate-400">protein</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">{rangeSummary.avgDailyCarbs}g</div>
                <div className="text-[10px] text-slate-400">carbs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-pink-400">{rangeSummary.avgDailyFat}g</div>
                <div className="text-[10px] text-slate-400">fat</div>
              </div>
            </div>
            {microAvgs && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700">
                <span className="text-[10px] text-slate-400">Avg daily micros:</span>
                <span className="text-[10px] text-slate-300">D: {microAvgs.vitD}mcg</span>
                <span className="text-[10px] text-slate-300">C: {microAvgs.vitC}mg</span>
                <span className="text-[10px] text-slate-300">Mg: {microAvgs.mag}mg</span>
                <span className="text-[10px] text-slate-300">Fe: {microAvgs.iron}mg</span>
                <span className="text-[10px] text-slate-300">Zn: {microAvgs.zinc}mg</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {meals.length === 0 ? (
          <Card className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Utensils className="h-10 w-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">No meal history found</h2>
              <p className="text-slate-400 mb-8">Start your nutrition journey by analyzing your first meal</p>
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Analyze Your First Meal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedMeals.map((dayGroup) => {
              const isExpanded = expandedDays.has(dayGroup.date);
              const relativeDate = getRelativeDate(dayGroup.date);
              
              return (
                <Card key={dayGroup.date} className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 overflow-hidden">
                  {/* Day Header - Clickable */}
                  <button
                    onClick={() => toggleDay(dayGroup.date)}
                    className="w-full p-6 text-left hover:bg-slate-700/30 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-blue-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          )}
                          <Calendar className="h-5 w-5 text-blue-400" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold text-slate-100">
                              {relativeDate || dayGroup.displayDate}
                            </h2>
                            {relativeDate && (
                              <span className="text-sm text-slate-400">
                                {dayGroup.displayDate}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            {dayGroup.meals.length} meal{dayGroup.meals.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Day Summary Stats */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4 text-orange-400" />
                            <span className="text-slate-300">{dayGroup.totalCalories}</span>
                            <span className="text-slate-500">cal</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-green-400" />
                            <span className="text-slate-300">{Math.round(dayGroup.totalProtein)}g</span>
                            <span className="text-slate-500">protein</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4 text-blue-400" />
                            <span className="text-slate-300">{Math.round(dayGroup.totalCarbs)}g</span>
                            <span className="text-slate-500">carbs</span>
                          </div>
                        </div>
                        
                        <div className="w-8 h-8 bg-slate-700/50 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-300">
                            {dayGroup.meals.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expandable Meals Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/50 bg-slate-900/30">
                      <div className="p-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {dayGroup.meals.map((meal) => (
                            <Card key={meal.id} className="bg-slate-800/70 border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 group">
                              <CardContent className="p-0">
                                {/* Lazy Loaded Meal Image */}
                                <LazyMealImage 
                                  src={meal.image_url} 
                                  alt={meal.meal_name || 'Meal'} 
                                  mealName={meal.meal_name || 'Untitled Meal'}
                                />
                                
                                <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm rounded-full px-2 py-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-slate-300" />
                                    <span className="text-xs text-slate-300">{formatTime(meal.created_at)}</span>
                                  </div>
                                </div>

                                {/* Meal Info */}
                                <div className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    {meal.intake_type === 'drink' && <Coffee className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                                    {meal.intake_type === 'alcohol' && <Wine className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                                    {meal.intake_type === 'supplement' && <Pill className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                                    {meal.intake_type === 'hydration' && <Droplets className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                                    {meal.intake_type === 'snack' && <Cookie className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                                    {(!meal.intake_type || meal.intake_type === 'meal') && <Utensils className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                                    <h3 className="font-semibold text-slate-100 line-clamp-1">
                                      {meal.meal_name || 'Untitled Meal'}
                                    </h3>
                                    {meal.confidence_score != null && (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                        meal.confidence_score >= 80 ? 'bg-emerald-500/20 text-emerald-400'
                                        : meal.confidence_score >= 60 ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-red-500/20 text-red-400'
                                      }`}>{meal.confidence_score}%</span>
                                    )}
                                  </div>

                                  {/* Tags */}
                                  {meal.meal_tags && meal.meal_tags.length > 0 && (
                                    <div className="flex gap-1 mb-2">
                                      {meal.meal_tags.slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-600/50 text-slate-300">
                                          {tag.replace(/_/g, ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {meal.meal_description && (
                                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                                      {meal.meal_description}
                                    </p>
                                  )}

                                  {/* Nutrition Summary */}
                                  <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
                                    <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                                      <div className="font-semibold text-slate-100">{meal.calories}</div>
                                      <div className="text-slate-400">Calories</div>
                                    </div>
                                    <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                                      <div className="font-semibold text-slate-100">{meal.protein}g</div>
                                      <div className="text-slate-400">Protein</div>
                                    </div>
                                    <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                                      <div className="font-semibold text-slate-100">{meal.carbs}g</div>
                                      <div className="text-slate-400">Carbs</div>
                                    </div>
                                    <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                                      <div className="font-semibold text-slate-100">{meal.fat}g</div>
                                      <div className="text-slate-400">Fat</div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <Link href={`/meal/${meal.id}`} className="flex-1">
                                      <Button variant="outline" size="sm" className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-100 border-slate-600/50">
                                        <Eye className="h-3 w-3 mr-1" />
                                        View Analysis
                                      </Button>
                                    </Link>
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => deleteMeal(meal.id)}
                                      disabled={deletingId === meal.id}
                                      className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border-red-600/20"
                                    >
                                      {deletingId === meal.id ? (
                                        <div className="h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-100 border-slate-600/50"
                >
                  {loadingMore ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading more...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Load More Meals
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 