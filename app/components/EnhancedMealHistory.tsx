'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { useAuth } from './client/ClientAuthProvider';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Calendar, 
  Grid3X3, 
  List, 
  ChevronDown, 
  Flame, 
  Clock,
  ArrowUp,
  ArrowDown,
  Star,
  MoreVertical,
  Eye,
  Trash2
} from 'lucide-react';

interface Meal {
  id: string;
  mealName: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  created_at: string;
  tags?: string[];
  health_score?: number;
}

interface FilterOptions {
  timeRange: 'today' | 'week' | 'month' | 'all';
  calorieRange: 'any' | 'low' | 'medium' | 'high';
  healthScore: 'any' | 'excellent' | 'good' | 'fair';
}

interface EnhancedMealHistoryProps {
  searchTerm?: string;
  limit?: number;
  showTitle?: boolean;
  embedded?: boolean;
}

// Helper function to normalize image URLs
const normalizeImageUrl = (url: string | undefined): string => {
  if (!url) return '/placeholder-meal.jpg';
  
  if (url.includes('supabase.co') || url.includes('supabase.in')) {
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    return url;
  }
  
  if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('http')) {
    return url;
  }
  
  return url;
};

// Helper function to get relative date
const getRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

// Helper function to get health score color
const getHealthScoreColor = (score?: number) => {
  if (!score) return 'text-gray-400';
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-yellow-400';
  return 'text-red-400';
};

// Helper function to get calorie category
const getCalorieCategory = (calories?: number) => {
  if (!calories) return 'unknown';
  if (calories < 300) return 'low';
  if (calories < 600) return 'medium';
  return 'high';
};

