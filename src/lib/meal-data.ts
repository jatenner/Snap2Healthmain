/**
 * Functions for retrieving and processing meal data
 */

import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Note: getFullUserProfile is available in app/lib/profile-server-utils for server-side use only

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
  analysis?: ComprehensiveAnalysisData;
  createdAt: string;
  isLocal?: boolean;
}

// Define detailed structures for macro and micronutrients
interface NutrientDetail {
  name: string;
  amount: number | string;
  unit: string;
  percentDailyValue?: number | string; // Optional, as not all nutrients might have it
}

// Interface for the comprehensive analysis data to be stored in JSONB
export interface ComprehensiveAnalysisData {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  macronutrients?: NutrientDetail[];
  micronutrients?: NutrientDetail[];
  ingredients?: string[];
  foods_identified?: string[];
  meal_description?: string;
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  glycemic_load?: number;
  insights?: string;
  personalized_health_insights?: string;
  goal?: string;
}

// This is the primary data structure for a meal entry in history
export interface MealData {
  id?: string;
  userId?: string;
  mealName?: string;
  imageUrl?: string;
  
  foods?: string[];
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  analysis?: {
    macronutrients?: any;
    micronutrients?: any;
  };
  macronutrients?: NutrientDetail[];
  micronutrients?: NutrientDetail[];
  ingredients?: string[];
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  glycemicLoad?: number;
  insights?: string;
  personalizedHealthInsights?: string;
  description?: string;

  foods_identified?: string[];
  meal_description?: string;

  createdAt?: string;
  goal?: string;
}

// Example of mapping AI output (MealData) to what we store (MealHistoryEntry with ComprehensiveAnalysisData)
function mapAiDataToMealHistoryEntry(
  aiData: MealData,
  userId: string,
  imageUrl: string,
  mealNameProvided?: string,
): Omit<MealHistoryEntry, 'id' | 'createdAt'> {
  const mealId = aiData.id || uuidv4();
  const mealName = mealNameProvided || aiData.mealName || aiData.foods_identified?.join(', ') || 'Unnamed Meal';

  const analysisData: ComprehensiveAnalysisData = {
    calories: aiData.calories,
    protein: aiData.protein,
    fat: aiData.fat,
    carbs: aiData.carbs,
    macronutrients: aiData.macronutrients?.map(m => ({ ...m, percentDailyValue: m.percentDailyValue ?? m.percentDailyValue })) || [],
    micronutrients: aiData.micronutrients?.map(m => ({ ...m, percentDailyValue: m.percentDailyValue ?? m.percentDailyValue })) || [],
    ingredients: aiData.ingredients || [],
    foods_identified: aiData.foods_identified || aiData.foods || [],
    meal_description: aiData.meal_description || aiData.description,
    benefits: aiData.benefits || [],
    concerns: aiData.concerns || [],
    suggestions: aiData.suggestions || [],
    glycemic_load: aiData.glycemicLoad,
    insights: aiData.insights,
    personalized_health_insights: aiData.personalizedHealthInsights,
    goal: aiData.goal,
  };

  return {
    userId,
    mealName,
    imageUrl,
    analysis: analysisData,
  };
}

/**
 * Saves a meal analysis to the user's meal history
 * @param payload The meal data to save, conforming to MealHistoryPayload
 * @returns Object indicating success or failure
 */
