'use client';

<<<<<<< HEAD
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchMealHistory, MealHistoryEntry, deleteMealFromHistory } from '@/lib/meal-data';
import { formatMealDate, formatMealTime } from '@/utils/formatMealTime';

export default function MealHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealHistoryEntry[]>([]);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);

  // Fetch meal history on component mount
  useEffect(() => {
    const getMealHistory = async () => {
      try {
        setLoading(true);
        const history = await fetchMealHistory();
        setMeals(history);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching meal history:', err);
        setError('Failed to load meal history. Please try again later.');
        setLoading(false);
      }
    };

    getMealHistory();
  }, []);

  // Group meals by date
  const groupedMeals = meals.reduce<Record<string, MealHistoryEntry[]>>((groups, meal) => {
    const date = formatMealDate(meal.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {});

  // Handle deleting a meal
  const handleDelete = async (mealId: string) => {
    if (window.confirm('Are you sure you want to delete this meal analysis?')) {
      try {
        setDeletingMealId(mealId);
        const result = await deleteMealFromHistory(mealId);
        
        if (result.success) {
          // Remove the meal from the state
          setMeals(meals.filter(meal => meal.id !== mealId));
        } else {
          alert('Failed to delete meal. Please try again.');
        }
      } catch (err) {
        console.error('Error deleting meal:', err);
        alert('Error deleting meal. Please try again.');
      } finally {
        setDeletingMealId(null);
      }
    }
  };

  // View meal details
  const viewMealDetails = (meal: MealHistoryEntry) => {
    // Convert the meal entry to URL parameters
    const params = new URLSearchParams();
    params.append('imageUrl', meal.imageUrl);
    params.append('mealName', meal.mealName);
    if (meal.goal) params.append('goal', meal.goal);
    
    // Navigate to the analysis page with parameters
    router.push(`/meal-analysis?${params.toString()}`);
=======
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';

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
        
        // Process the data to ensure image URLs are valid
        const processedData = data.map(meal => ({
          ...meal,
          image_url: getValidImageUrl(meal.image_url)
        }));
        
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
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
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
  };

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading meal history...</h2>
        </div>
=======
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <LoadingSpinner size="large" />
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
      </div>
    );
  }

<<<<<<< HEAD
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{error}</h2>
            <Link 
              href="/"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-block"
            >
              Back to Home
            </Link>
          </div>
=======
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 mb-6">
          <p>You need to be logged in to view your meal history.</p>
          <Link href="/login" className="mt-2 inline-block text-blue-600 hover:underline">
            Go to login page
          </Link>
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <header className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-green-600">Meal History</h1>
            <Link 
              href="/"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Analyze New Meal
            </Link>
          </div>
          <p className="text-gray-600">View and manage your previous meal analyses</p>
        </header>
        
        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          {Object.keys(groupedMeals).length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No meal history found</h2>
              <p className="text-gray-500 mb-6">Start by uploading and analyzing your first meal</p>
              <Link 
                href="/"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Analyze Your First Meal
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMeals).map(([date, dateMeals]) => (
                <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-100 px-6 py-3 border-b">
                    <h3 className="text-lg font-medium text-gray-800">{date}</h3>
                  </div>
                  <div className="divide-y">
                    {dateMeals.map(meal => (
                      <div key={meal.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Meal image */}
                          <div className="sm:w-24 sm:h-24 relative rounded-md overflow-hidden">
                            <Image 
                              src={meal.imageUrl} 
                              alt={meal.mealName || "Food"} 
                              width={96}
                              height={96}
                              style={{ objectFit: 'cover' }}
                              className="w-full h-full"
                            />
                          </div>
                          
                          {/* Meal details */}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="text-lg font-medium text-gray-800">{meal.mealName || "Meal Analysis"}</h4>
                              <span className="text-sm text-gray-500">{formatMealTime(meal.createdAt)}</span>
                            </div>
                            {meal.goal && (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium mt-1">
                                {meal.goal}
                              </span>
                            )}
                            <div className="mt-2 flex space-x-3">
                              <button
                                onClick={() => viewMealDetails(meal)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleDelete(String(meal.id))}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                disabled={deletingMealId === meal.id}
                              >
                                {deletingMealId === meal.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
=======
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
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
                      </div>
                    ))}
                  </div>
                </div>
<<<<<<< HEAD
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
=======
                
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
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
  );
} 