export default function EnhancedMealHistory({ 
  searchTerm: externalSearchTerm = '', 
  limit = 0,
  showTitle = true,
  embedded = false
}: EnhancedMealHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'calories' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: 'all',
    calorieRange: 'any',
    healthScore: 'any'
  });
  
  const { user } = useAuth();
  
  const loadMeals = async () => {
    if (!user?.id) {
      setError('Please log in to view your meal history');
      setLoading(false);
      return;
    }
    
    try {
      const userId = user.id;
      let combinedMeals: Meal[] = [];
      
      // Fetch from Supabase
      try {
        const supabase = createClient();
        const { data: dbMeals, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (!error && dbMeals && dbMeals.length > 0) {
          const formattedDbMeals = dbMeals.map((meal: any) => ({
            id: meal.id,
            mealName: meal.caption || meal.name || 'Analyzed Meal',
            imageUrl: normalizeImageUrl(meal.image_url),
            calories: meal.calories || meal.analysis?.calories || 0,
            protein: meal.protein || meal.analysis?.protein || 0,
            carbs: meal.carbs || meal.analysis?.carbs || 0,
            fat: meal.fat || meal.analysis?.fat || 0,
            created_at: meal.created_at,
            tags: meal.tags || [],
            health_score: meal.health_score || meal.analysis?.health_score
          }));
          
          combinedMeals = [...formattedDbMeals];
        }
      } catch (dbError) {
        console.error('Error fetching meals from database:', dbError);
      }
      
      // Get from localStorage
      try {
        const localStorageKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('meal_analysis_') && !key.includes('template')
        );
        
        const localMeals = localStorageKeys
          .map(key => {
            try {
              const mealData = JSON.parse(localStorage.getItem(key) || '{}');
              
              if (combinedMeals.some(m => m.id === mealData.id)) {
                return null;
              }
              
              return {
                id: mealData.id || key.replace('meal_analysis_', ''),
                mealName: mealData.mealName || 'Analyzed Meal',
                imageUrl: mealData.imageUrl,
                calories: mealData.analysis?.calories || 0,
                protein: mealData.analysis?.protein || 0,
                carbs: mealData.analysis?.carbs || 0,
                fat: mealData.analysis?.fat || 0,
                created_at: mealData.created_at || new Date().toISOString(),
                tags: mealData.tags || [],
                health_score: mealData.analysis?.health_score
              };
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);
          
        if (localMeals.length > 0) {
          combinedMeals = [...combinedMeals, ...localMeals as Meal[]];
        }
      } catch (localStorageError) {
        console.error('Error reading meals from localStorage:', localStorageError);
      }
      
      setMeals(combinedMeals);
    } catch (err) {
      console.error('Error loading meals:', err);
      setError('Failed to load meal history. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter and sort meals
  useEffect(() => {
    let filtered = [...meals];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(meal => 
        meal.mealName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply time range filter
    const now = new Date();
    if (filters.timeRange !== 'all') {
      filtered = filtered.filter(meal => {
        const mealDate = new Date(meal.created_at);
        const diffTime = now.getTime() - mealDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        switch (filters.timeRange) {
          case 'today':
            return isToday(mealDate);
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }
    
    // Apply calorie range filter
    if (filters.calorieRange !== 'any') {
      filtered = filtered.filter(meal => {
        const category = getCalorieCategory(meal.calories);
        return category === filters.calorieRange;
      });
    }
    
    // Apply health score filter
    if (filters.healthScore !== 'any') {
      filtered = filtered.filter(meal => {
        const score = meal.health_score || 0;
        switch (filters.healthScore) {
          case 'excellent':
            return score >= 8;
          case 'good':
            return score >= 6 && score < 8;
          case 'fair':
            return score < 6;
          default:
            return true;
        }
      });
    }
    
    // Sort meals
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'calories':
          comparison = (a.calories || 0) - (b.calories || 0);
          break;
        case 'score':
          comparison = (a.health_score || 0) - (b.health_score || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Apply limit if specified
    if (limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    
    setFilteredMeals(filtered);
  }, [meals, searchTerm, filters, sortBy, sortOrder, limit]);
  
  useEffect(() => {
    loadMeals();
  }, [user?.id]);
  
  useEffect(() => {
    setSearchTerm(externalSearchTerm);
  }, [externalSearchTerm]);
  
  const toggleSort = (field: 'date' | 'calories' | 'score') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  if (loading) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Recent Meals</h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-700/50 rounded-lg p-4 animate-pulse">
              <div className="w-full h-32 bg-gray-600 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }
  
  const MealCard = ({ meal }: { meal: Meal }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 group">
      <Link href={`/analysis/${meal.id}`}>
        <div className="relative">
          <Image
            src={normalizeImageUrl(meal.imageUrl)}
            alt={meal.mealName}
            width={300}
            height={200}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-meal.jpg';
            }}
          />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
            <div className="flex items-center space-x-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-white font-medium">
                {meal.calories || 0}
              </span>
            </div>
          </div>
          {meal.health_score && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
              <div className="flex items-center space-x-1">
                <Star className={`w-3 h-3 ${getHealthScoreColor(meal.health_score)}`} />
                <span className="text-xs text-white font-medium">
                  {meal.health_score.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
            {meal.mealName}
          </h3>
          
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{getRelativeDate(meal.created_at)}</span>
            </div>
            <span className="text-xs">
              {formatDistanceToNow(new Date(meal.created_at), { addSuffix: true })}
            </span>
          </div>
          
          {(meal.protein || meal.carbs || meal.fat) && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>P: {Math.round(meal.protein || 0)}g</span>
              <span>C: {Math.round(meal.carbs || 0)}g</span>
              <span>F: {Math.round(meal.fat || 0)}g</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
  
  const MealListItem = ({ meal }: { meal: Meal }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 hover:border-blue-500/30 transition-all duration-300">
      <Link href={`/analysis/${meal.id}`} className="flex items-center space-x-4">
        <Image
          src={normalizeImageUrl(meal.imageUrl)}
          alt={meal.mealName}
          width={80}
          height={80}
          className="w-20 h-20 object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-meal.jpg';
          }}
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white mb-1 truncate">
            {meal.mealName}
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
            <div className="flex items-center space-x-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>{meal.calories || 0} cal</span>
            </div>
            {meal.health_score && (
              <div className="flex items-center space-x-1">
                <Star className={`w-3 h-3 ${getHealthScoreColor(meal.health_score)}`} />
                <span>{meal.health_score.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{getRelativeDate(meal.created_at)}</span>
            </div>
          </div>
          
          {(meal.protein || meal.carbs || meal.fat) && (
            <div className="flex space-x-4 text-xs text-gray-500">
              <span>Protein: {Math.round(meal.protein || 0)}g</span>
              <span>Carbs: {Math.round(meal.carbs || 0)}g</span>
              <span>Fat: {Math.round(meal.fat || 0)}g</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-gray-400">
          <Eye className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
  
  return (
    <div className={`${embedded ? '' : 'bg-gray-800/30'} rounded-lg p-6`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">
            Meal History 
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({filteredMeals.length} meals)
            </span>
          </h2>
          
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({...filters, timeRange: e.target.value as any})}
                className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            {/* Calorie Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Calories</label>
              <select
                value={filters.calorieRange}
                onChange={(e) => setFilters({...filters, calorieRange: e.target.value as any})}
                className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
              >
                <option value="any">Any Amount</option>
                <option value="low">Low (&lt;300)</option>
                <option value="medium">Medium (300-600)</option>
                <option value="high">High (&gt;600)</option>
              </select>
            </div>
            
            {/* Health Score */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Health Score</label>
              <select
                value={filters.healthScore}
                onChange={(e) => setFilters({...filters, healthScore: e.target.value as any})}
                className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
              >
                <option value="any">Any Score</option>
                <option value="excellent">Excellent (8+)</option>
                <option value="good">Good (6-8)</option>
                <option value="fair">Fair (&lt;6)</option>
              </select>
            </div>
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-300">Sort by:</span>
            <div className="flex space-x-2">
              {['date', 'calories', 'score'].map((field) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field as any)}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center space-x-1 ${
                    sortBy === field ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <span className="capitalize">{field}</span>
                  {sortBy === field && (
                    sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Meals Display */}
      {filteredMeals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No meals found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filters.timeRange !== 'all' || filters.calorieRange !== 'any' || filters.healthScore !== 'any'
              ? 'Try adjusting your search or filters'
              : 'Start by uploading your first meal'
            }
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Upload Your First Meal
          </Link>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredMeals.map((meal) => (
            viewMode === 'grid' ? (
              <MealCard key={meal.id} meal={meal} />
            ) : (
              <MealListItem key={meal.id} meal={meal} />
            )
          ))}
        </div>
      )}
    </div>
  );
} 