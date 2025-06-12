import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[emergency-analysis] Providing emergency meal analysis');
  
  // Create a comprehensive emergency meal analysis that will always work
  const emergencyAnalysis = {
    id: 'emergency-meal-analysis',
    mealName: 'Sample Balanced Meal',
    description: 'A nutritionally balanced meal with lean protein, vegetables, and whole grains.',
    imageUrl: '/placeholder-meal.jpg',
    caption: 'Sample Balanced Meal',
    goal: 'General Wellness',
    image_url: '/placeholder-meal.jpg',
    
    // Nutrition data
    calories: 500,
    protein: 25,
    fat: 20,
    carbs: 45,
    fiber: 8,
    
    macronutrients: [
      { name: 'Protein', amount: 25, unit: 'g', percentDailyValue: null },
      { name: 'Total Carbohydrates', amount: 45, unit: 'g', percentDailyValue: null },
      { name: 'Dietary Fiber', amount: 8, unit: 'g', percentDailyValue: null },
      { name: 'Total Fat', amount: 20, unit: 'g', percentDailyValue: null },
      { name: 'Saturated Fat', amount: 6, unit: 'g', percentDailyValue: null },
      { name: 'Sodium', amount: 400, unit: 'mg', percentDailyValue: null }
    ],
    
    micronutrients: [
      { name: 'Vitamin A', amount: 300, unit: 'mcg', percentDailyValue: null },
      { name: 'Vitamin C', amount: 25, unit: 'mg', percentDailyValue: null },
      { name: 'Vitamin D', amount: 2, unit: 'mcg', percentDailyValue: null },
      { name: 'Vitamin B12', amount: 1.5, unit: 'mcg', percentDailyValue: null },
      { name: 'Folate', amount: 100, unit: 'mcg', percentDailyValue: null },
      { name: 'Calcium', amount: 200, unit: 'mg', percentDailyValue: null },
      { name: 'Iron', amount: 4, unit: 'mg', percentDailyValue: null },
      { name: 'Magnesium', amount: 80, unit: 'mg', percentDailyValue: null },
      { name: 'Potassium', amount: 600, unit: 'mg', percentDailyValue: null },
      { name: 'Zinc', amount: 3, unit: 'mg', percentDailyValue: null }
    ],
    
    ingredients: ['grilled chicken', 'brown rice', 'steamed broccoli', 'olive oil'],
    foods: ['chicken', 'rice', 'broccoli'],
    benefits: [
      'High-quality protein supports muscle maintenance',
      'Complex carbohydrates provide sustained energy',
      'Rich in vitamins and minerals for overall health'
    ],
    concerns: [
      'Note: This is sample data shown when original meal analysis is unavailable'
    ],
    suggestions: [
      'Try uploading a new meal for personalized analysis',
      'Check your meal history for previous analyses',
      'Ensure good lighting when taking meal photos'
    ],
    
    // Advanced analysis fields
    personalizedHealthInsights: 'This balanced meal provides excellent nutrition with lean protein, complex carbohydrates, and essential micronutrients. The combination supports sustained energy and overall health.',
    metabolicInsights: 'The protein content aids in muscle protein synthesis, while the complex carbohydrates provide steady glucose release for sustained energy.',
    nutritionalNarrative: 'This meal exemplifies balanced nutrition with its combination of lean protein, fiber-rich carbohydrates, and nutrient-dense vegetables.',
    timeOfDayOptimization: 'This meal is ideal for lunch or dinner, providing sustained energy and satiety for several hours.',
    mealStory: 'As you consume this meal, the protein will help maintain muscle mass, the carbohydrates will fuel your activities, and the vegetables will provide essential vitamins and antioxidants.',
    expertRecommendations: [
      'Consider adding a small portion of healthy fats like avocado',
      'Include a variety of colorful vegetables for maximum nutrient diversity',
      'Stay hydrated throughout the day'
    ],
    healthRating: 8,
    
    // Analysis object for compatibility
    analysis: {
      calories: 500,
      totalCalories: 500,
      macronutrients: [
        { name: 'Protein', amount: 25, unit: 'g', percentDailyValue: null },
        { name: 'Total Carbohydrates', amount: 45, unit: 'g', percentDailyValue: null },
        { name: 'Dietary Fiber', amount: 8, unit: 'g', percentDailyValue: null },
        { name: 'Total Fat', amount: 20, unit: 'g', percentDailyValue: null }
      ],
      micronutrients: [
        { name: 'Vitamin C', amount: 25, unit: 'mg', percentDailyValue: null },
        { name: 'Iron', amount: 4, unit: 'mg', percentDailyValue: null },
        { name: 'Calcium', amount: 200, unit: 'mg', percentDailyValue: null }
      ],
      personalizedHealthInsights: 'This balanced meal provides excellent nutrition with lean protein, complex carbohydrates, and essential micronutrients.',
      metabolicInsights: 'The protein content aids in muscle protein synthesis, while complex carbohydrates provide steady energy.',
      nutritionalNarrative: 'This meal exemplifies balanced nutrition with its combination of lean protein and nutrient-dense vegetables.',
      timeOfDayOptimization: 'Ideal for lunch or dinner, providing sustained energy and satiety.',
      mealStory: 'This meal supports muscle maintenance, sustained energy, and provides essential vitamins and antioxidants.',
      expertRecommendations: ['Consider adding healthy fats', 'Include variety of vegetables', 'Stay hydrated'],
      suggestions: ['Try uploading a new meal for personalized analysis'],
      benefits: ['High-quality protein', 'Sustained energy', 'Rich in nutrients'],
      concerns: ['Sample data - upload your meal for personalized insights'],
      healthRating: 8
    },
    
    // Metadata
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _emergency: true,
    _message: 'This is sample meal data shown when the original analysis cannot be found. Upload a new meal for personalized insights.'
  };
  
  return NextResponse.json(emergencyAnalysis);
}

export async function POST(request: NextRequest) {
  // Also support POST requests with meal ID for consistency
  const { mealId } = await request.json().catch(() => ({}));
  
  console.log(`[emergency-analysis] Providing emergency analysis for meal ID: ${mealId || 'unknown'}`);
  
  // Get the emergency analysis
  const emergencyResponse = await GET(request);
  const emergencyData = await emergencyResponse.json();
  
  // Add the original meal ID to the response
  if (mealId) {
    emergencyData._originalMealId = mealId;
    emergencyData._message = `Original meal ${mealId} not found. Showing emergency analysis instead.`;
  }
  
  return NextResponse.json(emergencyData);
} 