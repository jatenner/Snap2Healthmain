import { formatMealTime } from './formatMealTime';

/**
 * Utilities for managing meals in localStorage for development/bypass auth mode
 */

// Type definition for a locally stored meal
export interface LocalMeal {
  id: string;
  created_at: string;
  image_url?: string;
  caption?: string;
  analysis?: string;
  ingredients?: any[];
  user_id?: string;
}

const LOCAL_MEALS_KEY = 'snap2health_local_meals';

/**
 * Check if we should use localStorage for storing/fetching meals
 * This happens in auth bypass mode
 */
export const shouldUseLocalStorage = (): boolean => {
  return process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
};

/**
 * Get all meals from localStorage
 */
export const getLocalMeals = (): LocalMeal[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const storedMeals = localStorage.getItem(LOCAL_MEALS_KEY);
    if (!storedMeals) {
      return [];
    }
    
    return JSON.parse(storedMeals);
  } catch (error) {
    console.error('[localStorageMeals] Error getting meals from localStorage:', error);
    return [];
  }
};

/**
 * Save a new meal to localStorage
 */
export const saveLocalMeal = (meal: LocalMeal): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Get existing meals
    const meals = getLocalMeals();
    
    // Add the new meal at the beginning
    meals.unshift(meal);
    
    // Save back to localStorage
    localStorage.setItem(LOCAL_MEALS_KEY, JSON.stringify(meals));
  } catch (error) {
    console.error('[localStorageMeals] Error saving meal to localStorage:', error);
  }
};

/**
 * Get a specific meal by ID from localStorage
 */
export const getLocalMealById = (id: string): LocalMeal | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const meals = getLocalMeals();
    return meals.find(meal => meal.id === id) || null;
  } catch (error) {
    console.error('[localStorageMeals] Error getting meal by ID from localStorage:', error);
    return null;
  }
};

/**
 * Delete a meal from localStorage
 */
export const deleteLocalMeal = (id: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const meals = getLocalMeals();
    const updatedMeals = meals.filter(meal => meal.id !== id);
    localStorage.setItem(LOCAL_MEALS_KEY, JSON.stringify(updatedMeals));
  } catch (error) {
    console.error('[localStorageMeals] Error deleting meal from localStorage:', error);
  }
};

/**
 * Clear all meals from localStorage
 */
export const clearLocalMeals = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(LOCAL_MEALS_KEY);
  } catch (error) {
    console.error('[localStorageMeals] Error clearing meals from localStorage:', error);
  }
}; 