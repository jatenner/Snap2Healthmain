/**
 * Simplified localStorage utilities for development mode
 */

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

/**
 * localStorage for meals is no longer supported — real auth is required.
 * @deprecated Always returns false. Remove callers.
 */
export function shouldUseLocalStorage(): boolean {
  return false;
}

/**
 * Get a meal by ID from localStorage
 */
export function getLocalMealById(id: string): LocalMeal | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedMeals = localStorage.getItem('snap2health_meals');
    const meals = storedMeals ? JSON.parse(storedMeals) : [];
    return meals.find((meal: LocalMeal) => meal.id === id) || null;
  } catch (error) {
    console.error('Error retrieving meal by ID from localStorage:', error);
    return null;
  }
} 