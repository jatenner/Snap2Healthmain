import { v4 as uuidv4 } from 'uuid';
import type { AnalysisResult, MealContents, MealAnalysis } from '@/types/types';

/**
 * Analyzes a food image to extract nutrition information
 * @param imageUrl URL of the image to analyze
 * @param goal Optional health goal to personalize analysis (e.g., "Weight Loss", "Muscle Gain", etc)
 * @param userProfile Optional user profile data for personalized analysis
 * @returns Analysis results including nutrition information
 */
export async function analyzeImage(imageUrl: string, goal?: string, userProfile?: any): Promise<any> {
  // Number of retry attempts
  const MAX_RETRIES = 2;
  let retryCount = 0;
  
  // Add timeout for fetch operations
  const FETCH_TIMEOUT = 20000; // 20 seconds
  
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  
  // Compress the image URL if it's a data URL to reduce memory usage
  let processedImageUrl = imageUrl;
  if (imageUrl?.startsWith('data:image') && imageUrl.length > 50000) {
    try {
      // Extract base64 data
      const base64Data = imageUrl.split(',')[1];
      // Take just enough data to identify the image (first 10000 chars)
      const truncatedData = base64Data.substring(0, 10000);
      processedImageUrl = `data:image/jpeg;base64,${truncatedData}...`;
      console.log('Compressed image URL from', imageUrl.length, 'to', processedImageUrl.length, 'chars');
    } catch (err) {
      console.warn('Failed to compress image URL:', err);
    }
  }
  
  // Retry logic wrapper function
  const fetchWithRetry = async () => {
    try {
      if (!imageUrl) {
        console.error('Error: No image URL provided');
        return getFallbackResponse('No image URL provided');
      }

      console.log('Calling API to analyze image (length:', (imageUrl?.length || 0), 'chars)');
      
      if (userProfile) {
        // Log the profile data we're sending (excluding sensitive data)
        const profileSummary = {
          hasAge: !!userProfile.age,
          hasWeight: !!userProfile.weight,
          hasHeight: !!userProfile.height,
          hasGender: !!userProfile.gender,
          hasActivityLevel: !!userProfile.activityLevel,
          hasGoals: !!userProfile.goals
        };
        console.log('Profile data summary:', profileSummary);
      }
      
      // Add cache-busting parameter to the URL
      const timestamp = Date.now();
      const apiUrl = `/api/analyze-image?t=${timestamp}`;
      
      // Format the user profile data to ensure it has all expected fields
      const formattedUserProfile = userProfile ? {
        gender: userProfile.gender || 'neutral',
        age: userProfile.age || 35,
        weight: userProfile.weight || 160,
        height: userProfile.height || 67,
        activityLevel: userProfile.activityLevel || 'moderate',
        // Add any additional fields that might be needed
        goals: userProfile.goals || [],
        healthConditions: userProfile.healthConditions || []
      } : null;
      
      // Call the analysis API with timeout
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Skip-Static-Generation': 'true',
        },
        body: JSON.stringify({ 
          imageUrl: processedImageUrl, 
          goal,
          userProfile: formattedUserProfile || {},
          timestamp: timestamp,
        }),
        signal: controller.signal
      });

      // Clear the timeout since fetch completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        
        // If we can retry and this is a 5xx error (server error)
        if (retryCount < MAX_RETRIES && response.status >= 500) {
          retryCount++;
          console.log(`Retrying (${retryCount}/${MAX_RETRIES})...`);
          
          // Exponential backoff: wait longer for each retry
          const backoffTime = 1000 * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          
          // Retry the request
          return fetchWithRetry();
        }
        
        // Return error with status code for better troubleshooting
        let errorMessage = 'Failed to analyze image';
        
        if (response.status === 429) {
          errorMessage = 'Too many requests. Please try again in a moment.';
        } else if (response.status === 404) {
          errorMessage = 'Analysis service not found.';
        } else if (response.status === 500) {
          errorMessage = 'Server error while analyzing image.';
        } else if (response.status === 503) {
          errorMessage = 'Analysis service is temporarily unavailable.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid request. Please check the image format.';
        } else if (response.status > 400) {
          errorMessage = `Analysis failed (${response.status}).`;
        }
        
        return getFallbackResponse(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing API response JSON:', jsonError);
        return getFallbackResponse('Failed to parse analysis response');
      }
      
      // Add detailed console logging
      console.log('API response success:', data.success);
      console.log('API mealName:', data.mealAnalysis?.mealName);
      
      // Validate essential data properties
      if (!data.mealAnalysis) {
        console.error('API response missing mealAnalysis property');
        return getFallbackResponse('Invalid response format');
      }
      
      // Ensure required properties exist to prevent UI errors
      ensureResponseProperties(data);
      
      return data;
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      
      // Handle abort errors (timeouts)
      if (error.name === 'AbortError') {
        console.error('Request timed out after', FETCH_TIMEOUT, 'ms');
        return getFallbackResponse('Analysis request timed out. Please try again.');
      }
      
      console.error('Error analyzing image:', error);
      
      // If we can retry for network errors
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Network error, retrying (${retryCount}/${MAX_RETRIES})...`);
        
        // Exponential backoff: wait longer for each retry
        const backoffTime = 1000 * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Retry the request
        return fetchWithRetry();
      }
      
      return getFallbackResponse('Network error while analyzing image');
    }
  };
  
  // Start the fetch with retry logic
  return fetchWithRetry();
}

// Helper function to get fallback response
function getFallbackResponse(errorMessage: string) {
  return {
    success: false,
    error: errorMessage,
    mealContents: { proteins: '', carbs: '', vegetables: '', fats: '' },
    mealAnalysis: {
      mealName: 'Your Meal',
      calories: 450,
      macroRatios: {
        proteinPercentage: 25,
        carbPercentage: 50, 
        fatPercentage: 25
      },
      macronutrients: [
        { name: 'Protein', amount: 25, unit: 'g', percentDailyValue: 50 },
        { name: 'Carbohydrates', amount: 45, unit: 'g', percentDailyValue: 15 },
        { name: 'Fat', amount: 15, unit: 'g', percentDailyValue: 20 }
      ],
      micronutrients: []
    }
  };
}

// Helper function to ensure all required properties exist
function ensureResponseProperties(data: any) {
  if (!data.mealAnalysis.macronutrients) {
    console.warn('API response missing macronutrients array, adding default');
    data.mealAnalysis.macronutrients = [
      { name: 'Protein', amount: 25, unit: 'g', percentDailyValue: 50 },
      { name: 'Carbohydrates', amount: 45, unit: 'g', percentDailyValue: 15 },
      { name: 'Fat', amount: 15, unit: 'g', percentDailyValue: 20 }
    ];
  }
  
  if (!data.mealAnalysis.micronutrients) {
    console.warn('API response missing micronutrients array, adding empty array');
    data.mealAnalysis.micronutrients = [];
  }
  
  if (!data.mealAnalysis.macroRatios) {
    console.warn('API response missing macroRatios, adding default');
    data.mealAnalysis.macroRatios = {
      proteinPercentage: 25,
      carbPercentage: 50,
      fatPercentage: 25
    };
  }
  
  // Ensure response has success property
  if (data.success === undefined) {
    data.success = true;
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