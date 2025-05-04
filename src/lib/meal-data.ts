/**
 * Functions for retrieving and processing meal data
 */

import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Default meal data for testing/fallback
const mockMealData = {
  id: "mock-meal-123",
  image: "/images/meal-sample.jpg",
  caption: "Fresh Oranges",
  nutritionalInfo: {
    calories: 62,
    macronutrients: [
      {
        name: "Carbohydrates",
        amount: 15.4,
        unit: "g",
        percentDailyValue: 5,
        description: "Natural sugars that provide energy"
      },
      {
        name: "Fiber",
        amount: 3.1,
        unit: "g",
        percentDailyValue: 11,
        description: "Aids digestion and promotes satiety"
      },
      {
        name: "Protein",
        amount: 1.2,
        unit: "g",
        percentDailyValue: 2,
        description: "Essential for cell repair and growth"
      },
      {
        name: "Fat",
        amount: 0.2,
        unit: "g",
        percentDailyValue: 0,
        description: "Minimal amounts of healthy fats"
      }
    ],
    micronutrients: [
      {
        name: "Vitamin C",
        amount: 69.7,
        unit: "mg",
        percentDailyValue: 77,
        description: "Powerful antioxidant that supports immune function"
      },
      {
        name: "Folate",
        amount: 39.7,
        unit: "μg",
        percentDailyValue: 10,
        description: "Important for cell division and DNA synthesis"
      },
      {
        name: "Potassium",
        amount: 237,
        unit: "mg",
        percentDailyValue: 5,
        description: "Helps maintain proper fluid balance and nerve function"
      },
      {
        name: "Thiamine",
        amount: 0.11,
        unit: "mg",
        percentDailyValue: 9,
        description: "Helps convert food into energy"
      }
    ],
    benefits: [
      "Rich source of vitamin C, supporting immune health",
      "Low glycemic index, providing steady energy release",
      "Contains antioxidants that help reduce inflammation"
    ],
    concerns: [
      "Natural sugars may affect blood glucose levels if consumed in large quantities"
    ],
    suggestions: [
      "Pair with a source of protein like Greek yogurt for a balanced snack",
      "Include the white pith between the flesh and peel for additional fiber",
      "Enjoy at room temperature to maximize flavor and juice content"
    ]
  }
};

/**
 * Retrieves meal data from API or falls back to mock data
 */
export async function getMealData() {
  try {
    // Return mock data for now - in production this would hit an API
    return mockMealData;
  } catch (error) {
    console.error("Error fetching meal data:", error);
    return mockMealData;
  }
}

/**
 * Safely processes analysis data to ensure it's in a consistent format
 * @param mealData Raw meal data object
 * @returns Normalized analysis data
 */
export function getSafeAnalysisData(mealData: any) {
  if (!mealData) return {};
  
  // Use nutritionalInfo directly if available
  const rawData = mealData.nutritionalInfo || mealData.analysisResult || mealData;
  
  // Create a normalized analysis object that handles various input formats
  return {
    calories: rawData.calories || 0,
    macronutrients: rawData.macronutrients || [],
    micronutrients: rawData.micronutrients || [],
    benefits: rawData.benefits || [],
    concerns: rawData.concerns || [],
    suggestions: rawData.suggestions || [],
    overview: rawData.overview || "Nutritional information for this meal."
  };
}

/**
 * Interface representing a meal history entry
 */
export interface MealHistoryEntry {
  id: string | number;
  userId: string;
  mealName: string;
  imageUrl: string;
  goal?: string;
  analysis?: any;
  createdAt: string;
  isLocal?: boolean;
}

// The raw database row format
export interface MealHistoryRow {
  id: string | number;
  user_id: string;
  meal_name: string;
  image_url: string;
  goal?: string;
  analysis?: any;
  created_at: string;
}

/**
 * Fetches meal history for the current user
 * @returns Array of meal history entries
 */
export async function fetchMealHistory(): Promise<MealHistoryEntry[]> {
  try {
    // Check for active session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      if (process.env.NEXT_PUBLIC_AUTH_BYPASS !== 'true') {
        console.error('No active session for fetching meals');
        return [];
      }
      console.log('Using auth bypass mode for meal fetch');
    }
    
    // Get user ID (or use test ID in bypass mode)
    const userId = sessionData.session?.user.id || 'test-user-bypass';
    
    let supabaseMeals: MealHistoryEntry[] = [];
    
    // Try to fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('meal_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching meal history:', error);
      } else if (data) {
        supabaseMeals = data.map((entry: MealHistoryRow) => ({
          id: entry.id,
          userId: entry.user_id,
          mealName: entry.meal_name,
          imageUrl: entry.image_url,
          goal: entry.goal,
          analysis: entry.analysis,
          createdAt: entry.created_at
        }));
      }
    } catch (e) {
      console.warn('Error accessing Supabase meal history:', e);
    }
    
    // Get local storage meals as a fallback or supplement
    let localMeals: MealHistoryEntry[] = [];
    try {
      if (typeof window !== 'undefined') {
        const localMealsRaw = JSON.parse(localStorage.getItem('snapHealthMeals') || '[]');
        localMeals = localMealsRaw.map((entry: any) => ({
          id: entry.id,
          userId: entry.user_id,
          mealName: entry.meal_name,
          imageUrl: entry.image_url,
          goal: entry.goal,
          analysis: entry.analysis,
          createdAt: entry.created_at,
          isLocal: true
        }));
      }
    } catch (storageError) {
      console.error('Error reading from local storage:', storageError);
    }
    
    // Combine both sources, filtering out duplicates by giving preference to Supabase entries
    const supabaseIds = new Set(supabaseMeals.map(meal => meal.id));
    const combinedMeals = [
      ...supabaseMeals,
      ...localMeals.filter(meal => !meal.id.toString().includes('local-') || !supabaseIds.has(meal.id))
    ];
    
    // Sort by date (newest first)
    return combinedMeals.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error in fetchMealHistory:', error);
    return [];
  }
}

