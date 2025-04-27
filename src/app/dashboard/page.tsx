'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSupabase } from '../../context/SupabaseProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import MealImageGallery from '../../components/MealImageGallery';
import { fetchMealHistory, groupMealsByDate, GroupedMeals } from '../../lib/mealHistory';
import { supabase } from '../../lib/supabaseClient';
import { formatMealTime, formatMealDate } from '../../utils/formatMealTime';

// Enhanced MealRecord interface with detailed analysis properties
interface MealRecord {
  id: string;
  user_id: string;
  created_at: string;
  caption?: string;
  goal?: string;
  image_url?: string;
  analysis?: {
    calories: number;
    macronutrients?: Array<{
      name: string;
      amount: number;
      unit: string;
      percentDailyValue?: number;
      description?: string;
    }>;
    micronutrients?: Array<{
      name: string;
      amount: number;
      unit: string;
      percentDailyValue?: number;
      description?: string;
    }>;
    recoveryInsights?: Array<{
      title: string;
      description: string;
    }>;
    hydration?: {
      level: number;
      waterContent: number;
      unit: string;
      tips?: string[];
    };
    glycemicLoad?: {
      value: number;
      index?: number;
      carbs: number;
      unit: string;
      foodTypes?: string[];
      impact?: string;
    };
    benefits?: string[];
    concerns?: string[];
    suggestions?: string[];
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [groupedMeals, setGroupedMeals] = useState<GroupedMeals>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  
  // Function to fetch debug info
  const fetchDebugInfo = async () => {
    try {
      const { data: debugData, error: debugError } = await supabase
        .from('debug_logs')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false });

      if (debugError) console.error('Error fetching debug logs:', debugError);
      else console.log('Recent debug logs:', debugData);

      return debugData;
    } catch (err) {
      console.error('Error fetching debug info:', err);
      return null;
    }
  };

  const getMealHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('Please sign in to view your meal history');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      console.log('Fetching meal history for user ID:', user.id);
      const { data, error } = await fetchMealHistory(user.id);

      // Collect debug info
      let debugData = [
        `User ID: ${user.id}`,
        `Email: ${user.email}`,
        `Time: ${new Date().toISOString()}`
      ];

      if (error) {
        console.error('Error fetching meal history:', error);
        setError('Failed to load your meal history. Please try again later.');
        debugData.push(`Error: ${JSON.stringify(error)}`);
        
        // Try to get more debug info
        await fetchDebugInfo();
      } else if (data) {
        console.log(`Successfully fetched ${data.length} meal records`);
        debugData.push(`Meals found: ${data.length}`);
        
        if (data.length > 0) {
          console.log('First meal record:', data[0]);
          debugData.push(`First meal: ${JSON.stringify(data[0], null, 2)}`);
        }
        
        setMeals(data);
        const grouped = groupMealsByDate(data);
        setGroupedMeals(grouped);
      }
      
      setDebugInfo(debugData.join('\n'));
    } catch (err) {
      console.error('Error in getMealHistory:', err);
      setError('An unexpected error occurred. Please try again later.');
      setDebugInfo(`Error: ${JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    getMealHistory();
  }, [getMealHistory]);

  const handleImageError = (id: string, error: any) => {
    console.error(`Error loading image for meal ${id}:`, error);
    setImageLoadErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleRefreshImages = () => {
    // Reset image load errors
    setImageLoadErrors({});
    
    // Add timestamp to image URLs to force refresh
    const timestamp = Date.now();
    const refreshedMeals = meals.map(meal => ({
      ...meal,
      image_url: meal.image_url ? `${meal.image_url}?t=${timestamp}` : meal.image_url
    }));
    
    setMeals(refreshedMeals);
    setGroupedMeals(groupMealsByDate(refreshedMeals));
  };

  // Format date header showing Today, Yesterday, or date
  const formatDateHeader = (dateKey: string) => {
    // Check if the dateKey is already a formatted string like 'Today' or 'Yesterday'
    const preFormattedStrings = ['Today', 'Yesterday', 'Date error', 'Invalid date', 'No date', 'Unknown date'];
    if (preFormattedStrings.includes(dateKey)) {
      return dateKey;
    }
    
    // Use our improved utility function for consistent date formatting
    return formatMealDate(dateKey);
  };

  // Toggle expanded state for a day
  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Toggle expanded state for a meal
  const toggleMeal = (mealId: string) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealId]: !prev[mealId]
    }));
  };

  // Render nutrition information
  const renderNutrition = (meal: MealRecord) => {
    console.log(`Rendering nutrition for meal ${meal.id}:`, meal.analysis);
    
    // Handle the case where analysis might be missing or invalid
    if (!meal.analysis || typeof meal.analysis !== 'object' || !meal.analysis.calories) {
      console.warn(`No valid analysis data for meal ${meal.id}:`, meal.analysis);
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500 italic">No detailed analysis available for this meal.</p>
          <button 
            onClick={() => {
              router.push(`/meal-analysis?id=${meal.id}`);
            }}
            className="mt-2 py-1 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-md"
          >
            Re-analyze meal
          </button>
        </div>
      );
    }
    
    const { analysis } = meal;
    
    // Log analysis data for debugging
    console.log(`Analysis data for meal ${meal.id}:`, {
      calories: analysis.calories,
      macrosCount: analysis.macronutrients?.length || 0,
      microsCount: analysis.micronutrients?.length || 0
    });
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-6">
        {/* Calories Section */}
        <div className="bg-white p-4 rounded-md shadow-sm">
          <h4 className="font-medium text-gray-800 mb-3">Calories</h4>
          <div className="flex items-center mb-3 bg-yellow-50 p-3 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium text-xl">{analysis.calories} calories</span>
          </div>
        </div>
        
        {/* Macronutrients Section */}
        {analysis.macronutrients && analysis.macronutrients.length > 0 && (
          <div className="bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-md font-medium text-gray-700 mb-3">Macronutrients</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.macronutrients.map((macro, index) => (
                <div key={index} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="font-medium text-gray-700">{macro.name}</div>
                  <div className="text-xl font-semibold mt-1">{macro.amount}{macro.unit}</div>
                  {macro.percentDailyValue && (
                    <div className="text-sm text-gray-500 mt-1">{macro.percentDailyValue}% daily value</div>
                  )}
                  {macro.description && (
                    <div className="text-sm text-gray-600 mt-2">{macro.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Micronutrients Section */}
        {analysis.micronutrients && analysis.micronutrients.length > 0 && (
          <div className="bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-md font-medium text-gray-700 mb-3">Micronutrients</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {analysis.micronutrients.map((micro, index) => (
                <div key={index} className="bg-emerald-50 p-3 rounded border border-emerald-100">
                  <div className="font-medium text-gray-700">{micro.name}</div>
                  <div className="text-lg font-semibold">{micro.amount}{micro.unit}</div>
                  {micro.percentDailyValue && (
                    <div className="text-sm text-gray-500">{micro.percentDailyValue}% daily value</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recovery Insights */}
        {analysis.recoveryInsights && analysis.recoveryInsights.length > 0 && (
          <div className="bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-md font-medium text-gray-700 mb-3">Recovery Insights</h4>
            <div className="space-y-3">
              {analysis.recoveryInsights.map((insight, index) => (
                <div key={index} className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                  <h5 className="font-medium text-teal-700">{insight.title}</h5>
                  <p className="text-gray-600 mt-1">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Hydration Status */}
        {analysis.hydration && (
          <div className="bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-md font-medium text-gray-700 mb-3">Hydration Status</h4>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center mb-3">
                <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                    style={{ width: `${analysis.hydration.level || 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium text-gray-700">
                  {analysis.hydration.level || 0}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Water content: {analysis.hydration.waterContent}{analysis.hydration.unit}</p>
                {analysis.hydration.tips && analysis.hydration.tips.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Tips:</p>
                    <ul className="list-disc list-inside mt-1">
                      {analysis.hydration.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Glycemic Load */}
        {analysis.glycemicLoad && (
          <div className="bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-md font-medium text-gray-700 mb-3">Glycemic Impact</h4>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Glycemic Load:</span>
                <span className="font-bold text-lg">{analysis.glycemicLoad.value}</span>
              </div>
              
              {analysis.glycemicLoad.index && (
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Glycemic Index:</span>
                  <span>{analysis.glycemicLoad.index}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Carbs:</span>
                <span>{analysis.glycemicLoad.carbs}{analysis.glycemicLoad.unit}</span>
              </div>
              
              {analysis.glycemicLoad.foodTypes && analysis.glycemicLoad.foodTypes.length > 0 && (
                <div className="mt-2 mb-3">
                  <p className="font-medium">Key contributors:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.glycemicLoad.foodTypes.map((food, index) => (
                      <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {analysis.glycemicLoad.impact && (
                <p className="text-sm text-gray-600 mt-2">{analysis.glycemicLoad.impact}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Benefits and Concerns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Benefits */}
          {analysis.benefits && analysis.benefits.length > 0 && (
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h4 className="text-md font-medium text-gray-700 mb-3">Benefits</h4>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                {analysis.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Concerns */}
          {analysis.concerns && analysis.concerns.length > 0 && (
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h4 className="text-md font-medium text-gray-700 mb-3">Concerns</h4>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                {analysis.concerns.map((concern, index) => (
                  <li key={index}>{concern}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* View Full Analysis Button */}
        <div className="flex justify-center mt-4">
          <Link
            href={`/meal-analysis?id=${meal.id}`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
          >
            View Full Analysis
          </Link>
        </div>
      </div>
    );
  };

  // Add this function near the other handler functions
  const createTestMeal = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/test-meal?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to create test meal');
      }
      
      // Fetch meal history after creating test meal
      await getMealHistory();
    } catch (error) {
      console.error('Error creating test meal:', error);
      setError('Failed to create test meal. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Add this function near the others
  const handleDebugUpload = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Create a direct image URL link to an existing image
      const imageUrl = 'https://cyrztlmzanhfybqsakgc.supabase.co/storage/v1/object/public/meal-images/test-image.jpg';
      
      // Try to create a meal record directly in the database
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('imageUrl', imageUrl);
      formData.append('goalId', 'General Wellness');
      
      // Call API directly to avoid the normal upload/analyze flow
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to create meal record');
      }
      
      const result = await response.json();
      console.log('Debug upload result:', result);
      
      // Refresh meal history
      await getMealHistory();
      
    } catch (error) {
      console.error('Error in debug upload:', error);
      setError('Failed to create debug meal. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Validate and fix image URLs
  const getValidatedImageUrl = (meal: MealRecord) => {
    if (!meal.image_url) return null;
    
    // Check if URL appears to be valid
    try {
      // If it's a relative URL, make it absolute
      if (!meal.image_url.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (meal.image_url.includes('/storage/v1/object/public/')) {
          return `${baseUrl}${meal.image_url.startsWith('/') ? '' : '/'}${meal.image_url}`;
        } else {
          return `${baseUrl}/storage/v1/object/public/meal-images/${meal.image_url.startsWith('/') ? meal.image_url.substring(1) : meal.image_url}`;
        }
      }
      
      // URL is already absolute, return it
      return meal.image_url;
    } catch (e) {
      console.error(`Invalid image URL for meal ${meal.id}:`, meal.image_url, e);
      return null;
    }
  };

  // Add this function near the others
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
          {error.includes('Database table') && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-gray-800 text-sm">
              <p className="font-medium">Developer Information:</p>
              <p>The database tables have not been created yet. Check the console for more information.</p>
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="mt-2 bg-gray-200 px-3 py-1 rounded text-sm"
              >
                Show Debug Info
              </button>
            </div>
          )}
        </div>
        
        {showDebugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm font-mono overflow-auto max-h-96 whitespace-pre">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-3">No Meals Found</h2>
          <p className="text-gray-600 mb-4">
            You haven't recorded any meals yet. Start by uploading a meal photo!
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
            <Link
              href="/upload"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition inline-block"
            >
              Analyze Your First Meal
            </Link>
            <button
              onClick={createTestMeal}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition inline-block"
            >
              Create Test Meal
            </button>
            {/* Debug button */}
            <button
              onClick={handleDebugUpload}
              className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              disabled={loading}
            >
              Debug Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasImageErrors = Object.keys(imageLoadErrors).length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email || 'User'}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/upload"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Analyze New Meal
          </Link>
        </div>
      </div>

      {/* Meal History By Day Section - Move this to the top for more prominence */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Meal Analysis History</h2>
            {hasImageErrors && (
              <button
                onClick={handleRefreshImages}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Refresh Data
              </button>
            )}
          </div>
        </div>

        {Object.keys(groupedMeals).length > 0 ? (
          <div>
            {Object.keys(groupedMeals).sort().reverse().map((date) => (
              <div key={date} className="border-b border-gray-100 last:border-b-0">
                <button 
                  onClick={() => toggleDay(date)}
                  className={`w-full px-6 py-3 flex justify-between items-center ${expandedDays[date] ? 'bg-indigo-50' : 'bg-gray-50'} hover:bg-indigo-50 transition`}
                >
                  <h3 className="font-semibold text-gray-700">{formatDateHeader(date)}</h3>
                  <div className="text-gray-500">
                    <span className="mr-2">{groupedMeals[date].length} meal{groupedMeals[date].length !== 1 ? 's' : ''}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 inline-block transition-transform duration-200 ${expandedDays[date] ? 'transform rotate-180' : ''}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
                
                {expandedDays[date] && (
                  <div className="divide-y divide-gray-100">
                    {groupedMeals[date].map((meal) => (
                      <div key={meal.id} className="p-6 hover:bg-gray-50 transition">
                        {/* Meal header with image, time, and expand/collapse control */}
                        <div 
                          className="flex justify-between items-start cursor-pointer" 
                          onClick={() => toggleMeal(meal.id)}
                        >
                          <div className="flex items-start space-x-4">
                            {meal.image_url && !imageLoadErrors[meal.id] ? (
                              <div className="flex-shrink-0">
                                <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                                  <Image
                                    src={getValidatedImageUrl(meal) || ''}
                                    alt={meal.caption || 'Meal image'}
                                    fill
                                    className="object-cover"
                                    onError={(e) => handleImageError(meal.id, e)}
                                    sizes="80px"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex-shrink-0 h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center mb-1">
                                <h4 className="font-medium text-lg text-gray-800 mr-3">{meal.caption || 'Untitled Meal'}</h4>
                                <span className="text-sm text-gray-500">{formatMealTime(meal.created_at)}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                {meal.goal && (
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                    {meal.goal}
                                  </span>
                                )}
                                {meal.analysis?.calories && (
                                  <span className="text-sm text-gray-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                                    {meal.analysis.calories} calories
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {expandedMeals[meal.id] ? 'Click to collapse' : 'Click to view full analysis'}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-gray-400 mt-2">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-5 w-5 transition-transform duration-200 ${expandedMeals[meal.id] ? 'transform rotate-180' : ''}`} 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Expanded meal detailed analysis */}
                        {expandedMeals[meal.id] && (
                          <div className="mt-6">
                            {renderNutrition(meal)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="mb-4 text-gray-500">No meal records found.</p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
              <Link
                href="/upload"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition inline-block"
              >
                Analyze Your First Meal
              </Link>
              <button
                onClick={createTestMeal}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition inline-block"
              >
                Create Test Meal
              </button>
              {/* Debug button */}
              <button
                onClick={handleDebugUpload}
                className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                disabled={loading}
              >
                Debug Upload
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Meal Image Gallery Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 p-6">
        <MealImageGallery />
      </div>
      
      {debugInfo && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-64">
            {debugInfo}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <div className="mt-4">
            <Link href="/admin/setup" className="text-blue-500 underline">
              Check Database Setup
            </Link>
          </div>
        </div>
      )}

      {/* Debug section - add this at the bottom */}
      <div className="mt-10 border-t pt-4">
        <details className="text-xs">
          <summary className="text-gray-500 cursor-pointer">Debug Info</summary>
          <div className="mt-2 p-4 bg-gray-100 rounded whitespace-pre-wrap font-mono text-xs">
            {debugInfo || 'No debug info available'}
            <div className="mt-2">
              <button 
                onClick={getMealHistory} 
                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
} 