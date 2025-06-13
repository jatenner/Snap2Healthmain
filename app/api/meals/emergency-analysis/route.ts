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
  try {
    const body = await request.json();
    const { originalMealId, reason } = body;

    console.log('[EmergencyAnalysis] Creating emergency analysis for:', originalMealId, 'Reason:', reason);

    // Create a comprehensive emergency meal analysis
    const emergencyAnalysis = {
      id: `emergency-${Date.now()}`,
      mealName: "Sample Nutritious Meal",
      mealDescription: "A balanced meal with protein, carbohydrates, and healthy fats to support your nutritional goals.",
      calories: 450,
      protein: 25,
      fat: 18,
      carbs: 45,
      fiber: 8,
      foods: ["lean protein", "whole grains", "vegetables", "healthy fats"],
      ingredients: ["chicken breast", "quinoa", "broccoli", "olive oil", "bell peppers", "spinach"],
      macronutrients: [
        { name: "Protein", amount: 25, unit: "g", percentDailyValue: 50 },
        { name: "Total Carbohydrates", amount: 45, unit: "g", percentDailyValue: 15 },
        { name: "Dietary Fiber", amount: 8, unit: "g", percentDailyValue: 32 },
        { name: "Total Fat", amount: 18, unit: "g", percentDailyValue: 23 },
        { name: "Saturated Fat", amount: 3, unit: "g", percentDailyValue: 15 },
        { name: "Sodium", amount: 380, unit: "mg", percentDailyValue: 17 }
      ],
      micronutrients: [
        { name: "Vitamin A", amount: 850, unit: "mcg", percentDailyValue: 94 },
        { name: "Vitamin C", amount: 95, unit: "mg", percentDailyValue: 106 },
        { name: "Vitamin D", amount: 2.5, unit: "mcg", percentDailyValue: 13 },
        { name: "Vitamin E", amount: 4, unit: "mg", percentDailyValue: 27 },
        { name: "Vitamin K", amount: 120, unit: "mcg", percentDailyValue: 100 },
        { name: "Thiamin (B1)", amount: 0.8, unit: "mg", percentDailyValue: 67 },
        { name: "Riboflavin (B2)", amount: 1.2, unit: "mg", percentDailyValue: 92 },
        { name: "Niacin (B3)", amount: 12, unit: "mg", percentDailyValue: 75 },
        { name: "Vitamin B6", amount: 1.5, unit: "mg", percentDailyValue: 88 },
        { name: "Folate", amount: 180, unit: "mcg", percentDailyValue: 45 },
        { name: "Vitamin B12", amount: 2.8, unit: "mcg", percentDailyValue: 117 },
        { name: "Calcium", amount: 180, unit: "mg", percentDailyValue: 14 },
        { name: "Iron", amount: 4.2, unit: "mg", percentDailyValue: 23 },
        { name: "Magnesium", amount: 95, unit: "mg", percentDailyValue: 23 },
        { name: "Phosphorus", amount: 320, unit: "mg", percentDailyValue: 26 },
        { name: "Potassium", amount: 680, unit: "mg", percentDailyValue: 14 },
        { name: "Zinc", amount: 3.8, unit: "mg", percentDailyValue: 35 },
        { name: "Copper", amount: 0.4, unit: "mg", percentDailyValue: 44 },
        { name: "Manganese", amount: 1.2, unit: "mg", percentDailyValue: 52 },
        { name: "Selenium", amount: 28, unit: "mcg", percentDailyValue: 51 }
      ],
      phytonutrients: [
        { name: "Beta-carotene", amount: 2800, unit: "mcg", percentDailyValue: null },
        { name: "Lutein + Zeaxanthin", amount: 1200, unit: "mcg", percentDailyValue: null },
        { name: "Lycopene", amount: 450, unit: "mcg", percentDailyValue: null },
        { name: "Quercetin", amount: 15, unit: "mg", percentDailyValue: null },
        { name: "Anthocyanins", amount: 8, unit: "mg", percentDailyValue: null }
      ],
      personalizedHealthInsights: "This balanced meal provides excellent nutritional variety with high-quality protein for muscle maintenance, complex carbohydrates for sustained energy, and a rich array of vitamins and minerals. The fiber content supports digestive health, while the antioxidants help protect against cellular damage.",
      metabolicInsights: "The combination of lean protein and complex carbohydrates provides steady blood sugar levels and sustained energy release. The healthy fats support hormone production and nutrient absorption, while the high fiber content promotes satiety and digestive health.",
      mealStory: "As you consume this nutritious meal, the protein begins muscle repair and maintenance processes, while the complex carbohydrates provide steady glucose for brain and muscle function. The diverse array of vitamins and minerals support numerous enzymatic processes throughout your body.",
      nutritionalNarrative: "This meal exemplifies balanced nutrition with its comprehensive nutrient profile. The combination of macronutrients supports both immediate energy needs and long-term health goals, while the micronutrients ensure optimal cellular function and metabolic processes.",
      timeOfDayOptimization: "This meal is versatile and can be enjoyed at any time of day. For breakfast, it provides sustained energy for the morning ahead. As lunch, it maintains afternoon productivity. For dinner, it supports overnight recovery and repair processes.",
      expertRecommendations: [
        "Consider adding a small portion of healthy fats like avocado or nuts to enhance nutrient absorption",
        "Pair with a glass of water to support proper hydration",
        "Try to eat mindfully, chewing thoroughly to aid digestion",
        "Consider the timing of this meal in relation to your physical activity for optimal energy utilization"
      ],
      benefits: [
        "Provides complete amino acid profile for muscle maintenance",
        "Rich in antioxidants for cellular protection",
        "High fiber content supports digestive health",
        "Balanced macronutrients for sustained energy",
        "Comprehensive micronutrient profile supports overall health"
      ],
      concerns: [
        "Ensure adequate hydration when consuming high-fiber meals",
        "Consider individual food sensitivities or allergies"
      ],
      suggestions: [
        "Add seasonal vegetables for variety and additional nutrients",
        "Consider organic options when available to minimize pesticide exposure",
        "Experiment with different cooking methods to preserve nutrient content",
        "Balance this meal with other meals throughout the day for optimal nutrition"
      ],
      healthRating: 9,
      goal: "General Health",
      glycemicImpact: "Low to moderate - the fiber and protein help slow carbohydrate absorption, promoting stable blood sugar levels",
      inflammatoryPotential: "Anti-inflammatory - rich in omega-3 fatty acids, antioxidants, and anti-inflammatory compounds from vegetables",
      nutrientDensity: "Very High - provides a wide array of essential nutrients relative to calorie content",
      goalAlignment: "Excellent alignment with general health goals, providing balanced nutrition for overall wellness",
      scientificInsights: [
        "The combination of protein and fiber has been shown to increase satiety and support weight management",
        "Antioxidants like beta-carotene and vitamin C work synergistically to protect against oxidative stress",
        "The magnesium content supports over 300 enzymatic reactions in the body",
        "Potassium helps regulate blood pressure and supports cardiovascular health"
      ],
      imageUrl: "/placeholder-meal.jpg",
      created_at: new Date().toISOString(),
      isEmergencyAnalysis: true,
      originalMealId: originalMealId,
      emergencyReason: reason
    };

    console.log('[EmergencyAnalysis] Emergency analysis created successfully');

    return NextResponse.json({
      success: true,
      ...emergencyAnalysis
    });

  } catch (error) {
    console.error('[EmergencyAnalysis] Error creating emergency analysis:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create emergency analysis'
    }, { status: 500 });
  }
} 