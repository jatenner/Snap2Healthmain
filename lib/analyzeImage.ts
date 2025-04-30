import type { AnalysisResult } from '@/types/types';

// Mock implementation of image analysis
// In a real app, this would call an AI service like OpenAI's Vision API
export async function analyzeImage(imageUrl: string): Promise<AnalysisResult> {
  // Simulate a delay for "processing"
  await new Promise(resolve => setTimeout(resolve, 2000));
  
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
      calories: 550,
      protein: 35,
      carbs: 45,
      fats: 25,
      fiber: 12,
      nutritionScore: 85,
      healthRating: 'Excellent',
      recommendations: [
        'This meal has a good balance of protein, complex carbs, and healthy fats',
        'Try adding more leafy greens for additional vitamin K',
        'Consider reducing portion size of rice if weight loss is a goal',
        'Add a source of omega-3 fatty acids for better nutrition'
      ]
    }
  };
}

// Export the mock version as well for easier testing
export const analyzeImageMock = analyzeImage; 