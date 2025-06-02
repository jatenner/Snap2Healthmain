import type { AnalysisResult } from '@/types/types';

// Mock implementation of image analysis for testing
export async function analyzeImage(imageUrl: string): Promise<AnalysisResult> {
  console.log(`[analyzeImage] Analyzing image at URL: ${imageUrl}`);
  
  // For testing, we'll return a mock result without actually analyzing the image
  console.log('[analyzeImage] Returning mock analysis results');
  
  // Create a timestamp to make each analysis unique
  const timestamp = new Date().toISOString();
  
  // Return mock meal analysis data
  return {
    success: true,
    mealContents: {
      proteins: 'Grilled chicken breast',
      carbs: 'Brown rice, quinoa',
      vegetables: 'Broccoli, spinach, bell peppers',
      fats: 'Olive oil, avocado'
    },
    mealAnalysis: {
      mealName: `Analyzed Meal (${timestamp})`,
      calories: 550,
      protein: 35,
      carbs: 45,
      fats: 25,
      fiber: 12,
      nutritionScore: 85,
      healthRating: 'Excellent',
      macronutrients: [
        { name: 'Protein', amount: 35, unit: 'g', percentDailyValue: 70 },
        { name: 'Carbs', amount: 45, unit: 'g', percentDailyValue: 15 },
        { name: 'Fat', amount: 25, unit: 'g', percentDailyValue: 38 },
        { name: 'Fiber', amount: 12, unit: 'g', percentDailyValue: 43 }
      ],
      micronutrients: [
        { name: 'Vitamin C', amount: 45, unit: 'mg', percentDailyValue: 50 },
        { name: 'Iron', amount: 3.6, unit: 'mg', percentDailyValue: 20 },
        { name: 'Calcium', amount: 120, unit: 'mg', percentDailyValue: 12 }
      ],
      foods: [
        { name: 'Grilled chicken breast', amount: '4 oz', calories: 150 },
        { name: 'Brown rice', amount: '1/2 cup', calories: 110 },
        { name: 'Broccoli', amount: '1 cup', calories: 55 },
        { name: 'Olive oil', amount: '1 tsp', calories: 40 }
      ],
      recommendations: [
        'This meal has a good balance of protein, complex carbs, and healthy fats',
        'Try adding more leafy greens for additional vitamin K',
        'Consider reducing portion size of rice if weight loss is a goal',
        'Add a source of omega-3 fatty acids for better nutrition'
      ],
      imageUrl: imageUrl
    }
  };
}

// Export the mock version as well for easier testing
export const analyzeImageMock = analyzeImage; 