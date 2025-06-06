'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { useAuth } from './client/ClientAuthProvider';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Meal {
  id: string;
  mealName: string;
  imageUrl?: string;
  calories?: number;
  created_at: string;
}

interface MealHistoryProps {
  searchTerm?: string;
  sortOrder?: 'asc' | 'desc';
  viewMode?: 'grid' | 'list';
  limit?: number;
  showTitle?: boolean;
}

// Helper function to normalize image URLs (copied from DynamicMealDisplay)
const normalizeImageUrl = (url: string | undefined): string => {
  if (!url) return '/placeholder-meal.jpg'; // Fallback image
  
  // Handle Supabase storage URLs
  if (url.includes('supabase.co') || url.includes('supabase.in')) {
    // Make sure the URL is using HTTPS
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    return url;
  }
  
  // Handle data URLs (keep as is)
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Handle relative URLs
  if (url.startsWith('/')) {
    return url;
  }
  
  // Handle absolute URLs with http/https
  if (url.startsWith('http')) {
    return url;
  }
  
  return url;
};

export default function MealHistory({ 
  searchTerm = '', 
  sortOrder = 'desc', 
  viewMode = 'grid',
  limit = 0,
  showTitle = true
}: MealHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const loadMeals = async () => {
    if (!user?.id) {
      setError('Please log in to view your meal history');
      return;
    }
    
    try {
      // Get user ID
      const userId = user.id;
      
      // Array to hold all meals
      let combinedMeals: Meal[] = [];
      
      // 1. Fetch meals from Supabase (if user is logged in)
      if (userId) {
        try {
          // Try to get meals from the database
          const supabase = createClient();
          const { data: dbMeals, error } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: sortOrder === 'asc' });
            
          if (!error && dbMeals && dbMeals.length > 0) {
            const formattedDbMeals = dbMeals.map((meal: any) => ({
              id: meal.id,
              mealName: meal.caption || meal.name || (meal as any).detected_food || 'Analyzed Meal',
              imageUrl: normalizeImageUrl(meal.image_url),
              calories: meal.calories || (meal.analysis?.calories) || 0,
              created_at: meal.created_at
            }));
            
            combinedMeals = [...formattedDbMeals];
            console.log(`[MealHistory] Fetched ${formattedDbMeals.length} meals from database`);
            
            // Save these to localStorage for faster future loading
            formattedDbMeals.forEach((meal: any) => {
              try {
                // Store key Supabase meal data in localStorage for improved loading speed
                const key = `meal_analysis_${meal.id}`;
                // Only save if not already in localStorage to avoid overwriting
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, JSON.stringify(meal));
                }
              } catch (e) {
                // Ignore localStorage errors
              }
            });
          }
        } catch (dbError) {
          console.error('[MealHistory] Error fetching meals from database:', dbError);
        }
      }
      
      // 2. Get meals from localStorage for a complete history
      try {
        const localStorageKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('meal_analysis_') && !key.includes('template')
        );
        
        // Sort by recent-first using the timestamp in meal ID or created_at
        const localMeals = localStorageKeys
          .map(key => {
            try {
              const mealData = JSON.parse(localStorage.getItem(key) || '{}');
              
              // Skip if this is a duplicate of a DB meal
              if (combinedMeals.some(m => m.id === mealData.id)) {
                return null;
              }
              
              return {
                id: mealData.id || key.replace('meal_analysis_', ''),
                mealName: mealData.mealName || 'Analyzed Meal',
                imageUrl: mealData.imageUrl,
                calories: mealData.analysis?.calories || 0,
                created_at: mealData.created_at || new Date().toISOString()
              };
            } catch (e) {
              console.warn(`[MealHistory] Error parsing localStorage meal: ${key}`, e);
              return null;
            }
          })
          .filter(Boolean); // Remove nulls
          
        if (localMeals.length > 0) {
          console.log(`[MealHistory] Found ${localMeals.length} local meals`);
          combinedMeals = [...combinedMeals, ...localMeals as Meal[]];
        }
      } catch (localStorageError) {
        console.error('[MealHistory] Error reading meals from localStorage:', localStorageError);
      }
      
      // Sort all meals by date
      combinedMeals.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
      
      // Apply search term filter
      if (searchTerm) {
        combinedMeals = combinedMeals.filter(meal => 
          meal.mealName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply limit if specified
      if (limit > 0 && combinedMeals.length > limit) {
        combinedMeals = combinedMeals.slice(0, limit);
      }
      
      // Set the combined meals
      setMeals(combinedMeals);
    } catch (err) {
      console.error('[MealHistory] Error loading meals:', err);
      setError('Failed to load meal history. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadMeals();
  }, [searchTerm, sortOrder]);
  
  if (loading) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6 animate-pulse">
        <h2 className="text-2xl font-semibold mb-4 bg-gray-700/50 h-8 w-48 rounded"></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={`skeleton-${i}`} className="bg-gray-800/50 rounded-lg overflow-hidden">
              <div className="h-32 bg-gray-700/60"></div>
              <div className="p-3 space-y-2">
                <div className="h-5 bg-gray-700/60 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700/60 rounded w-1/2"></div>
                <div className="h-8 bg-gray-700/60 rounded mt-3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6 text-center">
        {showTitle && <h2 className="text-2xl font-semibold mb-4">Meal History</h2>}
        <p className="text-gray-400 mb-4">{error}</p>
        <Link 
          href="/upload" 
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Upload a Meal
        </Link>
      </div>
    );
  }
  
  if (meals.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6 text-center">
        {showTitle && <h2 className="text-2xl font-semibold mb-4">Meal History</h2>}
        <p className="text-gray-400 mb-4">You haven't analyzed any meals yet</p>
        <Link 
          href="/upload" 
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Upload a Meal
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-800/30 rounded-lg p-6">
      {showTitle && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Your Meal History</h2>
          <button 
            onClick={loadMeals}
            disabled={loading}
            className="flex items-center text-blue-400 hover:text-blue-300 transition duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-900/40 rounded-lg p-4 mb-4">
          <p className="text-red-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : meals.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-400 mb-2">No meal history found</h3>
          <p className="text-gray-500 mb-4">Try uploading and analyzing a meal to see your history here.</p>
          <Link 
            href="/upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload a Meal
          </Link>
        </div>
      ) : viewMode === 'list' ? (
        // List view
        <div className="space-y-4">
          {meals.map(meal => (
            <div 
              key={`meal-list-${meal.id}`} 
              className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden hover:border-blue-500/30 transition duration-150"
            >
              <div className="flex flex-col md:flex-row">
                <div className="h-32 md:h-auto md:w-1/4 overflow-hidden">
                  <Image
                    src={normalizeImageUrl(meal.imageUrl)}
                    alt={meal.mealName || 'Analyzed meal'}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // @ts-ignore
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder-meal.jpg';
                    }}
                  />
                </div>
                
                <div className="p-4 flex-1">
                  <h3 className="font-medium text-white text-lg mb-1">{meal.mealName}</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-400 font-medium">
                      {meal.calories || 0} kcal
                    </span>
                    <span className="text-sm text-gray-400">
                      {formatDistanceToNow(new Date(meal.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <Link 
                    href={`/analysis/${meal.id}`}
                    className="mt-2 inline-flex items-center py-2 px-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded transition"
                  >
                    <span>View Details</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Grid view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {meals.map(meal => (
            <div 
              key={`meal-grid-${meal.id}`}
              className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden hover:border-blue-500/30 transition duration-150"
            >
              <div className="h-32 overflow-hidden">
                <Image
                  src={normalizeImageUrl(meal.imageUrl)}
                  alt={meal.mealName || 'Analyzed meal'}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // @ts-ignore
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder-meal.jpg';
                  }}
                />
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-white text-lg mb-1 truncate">{meal.mealName}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-medium">
                    {meal.calories || 0} kcal
                  </span>
                  <span className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(meal.created_at), { addSuffix: true })}
                  </span>
                </div>
                <Link 
                  href={`/analysis/${meal.id}`}
                  className="mt-3 w-full py-2 flex items-center justify-center bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded transition"
                >
                  <span>View Details</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {meals.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
          {limit > 0 && meals.length === limit && (
            <Link href="/history" className="ml-2 text-blue-400 hover:underline">
              View all
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 