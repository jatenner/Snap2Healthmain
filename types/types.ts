export interface MealContents {
  proteins: string;
  carbs: string;
  vegetables: string;
  fats: string;
}

export interface MealAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  nutritionScore: number;
  healthRating: string;
  recommendations: string[];
}

export interface AnalysisResult {
  success: boolean;
  mealContents: MealContents;
  mealAnalysis: MealAnalysis;
  error?: string;
  mealId?: string;
} 