'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface MealDataFixerProps {
  mealId: string;
  children: (props: {
    mealData: any | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => React.ReactNode;
}

/**
 * Client component that reliably fetches and displays meal data
 * Handles various error cases and provides automatic retries
 */
export default function MealDataFixer({ mealId, children }: MealDataFixerProps) {
  const [mealData, setMealData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMealData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Normalize the meal ID first
      const normalizedId = normalizeMealId(mealId);
      
      if (!normalizedId) {
        setError('Invalid meal ID format');
        setLoading(false);
        return;
      }

      console.log(`[MealDataFixer] Fetching meal data for ID: ${normalizedId}`);
      
      // Try to get from server
      const data = await getMealWithErrorHandling(normalizedId);
      
      if (data) {
        console.log(`[MealDataFixer] Successfully fetched meal data`);
        setMealData(data);
        
        // Save to localStorage as backup
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`meal_${normalizedId}`, JSON.stringify(data));
          } catch (e) {
            console.warn('[MealDataFixer] Failed to save to localStorage:', e);
          }
        }
      } else {
        console.warn(`[MealDataFixer] No meal data returned for ID: ${normalizedId}`);
        
        // Try to get from localStorage as fallback
        const localData = getLocalMealData(normalizedId);
        if (localData) {
          console.log(`[MealDataFixer] Using locally stored data as fallback`);
          setMealData({...localData, _fromLocal: true});
        } else {
          setError('Meal data not found');
        }
      }
    } catch (err) {
      console.error('[MealDataFixer] Error fetching meal data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching meal data');
      
      // Try local storage as last resort
      try {
        const localData = getLocalMealData(mealId);
        if (localData) {
          console.log(`[MealDataFixer] Using locally stored data after fetch error`);
          setMealData({...localData, _fromLocal: true, _fetchFailed: true});
        }
      } catch (e) {
        // Ignore errors from localStorage attempt
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mealId) {
      fetchMealData();
    } else {
      setLoading(false);
      setError('No meal ID provided');
    }
  }, [mealId]);

  return <>{children({ mealData, loading, error, refetch: fetchMealData })}</>;
} 