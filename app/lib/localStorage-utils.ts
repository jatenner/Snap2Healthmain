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
 * Checks if we should use localStorage for meals
 */
export function shouldUseLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
  const authBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
  const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === 'development';
  
  return (mockAuth || authBypass) && isDevelopment;
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