/**
 * Creates mock meal history data for testing
 */
function createMockMealHistory(): MealHistoryEntry[] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return [
    {
      id: 'mock-1',
      userId: 'mock-user',
      mealName: 'Fresh Oranges',
      imageUrl: '/uploads/oranges.jpeg',
      goal: 'Weight Loss',
      createdAt: now.toISOString(),
      analysis: {
        calories: 450,
        macronutrients: [
          { name: 'Carbs', amount: 55, unit: 'g' },
          { name: 'Protein', amount: 20, unit: 'g' },
          { name: 'Fat', amount: 15, unit: 'g' }
        ],
        benefits: ['Good source of vitamin C', 'High in fiber', 'Supports hydration'],
        concerns: ['Natural sugar content'],
        suggestions: ['Pair with protein for balanced meal']
      }
    },
    {
      id: 'mock-2',
      userId: 'mock-user',
      mealName: 'Morning Breakfast',
      imageUrl: '/uploads/breakfast.jpg',
      goal: 'General Wellness',
      createdAt: yesterday.toISOString(),
      analysis: {
        calories: 620,
        macronutrients: [
          { name: 'Carbs', amount: 65, unit: 'g' },
          { name: 'Protein', amount: 25, unit: 'g' },
          { name: 'Fat', amount: 22, unit: 'g' }
        ],
        benefits: ['Balanced macronutrients', 'Good protein source'],
        concerns: [],
        suggestions: []
      }
    }
  ];
}

export interface MealEntry {
  id?: string;
  mealId?: string;
  mealName: string;
  imageUrl: string;
  mealContents?: any;
  analysis?: any;
  goal?: string;
  created_at?: string;
}

interface MealData {
  mealName: string;
  imageUrl: string;
  mealContents: any;
  analysis: any;
  tags?: string[];
}

/**
 * Saves a meal analysis to the user's meal history
 * @param mealData The meal data to save
 * @returns Object indicating success or failure
 */
export async function saveMealToHistory(mealData: MealData): Promise<{
  success: boolean;
  mealId?: string;
  message?: string;
}> {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }
    
    // Save the meal to the database
    const { data, error } = await supabase
      .from('meal_history')
      .insert({
        user_id: user.id,
        meal_name: mealData.mealName,
        image_url: mealData.imageUrl,
        meal_contents: mealData.mealContents,
        analysis: mealData.analysis,
        tags: mealData.tags || [],
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving meal to history:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    return {
      success: true,
      mealId: data.id
    };
  } catch (error) {
    console.error('Exception saving meal to history:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Retrieves the user's meal history
 * @param limit Maximum number of meals to retrieve
 * @param offset Offset for pagination
 * @returns Array of meal history items or null on error
 */
export async function getMealHistory(limit = 10, offset = 0): Promise<{
  success: boolean;
  meals?: any[];
  message?: string;
}> {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }
    
    // Retrieve the user's meal history
    const { data, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error retrieving meal history:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    return {
      success: true,
      meals: data
    };
  } catch (error) {
    console.error('Exception retrieving meal history:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Deletes a meal entry from history
 * @param mealId ID of the meal to delete
 * @returns Success status
 */
export async function deleteMealFromHistory(mealId: string): Promise<{ success: boolean }> {
  try {
    // Check if this is a local meal (starts with 'local-')
    const isLocalMeal = mealId.toString().startsWith('local-');
    
    if (isLocalMeal) {
      try {
        // Only attempt localStorage in browser environment
        if (typeof window !== 'undefined') {
          // Get existing meals
          const existingMeals = JSON.parse(localStorage.getItem('snapHealthMeals') || '[]');
          const filteredMeals = existingMeals.filter((meal: any) => meal.id !== mealId);
          
          if (filteredMeals.length !== existingMeals.length) {
            localStorage.setItem('snapHealthMeals', JSON.stringify(filteredMeals));
            console.log('Deleted meal from local storage');
            return { success: true };
          } else {
            console.error('Could not find local meal with ID:', mealId);
            return { success: false };
          }
        }
      } catch (storageError) {
        console.error('Error accessing local storage:', storageError);
        return { success: false };
      }
    }
    
    // For non-local meals, proceed with Supabase deletion
    // Check for active session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      if (process.env.NEXT_PUBLIC_AUTH_BYPASS !== 'true') {
        console.error('No active session for deleting meal');
        return { success: false };
      }
      console.log('Using auth bypass mode for meal deletion');
    }
    
    // Delete the meal entry
    const { error } = await supabase
      .from('meal_history')
      .delete()
      .eq('id', mealId);
    
    if (error) {
      console.error('Error deleting meal from history:', error);
      return { success: false };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteMealFromHistory:', error);
    return { success: false };
  }
} 