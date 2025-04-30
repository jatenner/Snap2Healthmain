import { v4 as uuidv4 } from 'uuid';
import type { AnalysisResult } from '@/types/types';

/**
 * Analyzes a food image to extract nutrition information
 * @param imageUrl URL of the image to analyze
 * @returns Analysis results including nutrition information
 */
export async function analyzeImage(imageUrl: string): Promise<AnalysisResult> {
  try {
    if (!imageUrl) {
      return {
        success: false,
        error: 'No image URL provided'
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    
    // Call to the server API endpoint for image analysis
    const response = await fetch(`${apiUrl}/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to analyze image'
      };
    }

    return {
      success: true,
      mealId: data.mealId || uuidv4(),
      mealContents: data.mealContents,
      mealAnalysis: data.mealAnalysis
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Mock implementation of image analysis
// In a real app, this would call an AI service like OpenAI's Vision API
export async function analyzeImageMock(imageUrl: string): Promise<AnalysisResult> {
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