'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { useAuth } from './client/ClientAuthProvider';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Clock,
  Utensils,
  Heart,
  Zap,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Calendar,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface NutritionGap {
  nutrient: string;
  current: number;
  target: number;
  percentage: number;
  status: 'low' | 'adequate' | 'high';
  recommendations: string[];
}

interface MealSuggestion {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  tags: string[];
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  reason: string;
}

interface UserPattern {
  preferredMealTimes: string[];
  commonIngredients: string[];
  averageCalories: number;
  macroRatios: {
    protein: number;
    carbs: number;
    fat: number;
  };
  healthTrends: string[];
}

export default function SmartRecommendations() {
  const [loading, setLoading] = useState(true);
  const [nutritionGaps, setNutritionGaps] = useState<NutritionGap[]>([]);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);
  const [userPatterns, setUserPatterns] = useState<UserPattern | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month'>('week');
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id, selectedTimeframe]);
  
  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // Load user's meal history
      const supabase = createClient();
      const daysBack = selectedTimeframe === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const { data: meals, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString());
      
      if (error) {
        console.error('Error loading meals:', error);
        return;
      }
      
      // Analyze user patterns
      const patterns = analyzeUserPatterns(meals || []);
      setUserPatterns(patterns);
      
      // Calculate nutrition gaps
      const gaps = calculateNutritionGaps(meals || [], patterns);
      setNutritionGaps(gaps);
      
      // Generate meal suggestions
      const suggestions = generateMealSuggestions(patterns, gaps);
      setMealSuggestions(suggestions);
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const analyzeUserPatterns = (meals: any[]): UserPattern => {
    if (meals.length === 0) {
      return {
        preferredMealTimes: [],
        commonIngredients: [],
        averageCalories: 0,
        macroRatios: { protein: 25, carbs: 45, fat: 30 },
        healthTrends: []
      };
    }
    
    // Analyze meal times
    const mealTimes = meals.map(meal => {
      const hour = new Date(meal.created_at).getHours();
      if (hour < 10) return 'breakfast';
      if (hour < 15) return 'lunch';
      if (hour < 20) return 'dinner';
      return 'snack';
    });
    
    const timeFrequency = mealTimes.reduce((acc, time) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const preferredMealTimes = Object.entries(timeFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([time]) => time);
    
    // Calculate average nutrition
    const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
    
    const averageCalories = totalCalories / meals.length;
    const totalMacros = totalProtein + totalCarbs + totalFat;
    
    const macroRatios = {
      protein: totalMacros > 0 ? (totalProtein / totalMacros) * 100 : 25,
      carbs: totalMacros > 0 ? (totalCarbs / totalMacros) * 100 : 45,
      fat: totalMacros > 0 ? (totalFat / totalMacros) * 100 : 30
    };
    
    // Extract common ingredients (simplified)
    const ingredients = meals
      .flatMap(meal => meal.foods_identified || [])
      .reduce((acc, ingredient) => {
        acc[ingredient] = (acc[ingredient] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const commonIngredients = Object.entries(ingredients)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([ingredient]) => ingredient);
    
    // Analyze health trends
    const avgHealthScore = meals.reduce((sum, meal) => sum + (meal.health_score || 0), 0) / meals.length;
    const healthTrends = [];
    
    if (avgHealthScore > 7) healthTrends.push('healthy-eating');
    if (macroRatios.protein > 30) healthTrends.push('high-protein');
    if (averageCalories < 1800) healthTrends.push('calorie-conscious');
    
    return {
      preferredMealTimes,
      commonIngredients,
      averageCalories,
      macroRatios,
      healthTrends
    };
  };
  
  const calculateNutritionGaps = (meals: any[], patterns: UserPattern): NutritionGap[] => {
    const dailyTargets = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 70,
      fiber: 25,
      vitamin_c: 90,
      iron: 18
    };
    
    const gaps: NutritionGap[] = [];
    
    // Calculate current averages
    const daysCount = Math.max(1, Math.ceil(meals.length / 3)); // Assuming 3 meals per day
    
    Object.entries(dailyTargets).forEach(([nutrient, target]) => {
      const total = meals.reduce((sum, meal) => sum + (meal[nutrient] || 0), 0);
      const current = total / daysCount;
      const percentage = (current / target) * 100;
      
      let status: 'low' | 'adequate' | 'high';
      if (percentage < 70) status = 'low';
      else if (percentage > 130) status = 'high';
      else status = 'adequate';
      
      if (status !== 'adequate') {
        gaps.push({
          nutrient: nutrient.replace('_', ' ').toUpperCase(),
          current: Math.round(current),
          target,
          percentage: Math.round(percentage),
          status,
          recommendations: getRecommendationsForNutrient(nutrient, status)
        });
      }
    });
    
    return gaps.slice(0, 5); // Show top 5 gaps
  };
  
  const getRecommendationsForNutrient = (nutrient: string, status: 'low' | 'high'): string[] => {
    const recommendations: Record<string, Record<string, string[]>> = {
      protein: {
        low: ['Add lean meats, fish, or legumes', 'Include Greek yogurt or cottage cheese', 'Try protein smoothies'],
        high: ['Reduce meat portions', 'Add more vegetables', 'Balance with complex carbs']
      },
      fiber: {
        low: ['Eat more whole grains', 'Include fruits and vegetables', 'Add beans and lentils'],
        high: ['Increase gradually', 'Drink more water', 'Balance with other nutrients']
      },
      calories: {
        low: ['Add healthy fats like nuts', 'Include nutrient-dense snacks', 'Increase portion sizes'],
        high: ['Focus on vegetables', 'Reduce processed foods', 'Practice portion control']
      }
    };
    
    return recommendations[nutrient]?.[status] || ['Consult with a nutritionist for personalized advice'];
  };
  
  const generateMealSuggestions = (patterns: UserPattern, gaps: NutritionGap[]): MealSuggestion[] => {
    const mealDatabase: MealSuggestion[] = [
      {
        id: '1',
        name: 'Protein Power Bowl',
        description: 'Quinoa bowl with grilled chicken, black beans, and avocado',
        calories: 520,
        protein: 35,
        carbs: 45,
        fat: 18,
        healthScore: 8.5,
        tags: ['high-protein', 'balanced', 'filling'],
        timeOfDay: 'lunch',
        reason: 'Boosts protein intake while maintaining balance'
      },
      {
        id: '2',
        name: 'Mediterranean Breakfast',
        description: 'Greek yogurt with berries, nuts, and honey',
        calories: 340,
        protein: 20,
        carbs: 35,
        fat: 12,
        healthScore: 9.0,
        tags: ['antioxidants', 'protein', 'healthy-fats'],
        timeOfDay: 'breakfast',
        reason: 'Rich in protein and antioxidants for a healthy start'
      },
      {
        id: '3',
        name: 'Salmon & Vegetables',
        description: 'Baked salmon with roasted vegetables and sweet potato',
        calories: 480,
        protein: 32,
        carbs: 28,
        fat: 22,
        healthScore: 8.8,
        tags: ['omega-3', 'vitamin-rich', 'anti-inflammatory'],
        timeOfDay: 'dinner',
        reason: 'Excellent source of omega-3 and essential nutrients'
      },
      {
        id: '4',
        name: 'Green Smoothie Bowl',
        description: 'Spinach, banana, and protein powder topped with granola',
        calories: 290,
        protein: 25,
        carbs: 30,
        fat: 8,
        healthScore: 8.2,
        tags: ['vitamins', 'minerals', 'energizing'],
        timeOfDay: 'breakfast',
        reason: 'Packed with vitamins and minerals for energy'
      },
      {
        id: '5',
        name: 'Lentil Curry',
        description: 'Red lentil curry with brown rice and vegetables',
        calories: 420,
        protein: 18,
        carbs: 65,
        fat: 8,
        healthScore: 8.0,
        tags: ['fiber', 'plant-based', 'satisfying'],
        timeOfDay: 'dinner',
        reason: 'High fiber and plant-based protein'
      }
    ];
    
    // Filter and score suggestions based on user patterns and gaps
    return mealDatabase
      .map(meal => {
        let score = meal.healthScore;
        
        // Boost score for preferred meal times
        if (patterns.preferredMealTimes.includes(meal.timeOfDay)) {
          score += 1;
        }
        
        // Boost score for addressing nutrition gaps
        gaps.forEach(gap => {
          if (gap.status === 'low') {
            if (gap.nutrient === 'PROTEIN' && meal.protein > 25) score += 1.5;
            if (gap.nutrient === 'FIBER' && meal.tags.includes('fiber')) score += 1.5;
            if (gap.nutrient === 'CALORIES' && meal.calories > 400) score += 1;
          }
        });
        
        // Boost score for health trends
        patterns.healthTrends.forEach(trend => {
          if (meal.tags.some(tag => tag.includes(trend.replace('-', '')))) {
            score += 0.5;
          }
        });
        
        return { ...meal, healthScore: score };
      })
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 4);
  };
  
  const refreshRecommendations = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Smart Recommendations</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Lightbulb className="w-6 h-6 mr-2 text-yellow-400" />
            Smart Recommendations
          </h2>
          <p className="text-gray-400">Personalized suggestions based on your nutrition patterns</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
          
          <button
            onClick={refreshRecommendations}
            disabled={refreshing}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Nutrition Gaps */}
      {nutritionGaps.length > 0 && (
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-orange-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Nutrition Gaps</h3>
          </div>
          
          <div className="space-y-3">
            {nutritionGaps.map((gap, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{gap.nutrient}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    gap.status === 'low' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {gap.percentage}% of target
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                  <span>Current: {gap.current}</span>
                  <span>Target: {gap.target}</span>
                </div>
                
                <div className="space-y-1">
                  {gap.recommendations.slice(0, 2).map((rec, i) => (
                    <div key={i} className="text-sm text-gray-300 flex items-start">
                      <ChevronRight className="w-3 h-3 mt-0.5 mr-1 text-orange-400 flex-shrink-0" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Meal Suggestions */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Utensils className="w-5 h-5 text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Recommended Meals</h3>
          </div>
          
          {userPatterns && (
            <div className="text-sm text-gray-400">
              Based on {selectedTimeframe === 'week' ? 'weekly' : 'monthly'} patterns
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mealSuggestions.map((meal) => (
            <div key={meal.id} className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white mb-1">{meal.name}</h4>
                  <p className="text-sm text-gray-400 mb-2">{meal.description}</p>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <Heart className="w-3 h-3 text-red-400" />
                  <span className="text-white">{meal.healthScore.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-sm font-medium text-orange-400">{meal.calories}</div>
                  <div className="text-xs text-gray-500">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-400">{meal.protein}g</div>
                  <div className="text-xs text-gray-500">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-green-400">{meal.carbs}g</div>
                  <div className="text-xs text-gray-500">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-yellow-400">{meal.fat}g</div>
                  <div className="text-xs text-gray-500">Fat</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400 capitalize">{meal.timeOfDay}</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {meal.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-start">
                  <Lightbulb className="w-3 h-3 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-xs text-gray-300">{meal.reason}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {mealSuggestions.length === 0 && (
          <div className="text-center py-8">
            <Utensils className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No recommendations available</p>
            <p className="text-gray-500 text-sm">Log more meals to get personalized suggestions</p>
          </div>
        )}
      </div>
      
      {/* User Patterns Summary */}
      {userPatterns && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Your Patterns</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Avg Calories</div>
              <div className="text-lg font-medium text-orange-400">
                {Math.round(userPatterns.averageCalories)}
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Protein Ratio</div>
              <div className="text-lg font-medium text-blue-400">
                {Math.round(userPatterns.macroRatios.protein)}%
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Preferred Time</div>
              <div className="text-lg font-medium text-green-400 capitalize">
                {userPatterns.preferredMealTimes[0] || 'N/A'}
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Health Focus</div>
              <div className="text-lg font-medium text-purple-400">
                {userPatterns.healthTrends[0]?.replace('-', ' ') || 'General'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 