export async function saveMealToHistory(
  mealData: MealData,
  userId: string,
  imageUrl: string,
  mealNameProvided?: string,
): Promise<MealHistoryEntry> {
  console.log('[saveMealToHistory] Received mealData:', JSON.stringify(mealData, null, 2));
  console.log('[saveMealToHistory] UserId:', userId);
  console.log('[saveMealToHistory] Image URL:', imageUrl);

  const mealId = mealData.id || uuidv4();
  
  const mappedData = mapAiDataToMealHistoryEntry(mealData, userId, imageUrl, mealNameProvided);

  const mealRecordToSave = {
    id: mealId,
    user_id: mappedData.userId,
    meal_name: mappedData.mealName,
    image_url: mappedData.imageUrl,
    analysis: mappedData.analysis,
    created_at: new Date().toISOString(),
  };

  console.log('[saveMealToHistory] Attempting to save to meals:', JSON.stringify(mealRecordToSave, null, 2));

  try {
    const { data, error } = await supabase
      .from('meals')
      .insert(mealRecordToSave)
      .select()
      .single();

    if (error) {
      console.error('[saveMealToHistory] Supabase error inserting meal:', error);
      throw error;
    }

    if (!data) {
      console.error('[saveMealToHistory] No data returned from Supabase after insert.');
      throw new Error('Failed to save meal to history: No data returned.');
    }
    
    console.log('[saveMealToHistory] Successfully saved meal:', JSON.stringify(data, null, 2));

    return {
      id: data.id,
      userId: data.user_id,
      mealName: data.meal_name,
      imageUrl: data.image_url,
      analysis: data.analysis as ComprehensiveAnalysisData,
      createdAt: data.created_at,
    };

  } catch (error) {
    console.error('[saveMealToHistory] Catch block error:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to save meal to history: ${error.message}`);
    }
    throw new Error('Failed to save meal to history due to an unknown error.');
  }
}

/**
 * Retrieves the user's meal history
 * @param limit Maximum number of meals to retrieve
 * @param offset Offset for pagination
 * @returns Array of meal history items or null on error
 */
export async function getMealHistory(userId: string): Promise<MealHistoryEntry[]> {
  if (!userId) {
    console.warn('[getMealHistory] No userId provided. Returning empty array.');
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMealHistory] Supabase error fetching meal history:', error);
      throw error;
    }
    
    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      mealName: item.meal_name,
      imageUrl: item.image_url,
      analysis: item.analysis as ComprehensiveAnalysisData,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('[getMealHistory] Error fetching meal history:', error);
    return [];
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
      .from('meals')
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

export async function getMealById(mealId: string, userId: string): Promise<MealHistoryEntry | null> {
  if (!mealId || !userId) {
    console.warn('[getMealById] mealId or userId not provided.');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[getMealById] Meal not found with id: ${mealId} for user: ${userId}`);
        return null;
      }
      console.error('[getMealById] Supabase error fetching meal by id:', error);
      throw error;
    }

    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      mealName: data.meal_name,
      imageUrl: data.image_url,
      analysis: data.analysis as ComprehensiveAnalysisData,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error(`[getMealById] Error fetching meal by id ${mealId}:`, error);
    return null;
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
      createdAt: now.toISOString(),
      analysis: {
        calories: 450,
        macronutrients: [
          { name: 'Carbs', amount: 55, unit: 'g', percentDailyValue: 18 },
          { name: 'Protein', amount: 5, unit: 'g', percentDailyValue: 10 },
          { name: 'Fat', amount: 22, unit: 'g', percentDailyValue: 30 },
        ],
        micronutrients: [
          { name: 'Vitamin C', amount: '100', unit: '%DV', percentDailyValue: 100 },
          { name: 'Potassium', amount: '300', unit: 'mg', percentDailyValue: 6 },
        ],
        foods_identified: ['Orange'],
        meal_description: "A serving of fresh oranges.",
        insights: "Excellent source of Vitamin C.",
        personalized_health_insights: "Good for boosting immunity, especially during flu season.",
        goal: 'Healthy Snacking'
      },
      isLocal: true,
    },
    {
      id: 'mock-2',
      userId: 'mock-user',
      mealName: 'Morning Breakfast',
      imageUrl: '/uploads/breakfast.jpg',
      createdAt: yesterday.toISOString(),
      analysis: {
        calories: 620,
        macronutrients: [
          { name: 'Carbs', amount: 65, unit: 'g', percentDailyValue: 20 },
          { name: 'Protein', amount: 25, unit: 'g', percentDailyValue: 15 },
          { name: 'Fat', amount: 22, unit: 'g', percentDailyValue: 20 },
        ],
        benefits: ['Balanced macronutrients', 'Good protein source'],
        concerns: [],
        suggestions: []
      },
      isLocal: true,
    }
  ];
}

export const mockMealHistory: MealHistoryEntry[] = createMockMealHistory();

// Export alias for backwards compatibility
export const fetchMealHistory = getMealHistory; 