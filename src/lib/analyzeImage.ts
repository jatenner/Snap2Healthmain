import { v4 as uuidv4 } from 'uuid';
import type { AnalysisResult, MealContents, MealAnalysis } from '@/types/types';

/**
 * Safely gets a value from localStorage with a fallback
 */
function safeGetFromLocalStorage(key: string, fallback: string): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key) || fallback;
  }
  return fallback;
}

/**
 * Analyzes a food image to extract nutrition information using OpenAI
 * @param imageUrl URL of the image to analyze
 * @returns Analysis results including nutrition information
 */
export async function analyzeImage(imageUrl: string): Promise<AnalysisResult> {
  try {
    if (!imageUrl) {
      return {
        success: false,
        error: 'No image URL provided',
        mealContents: { proteins: '', carbs: '', vegetables: '', fats: '' },
        mealAnalysis: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, nutritionScore: 0, healthRating: '', recommendations: [] }
      };
    }

    // Use the unified OpenAI-powered endpoint
    const response = await fetch('/api/analyze-image/unified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        imageUrl,
        // Get user's goal from local storage if available
        goal: safeGetFromLocalStorage('userGoal', 'General Wellness')
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to analyze image',
        mealContents: { proteins: '', carbs: '', vegetables: '', fats: '' },
        mealAnalysis: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, nutritionScore: 0, healthRating: '', recommendations: [] }
      };
    }

    // Map the response data to expected format
    return {
      success: true,
      mealId: data.mealId || uuidv4(),
      mealContents: mapMealContents(data),
      mealAnalysis: mapMealAnalysis(data)
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      mealContents: { proteins: '', carbs: '', vegetables: '', fats: '' },
      mealAnalysis: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, nutritionScore: 0, healthRating: '', recommendations: [] }
    };
  }
}

/**
 * Helper function to map received meal contents to expected format
 */
function mapMealContents(analysisData: any): MealContents {
  // Extract proteins, carbs, etc. from macronutrients if present
  const proteins = analysisData?.macronutrients?.find((m: any) => m.name === 'Protein')?.amount || '';
  const carbs = analysisData?.macronutrients?.find((m: any) => m.name === 'Carbs')?.amount || '';
  
  // Use detected food information for better meal contents classification
  const detectedFood = analysisData?.detectedFood || '';
  
  return {
    proteins: `${proteins}g of protein from ${detectedFood.toLowerCase().includes('protein') ? detectedFood : 'food'}`,
    carbs: `${carbs}g of carbohydrates`,
    vegetables: detectedFood.toLowerCase().includes('vegetable') ? detectedFood : 'Food items in meal',
    fats: `${analysisData?.macronutrients?.find((m: any) => m.name === 'Fat')?.amount || ''}g of fat`
  };
}

/**
 * Helper function to map received meal analysis to expected format
 */
function mapMealAnalysis(analysisData: any): MealAnalysis {
  // Calculate nutrition score based on benefits vs concerns
  const benefits = analysisData?.benefits || [];
  const concerns = analysisData?.concerns || [];
  const nutritionScore = Math.min(100, Math.max(0, 
    50 + (benefits.length * 10) - (concerns.length * 5)
  ));
  
  // Determine health rating based on score
  let healthRating = 'Fair';
  if (nutritionScore >= 85) healthRating = 'Excellent';
  else if (nutritionScore >= 70) healthRating = 'Good';
  else if (nutritionScore >= 50) healthRating = 'Fair';
  else healthRating = 'Poor';
  
  return {
    calories: analysisData?.calories || 0,
    protein: analysisData?.macronutrients?.find((m: any) => m.name === 'Protein')?.amount || 0,
    carbs: analysisData?.macronutrients?.find((m: any) => m.name === 'Carbs')?.amount || 0,
    fats: analysisData?.macronutrients?.find((m: any) => m.name === 'Fat')?.amount || 0,
    fiber: analysisData?.micronutrients?.find((m: any) => m.name === 'Fiber')?.amount || 0,
    nutritionScore,
    healthRating,
    recommendations: analysisData?.suggestions || []
  };
} 