import { createBrowserClient } from '@supabase/ssr';
import { v4 as uuidv4 } from 'uuid';

export interface MealAnalysisResult {
  mealName: string;
  calories: number;
  macronutrients: any[];
  micronutrients: any[];
  benefits?: string[];
  concerns?: string[];
  goal?: string;
}

interface MealData {
  userId: string;
  imageUrl: string;
  mealName: string;
  analysis: any;
  goal?: string;
}

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Saves meal analysis data to Supabase or local storage
 * 
 * @param mealData - The meal data to save
 * @returns The created meal ID and success status
 */
export async function saveMealAnalysis(mealData: MealData): Promise<{ 
  success: boolean; 
  mealId: string; 
  error?: string;
}> {
  try {
    const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === 'development';
    const mockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
    
    // In development or mock mode, save to localStorage
    if (isDevelopment || mockAuth) {
      console.log('Using mock storage for meal data in development mode');
      
      const mealId = uuidv4();
      const storedMeals = JSON.parse(localStorage.getItem('snap2health_meals') || '[]');
      
      const mealWithId = {
        id: mealId,
        userId: mealData.userId,
        imageUrl: mealData.imageUrl,
        mealName: mealData.mealName,
        analysis: mealData.analysis,
        goal: mealData.goal || 'General Wellness',
        created_at: new Date().toISOString(),
      };
      
      storedMeals.push(mealWithId);
      localStorage.setItem('snap2health_meals', JSON.stringify(storedMeals));
      
      return { success: true, mealId };
    }
    
    // In production, save to Supabase
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: mealData.userId,
        image_url: mealData.imageUrl,
        meal_name: mealData.mealName,
        analysis: mealData.analysis,
        goal: mealData.goal || 'General Wellness',
      })
      .select('id')
      .single();
    
    if (error) {
      throw error;
    }
    
    return { success: true, mealId: data.id };
    
  } catch (error) {
    console.error('Error saving meal analysis:', error);
    return { 
      success: false, 
      mealId: '', 
      error: error instanceof Error ? error.message : 'Unknown error saving meal data' 
    };
  }
}

/**
 * Gets meal history from Supabase or local storage
 * 
 * @param userId - The user ID to get meals for
 * @returns Array of meal data
 */
export async function getMealHistory(userId: string): Promise<{
  success: boolean;
  meals: any[];
  error?: string;
}> {
  try {
    const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === 'development';
    const mockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
    
    // In development or mock mode, get from localStorage
    if (isDevelopment || mockAuth) {
      console.log('Using mock storage for meal history in development mode');
      
      const storedMeals = JSON.parse(localStorage.getItem('snap2health_meals') || '[]');
      const userMeals = storedMeals.filter((meal: any) => meal.userId === userId);
      
      // Sort by creation date descending
      userMeals.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      return { success: true, meals: userMeals };
    }
    
    // In production, get from Supabase
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, meals: data || [] };
    
  } catch (error) {
    console.error('Error getting meal history:', error);
    return { 
      success: false, 
      meals: [], 
      error: error instanceof Error ? error.message : 'Unknown error getting meal history' 
    };
  }
} 