import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getUserIdFromSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

// Example response structure for development
const generateMockAnalysis = (imageUrl: string) => {
  return {
    success: true,
    mealId: uuidv4(),
    mealContents: {
      foods: [
        { name: 'Oranges', amount: '4-5 medium' },
        { name: 'Citrus Fruits', amount: 'basket' }
      ]
    },
    mealAnalysis: {
      mealName: 'Fresh Oranges',
      calories: 250,
      macronutrients: [
        { name: 'Protein', amount: 5, unit: 'g', percentDailyValue: 10 },
        { name: 'Carbohydrates', amount: 60, unit: 'g', percentDailyValue: 20 },
        { name: 'Fat', amount: 0.5, unit: 'g', percentDailyValue: 1 },
        { name: 'Fiber', amount: 12, unit: 'g', percentDailyValue: 48 }
      ],
      micronutrients: [
        { name: 'Vitamin C', amount: 280, unit: 'mg', percentDailyValue: 311 },
        { name: 'Folate', amount: 120, unit: 'mcg', percentDailyValue: 30 },
        { name: 'Potassium', amount: 800, unit: 'mg', percentDailyValue: 17 },
        { name: 'Calcium', amount: 120, unit: 'mg', percentDailyValue: 12 }
      ],
      recoveryInsights: {
        proteinAdequacy: 'low',
        carbohydrateRefueling: 'moderate',
        inflammatoryProfile: 'anti-inflammatory'
      },
      benefits: [
        'Excellent source of vitamin C supporting immune function',
        'Contains antioxidants that help reduce inflammation',
        'Good source of dietary fiber for digestive health',
        'Natural sugars provide quick energy'
      ],
      concerns: [
        'Low protein content - insufficient for muscle recovery alone',
        'Acidic nature may cause digestive discomfort for some people'
      ],
      suggestions: [
        'Pair with a protein source like Greek yogurt or nuts',
        'Include some healthy fats like avocado or nut butter for a more balanced meal',
        'Consider adding other fruits for variety of nutrients',
        'Eat whole oranges rather than just juice to retain fiber content'
      ]
    }
  };
};

export async function POST(request: NextRequest) {
  try {
    // Skip authentication in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Only check authentication in production
    if (!isDevelopment) {
      try {
        // Get user ID from session
        const { userId, error } = await getUserIdFromSession(request);
        
        if (!userId || error) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
      } catch (authError) {
        console.warn('Authentication check failed:', authError);
        // Continue in development, fail in production
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ success: false, error: 'Authentication error' }, { status: 500 });
        }
      }
    }

    // Parse request body
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    console.log('Processing analysis request for image URL:', imageUrl);
    
    // Return mock data for development
    const mockResponse = generateMockAnalysis(imageUrl);
    
    // Add a small delay to simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
} 