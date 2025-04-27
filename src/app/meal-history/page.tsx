'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatMealDate } from '../../utils/formatMealTime';

interface MealRecord {
  id: string;
  created_at: string;
  caption: string;
  goal: string;
  image_url?: string;
  analysis: {
    calories: number;
    macronutrients: any[];
    micronutrients: any[];
  };
}

export default function MealHistoryPage() {
  const { user, session, refreshSession } = useAuth();
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Debug logging for authentication state
  useEffect(() => {
    if (user) {
      console.log('MealHistoryPage - Authenticated user:', user.email);
      console.log('MealHistoryPage - User ID:', user.id);
    } else {
      console.log('MealHistoryPage - No authenticated user');
    }
  }, [user]);

  // Ensure session is up-to-date
  useEffect(() => {
    const checkAuthAndRefresh = async () => {
      if (!user) {
        console.log('MealHistoryPage - No user detected, refreshing session...');
        await refreshSession();
      }
    };

    checkAuthAndRefresh();
  }, [user, refreshSession]);

  // Function to ensure image URLs are properly formatted
  const getValidImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    
    // Log the original URL for debugging
    console.log(`Processing image URL: ${url}`);
    
    try {
      // Check if URL is already valid by creating a URL object
      new URL(url);
      console.log(`URL is valid: ${url}`);
      return url;
    } catch (e) {
      // URL is not valid, try to fix it
      console.log(`URL is not valid, attempting to fix: ${url}`);
      
      // If it's a relative URL or just a path from a Supabase bucket
      if (url.includes('/storage/v1/object/public/')) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const fullUrl = url.startsWith('/') 
          ? `${baseUrl}${url}`
          : `${baseUrl}/${url}`;
        console.log(`Fixed URL with base: ${fullUrl}`);
        return fullUrl;
      }
      
      // If it's just a path without leading slash
      if (!url.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const fullUrl = `${baseUrl}/storage/v1/object/public/${url.startsWith('/') ? url.substring(1) : url}`;
        console.log(`Constructed URL: ${fullUrl}`);
        return fullUrl;
      }
    }
    
    // Return original if we couldn't fix it
    return url;
  };

  // Function to fetch debug info
  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug/meals');
      const data = await response.json();
      setDebugInfo(JSON.stringify(data, null, 2));
      console.log('Debug info:', data);
    } catch (err) {
      console.error('Error fetching debug info:', err);
    }
  };

  // Create the meals table if needed
  const createMealsTable = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-tables');
      const data = await response.json();
      console.log('Table creation result:', data);
      
      // Fetch debug info after table creation
      await fetchDebugInfo();
      
      // Reload meal history
      fetchMealHistory();
    } catch (err) {
      console.error('Error creating meals table:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      console.log('MealHistoryPage - Waiting for user authentication...');
      return;
    }
    
    fetchMealHistory();
  }, [user]);

  const fetchMealHistory = async () => {
    if (!user || !user.id) {
      console.error('Cannot fetch meal history: No authenticated user');
      setError('Please log in to view your meal history');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching meal history for user:', user.id);
      console.log('User email:', user.email);
      
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching meal history:', error);
        setError(`Failed to load meal history: ${error.message}`);
        
        // Check if it's a "relation does not exist" error, which means we need to create the table
        if (error.message?.includes('does not exist')) {
          setError('The meals table does not exist yet. Click "Create Meals Table" to set it up.');
        }
        
        return;
      }
      
      if (data) {
        console.log(`Found ${data.length} meal records`);
        
        // Process the data to ensure image URLs are valid and parse analysis if needed
        const processedData = data.map(meal => {
          // Parse analysis field if it's a string
          let parsedAnalysis = meal.analysis;
          if (typeof meal.analysis === 'string') {
            try {
              const parsed = JSON.parse(meal.analysis);
              // If the JSON contains an 'analysis' field, extract it
              parsedAnalysis = parsed.analysis || parsed;
            } catch (err) {
              console.error(`Error parsing analysis for meal ${meal.id}:`, err);
              // Default to an empty analysis object
              parsedAnalysis = {
                calories: 0,
                macronutrients: [],
                micronutrients: []
              };
            }
          }
          
          return {
            ...meal,
            image_url: getValidImageUrl(meal.image_url),
            analysis: parsedAnalysis
          };
        });
        
        // Log image URLs for debugging
        processedData.forEach((meal, index) => {
          console.log(`Meal ${index+1} image URL:`, meal.image_url || 'No image URL');
        });
        
        setMeals(processedData);
      } else {
        console.log('No meal records found');
        setMeals([]);
      }
    } catch (err: any) {
      console.error('Error fetching meal history:', err);
      setError(err.message || 'Failed to load meal history');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    // Use our improved utility function for consistent date formatting
    return formatMealDate(dateString);
  };

  // Handle image loading error
  const handleImageError = (mealId: string) => {
    console.error(`Failed to load image for meal: ${mealId}`);
    setImageErrors(prev => ({ ...prev, [mealId]: true }));
  };

  // Force refresh images
  const handleRefreshImages = async () => {
    if (!user) return;
    setLoading(true);
    setImageErrors({});
    
    // Clear Next.js image cache by adding timestamp to URL
    const timestamp = Date.now();
    const refreshedMeals = meals.map(meal => ({
      ...meal,
      image_url: meal.image_url ? `${meal.image_url}?t=${timestamp}` : undefined
    }));
    
    setMeals(refreshedMeals);
    setLoading(false);
    
    // Also fetch debug info
    fetchDebugInfo();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 mb-6">
          <p>You need to be logged in to view your meal history.</p>
          <Link href="/login" className="mt-2 inline-block text-blue-600 hover:underline">
            Go to login page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Your Meal History</h1>
          {user?.email && (
            <p className="text-gray-600 mt-1">Logged in as: {user.email}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshImages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            title="Refresh images if they're not loading"
          >
            Refresh Images
          </button>
          <Link
            href="/upload"
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
          >
            Analyze New Meal
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <p>{error}</p>
          {error.includes('does not exist') && (
            <button 
              onClick={createMealsTable}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Create Meals Table
            </button>
          )}
        </div>
      )}

      {meals.length === 0 && !error ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">🍽️</div>
          <h2 className="text-2xl font-semibold mb-2">No meals yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't analyzed any meals yet. Start by analyzing your first meal!
          </p>
          <Link
            href="/upload"
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 inline-block"
          >
            Analyze a Meal
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {meals.map((meal) => (
            <div key={meal.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                {meal.image_url && !imageErrors[meal.id] ? (
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={meal.image_url}
                      alt={meal.caption || 'Food image'}
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      style={{ objectFit: 'cover' }}
                      className="rounded-lg"
                      onError={() => handleImageError(meal.id)}
                      priority={meals.indexOf(meal) < 2}
                      unoptimized={true} // Skip Next.js optimization to avoid CORS issues
                    />
                  </div>
                ) : imageErrors[meal.id] ? (
                  <div className="w-full h-48 mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500 mt-2">Image unavailable</p>
                      <p className="text-xs text-gray-400 mt-1">{meal.image_url?.substring(0, 40)}...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500 mt-2">No image available</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{meal.caption}</h2>
                  <span className="text-sm text-gray-500">{formatDate(meal.created_at)}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {meal.goal || 'General Wellness'}
                  </span>
                  {meal.analysis?.calories && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {meal.analysis.calories} Calories
                    </span>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Macronutrients</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {meal.analysis?.macronutrients?.slice(0, 3).map((macro, idx) => (
                      <div key={idx} className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-semibold">{macro.amount}{macro.unit}</div>
                        <div className="text-xs text-gray-500">{macro.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 text-right">
                  <Link
                    href={`/meal-analysis?data=${encodeURIComponent(
                      JSON.stringify({ 
                        caption: meal.caption, 
                        analysis: meal.analysis,
                        ingredients: [],
                        imageUrl: meal.image_url,
                      })
                    )}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Full Analysis →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Debug section */}
      <div className="mt-8">
        <button 
          onClick={() => fetchDebugInfo()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          {debugInfo ? 'Update Debug Info' : 'Show Debug Info'}
        </button>
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96 text-xs">
            <pre>{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 