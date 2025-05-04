import { formatMealTime } from './formatMealTime';

/**
 * Utilities for managing meals in localStorage for development/bypass auth mode
 */

// Type definition for a locally stored meal
export interface LocalMeal {
  id: string;
  created_at: string;
  user_id?: string;
  image_url?: string;
  caption?: string;
  analysis?: any;
  ingredients?: string[];
  goal?: string;
}

const LOCAL_STORAGE_KEY = 'snap2health_meals';

/**
 * Checks if we should use localStorage for meals
 * This is relevant when working in development mode with auth bypass
 */
export function shouldUseLocalStorage(): boolean {
  // On the server side, never use localStorage
  if (typeof window === 'undefined') return false;
  
  // Check if we're in development mode with auth bypass
  const mockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
  const authBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
  const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === 'development';
  
  return (mockAuth || authBypass) && isDevelopment;
}

/**
 * Get all meals from localStorage
 */
export function getLocalMeals(): LocalMeal[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedMeals = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedMeals ? JSON.parse(storedMeals) : [];
  } catch (error) {
    console.error('Error retrieving meals from localStorage:', error);
    return [];
  }
}

/**
 * Get a meal by ID from localStorage
 */
export function getLocalMealById(id: string): LocalMeal | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const meals = getLocalMeals();
    return meals.find(meal => meal.id === id) || null;
  } catch (error) {
    console.error('Error retrieving meal by ID from localStorage:', error);
    return null;
  }
}

/**
 * Save a meal to localStorage
 */
export function saveLocalMeal(meal: LocalMeal): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const meals = getLocalMeals();
    const existingIndex = meals.findIndex(m => m.id === meal.id);
    
    if (existingIndex >= 0) {
      // Update existing meal
      meals[existingIndex] = meal;
    } else {
      // Add new meal
      meals.push(meal);
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(meals));
    return true;
  } catch (error) {
    console.error('Error saving meal to localStorage:', error);
    return false;
  }
}

/**
 * Delete a meal from localStorage
 */
export function deleteLocalMeal(id: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const meals = getLocalMeals();
    const filteredMeals = meals.filter(meal => meal.id !== id);
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredMeals));
    return true;
  } catch (error) {
    console.error('Error deleting meal from localStorage:', error);
    return false;
  }
}

/**
 * Clear all meals from localStorage
 */
export const clearLocalMeals = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('[localStorageMeals] Error clearing meals from localStorage:', error);
  }
}; 