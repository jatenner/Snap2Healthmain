'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DynamicMealDisplay from '../DynamicMealDisplay';
import PersonalizedNutritionAnalysis from '../PersonalizedNutritionAnalysis';

// Data verification hook to ensure correct meal data
function useMealDataVerification(mealId: string | null, mealData: any) {
  useEffect(() => {
    if (!mealId || !mealData) return;

    // Check if client-side and server-side data match
    const verifyMealData = async () => {
      try {
        // Try to fetch the latest data from server
        const response = await fetch(`/api/health-review?mealId=${mealId}`);
        if (!response.ok) return;
        
        const serverData = await response.json();
        if (!serverData?.meal) return;
        
        // Get key details from both data sources
        const clientTitle = mealData?.mealName || mealData?.caption;
        const serverTitle = serverData.meal?.mealName || serverData.meal?.caption;
        
        // If titles don't match or one is missing, use server data
        if (!clientTitle || !serverTitle || clientTitle !== serverTitle) {
          console.log('[MealDataVerifier] Data mismatch detected, updating from server');
          
          // Update localStorage with correct data
          localStorage.setItem(`meal_analysis_${mealId}`, JSON.stringify(serverData.meal));
          localStorage.setItem('last_meal_analysis', JSON.stringify(serverData.meal));
          localStorage.setItem('current_meal_id', mealId);
          
          // Force refresh to display correct data
          window.location.reload();
        }
      } catch (error) {
        console.error('[MealDataVerifier] Error verifying meal data:', error);
      }
    };
    
    verifyMealData();
  }, [mealId, mealData]);
}

export default function MealAnalysisClient({ mealId }: { mealId: string }) {
  const router = useRouter();
  const [mealData, setMealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call the verification hook
  useMealDataVerification(mealId, mealData);

  // Load meal data from localStorage or API
  useEffect(() => {
    const loadMealData = async () => {
      if (!mealId) {
        setError('No meal ID provided');
        setLoading(false);
        return;
      }

      try {
        // Try to load from localStorage first
        const localStorageKey = `meal_analysis_${mealId}`;
        const localData = localStorage.getItem(localStorageKey);

        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            setMealData(parsedData);
            setLoading(false);
          } catch (e) {
            console.error('Error parsing localStorage data:', e);
            // Continue to API fetch if parsing fails
          }
        }

        // Always fetch from API to ensure we have the latest data
        const response = await fetch(`/api/health-review?mealId=${mealId}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const apiData = await response.json();
        if (apiData.meal) {
          // If API data is different from localStorage, update
          const apiDataStr = JSON.stringify(apiData.meal);
          const currentDataStr = mealData ? JSON.stringify(mealData) : '';
          
          if (apiDataStr !== currentDataStr) {
            setMealData(apiData.meal);
            localStorage.setItem(localStorageKey, apiDataStr);
            localStorage.setItem('last_meal_analysis', apiDataStr);
            localStorage.setItem('current_meal_id', mealId);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading meal data:', err);
        setError(err instanceof Error ? err.message : 'Error loading meal data');
        setLoading(false);
      }
    };

    loadMealData();
  }, [mealId]);

  // Return appropriate UI based on loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-800 rounded mb-10"></div>
          <div className="h-64 w-full max-w-lg bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Meal Analysis</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // If no meal data found
  if (!mealData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Meal Data Found</h1>
          <p className="text-gray-300 mb-6">We couldn't find the meal analysis you're looking for.</p>
          <button 
            onClick={() => router.push('/upload')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Upload a New Meal
          </button>
        </div>
      </div>
    );
  }

  // Render the meal analysis
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <DynamicMealDisplay mealData={mealData} />
        <PersonalizedNutritionAnalysis analysisData={mealData} userGoal={mealData.goal} />
      </div>
    </div>
  );
} 