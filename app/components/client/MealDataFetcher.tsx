'use client';

import { useState, useEffect } from 'react';

// Copied normalizeMealId and getMealWithErrorHandling here since the import path was not working
// These functions would normally be imported from a utility module

/**
 * Normalizes meal ID format for consistent usage
 */
function normalizeMealId(id: string | null | undefined): string | null {
  if (!id) return null;
  
  // Clean up the ID - remove whitespace, quotes, etc.
  let cleanId = id.trim().replace(/^["']|["']$/g, '');
  
  // Check if it's already a valid UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(cleanId)) {
    return cleanId;
  }
  
  // Handle non-UUID formats by returning the cleaned ID
  // This allows the API to attempt lookups by different fields
  return cleanId;
}

/**
 * Get meal data with error handling
 */
async function getMealWithErrorHandling(id: string): Promise<any> {
  if (!id) return null;
  
  try {
    const normalizedId = normalizeMealId(id);
    if (!normalizedId) return null;
    
    const response = await fetch(`/api/meals/${normalizedId}`);
    
    if (!response.ok) {
      // If not found in main endpoint, try the alternate API
      if (response.status === 404) {
        const backupResponse = await fetch(`/api/analyze-meal?id=${normalizedId}`);
        if (backupResponse.ok) {
          return await backupResponse.json();
        }
      }
      
      console.error(`Error fetching meal ${normalizedId}:`, response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to get meal ${id}:`, error);
    return null;
  }
}

interface MealDataFetcherProps {
  mealId: string;
  children: (props: {
    mealData: any | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => React.ReactNode;
}

/**
 * Client component for reliably fetching meal data
 * This component handles all the edge cases like:
 * - Different meal ID formats
 * - 404 errors when a meal is in one table but not another
 * - JSON parsing errors from the API
 * - Multiple data sources
 */
export default function MealDataFetcher({ mealId, children }: MealDataFetcherProps) {
  const [mealData, setMealData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMealData = async () => {
    if (!mealId) {
      setError('No meal ID provided');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use our utility to get meal data with error handling
      const data = await getMealWithErrorHandling(mealId);
      
      if (!data) {
        setError(`Could not find meal with ID ${mealId}`);
        setMealData(null);
      } else {
        setMealData(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching meal data:', err);
      setError(`Failed to fetch meal data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch on mount
  useEffect(() => {
    fetchMealData();
  }, [mealId]);
  
  // Return the render props
  return <>{children({ 
    mealData, 
    loading, 
    error,
    refetch: fetchMealData
  })}</>;
}

/**
 * Helper function to fix common meal data issues
 * @param data Raw meal data that might have issues
 */
export function normalizeMealData(data: any): any {
  if (!data) return null;
  
  // Fix missing arrays
  const foods = Array.isArray(data.foods) ? data.foods : [];
  const macronutrients = Array.isArray(data.macronutrients) 
    ? data.macronutrients 
    : (data.macronutrients && typeof data.macronutrients === 'object')
      ? Object.values(data.macronutrients) 
      : [];
  
  const micronutrients = Array.isArray(data.micronutrients) 
    ? data.micronutrients 
    : (data.micronutrients && typeof data.micronutrients === 'object')
      ? Object.values(data.micronutrients) 
      : [];
  
  // Get a sensible meal name
  const mealName = data.meal_name || data.mealName || data.name || 'Meal Analysis';
  
  // Ensure analysis object exists
  const analysis = data.analysis || data.data || {};
  
  // Return normalized data
  return {
    ...data,
    mealName,
    meal_name: mealName,
    foods,
    macronutrients,
    micronutrients,
    analysis,
    // Ensure we have calories
    calories: data.calories || analysis.calories || 0,
    // Ensure basic macros
    protein: data.protein || (analysis.protein?.amount) || 0,
    carbs: data.carbs || (analysis.carbs?.amount) || 0,
    fat: data.fat || (analysis.fat?.amount) || 0,
  };
} 