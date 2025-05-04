export interface MealContents {
  proteins: string;
  carbs: string;
  vegetables: string;
  fats: string;
}

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue: number;
  description: string;
  benefits: string;
}

export interface MealAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  nutritionScore: number;
  healthRating: string;
  recommendations: string[] | string;
  macronutrients?: Nutrient[];
  micronutrients?: Nutrient[];
  mealName?: string;
  personalizedStory?: string;
  allergensInfo?: any;
  digestiveHealth?: any;
  recoveryInsights?: any;
  macroRatios?: {
    proteinPercentage: number;
    carbPercentage: number;
    fatPercentage: number;
  };
  aiAnalysis?: string;
  benefits?: string[];
  userSpecificNotes?: Array<{ nutrient: string; note: string }>;
}

export interface AnalysisResult {
  success: boolean;
  mealContents: MealContents;
  mealAnalysis: MealAnalysis;
  error?: string;
  mealId?: string;
} 