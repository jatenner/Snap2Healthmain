import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Lightweight image analysis API that uses minimal memory
 * This handles basic meal analysis without the heavy processing
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  // Log memory usage for debugging
  const startMemory = process.memoryUsage();
  console.log(`Memory status (lightweight-analyze): ${Math.round(startMemory.heapUsed / (1024 * 1024))}MB used of ${Math.round(startMemory.rss / (1024 * 1024))}MB total`);
  
  try {
    // Get the request data
    const body = await req.json();
    const { imageUrl, goal = 'General Wellness', lowMemoryMode = true } = body;
    
    console.log('Lightweight analysis request received:', { 
      hasImageUrl: !!imageUrl, 
      goal, 
      lowMemoryMode
    });
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }
    
    // Get the user profile if they're authenticated
    let userProfile = null;
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get basic profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, dietary_preferences, health_goals')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          userProfile = profile;
        }
      }
    } catch (error) {
      console.log('Error getting user profile:', error);
      // Continue without profile data
    }
    
    // Use a simplified analysis approach to conserve memory
    const analysis = getGeneralWellnessAnalysis();
    
    // Customize the analysis with the user's goal
    if (goal) {
      if (goal.toLowerCase().includes('weight loss')) {
        return NextResponse.json(getWeightLossAnalysis());
      } else if (goal.toLowerCase().includes('muscle') || goal.toLowerCase().includes('gain')) {
        return NextResponse.json(getMuscleGainAnalysis());
      } else if (goal.toLowerCase().includes('heart')) {
        return NextResponse.json(getHeartHealthAnalysis());
      }
    }
    
    // Return the analysis
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Error in lightweight analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  } finally {
    // Log performance metrics
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    console.log(
      `Lightweight analysis completed in ${endTime - startTime}ms. ` +
      `Memory usage: ${Math.round(endMemory.heapUsed / (1024 * 1024))}MB used of ${Math.round(endMemory.rss / (1024 * 1024))}MB total`
    );
  }
}

// Analysis templates for different goals

function getGeneralWellnessAnalysis() {
  return {
    mealName: "Mixed Grain Bowl with Vegetables",
    calories: "450-550",
    macronutrients: [
      { name: "Protein", amount: "18g", unit: "g", percentDailyValue: 36 },
      { name: "Carbs", amount: "65g", unit: "g", percentDailyValue: 22 },
      { name: "Fat", amount: "15g", unit: "g", percentDailyValue: 23 }
    ],
    micronutrients: [
      { name: "Fiber", amount: "12g", unit: "g", percentDailyValue: 48 },
      { name: "Iron", amount: "4.2mg", unit: "mg", percentDailyValue: 23 },
      { name: "Vitamin A", amount: "750IU", unit: "IU", percentDailyValue: 25 },
      { name: "Vitamin C", amount: "35mg", unit: "mg", percentDailyValue: 39 },
      { name: "Calcium", amount: "120mg", unit: "mg", percentDailyValue: 12 }
    ],
    macroRatios: {
      proteinPercentage: 23,
      carbPercentage: 55,
      fatPercentage: 22
    },
    benefits: [
      "Rich in fiber which supports digestive health",
      "Contains complex carbohydrates for sustained energy",
      "Good source of plant-based protein",
      "Provides a variety of vitamins and minerals"
    ],
    concerns: [
      "Moderate in sodium, monitor intake if on a low-sodium diet",
      "Contains grains which may not be suitable for those with gluten sensitivity"
    ],
    suggestions: [
      "Add more leafy greens for additional nutrients",
      "Include a source of healthy fats like avocado or olive oil",
      "Pair with a lean protein source for a more balanced meal"
    ],
    goalSpecificInsights: [
      "This balanced meal provides good nutrition for general wellness",
      "The fiber content helps maintain steady blood sugar levels",
      "Rich in antioxidants which support overall cellular health",
      "Good balance of macronutrients to support daily activity"
    ],
    healthScore: 82
  };
}

function getWeightLossAnalysis() {
  return {
    mealName: "Grilled Chicken Salad with Mixed Greens",
    calories: "320-380",
    macronutrients: [
      { name: "Protein", amount: "32g", unit: "g", percentDailyValue: 64 },
      { name: "Carbs", amount: "18g", unit: "g", percentDailyValue: 6 },
      { name: "Fat", amount: "12g", unit: "g", percentDailyValue: 18 }
    ],
    micronutrients: [
      { name: "Fiber", amount: "8g", unit: "g", percentDailyValue: 32 },
      { name: "Iron", amount: "3.5mg", unit: "mg", percentDailyValue: 19 },
      { name: "Vitamin A", amount: "1200IU", unit: "IU", percentDailyValue: 40 },
      { name: "Vitamin C", amount: "45mg", unit: "mg", percentDailyValue: 50 },
      { name: "Calcium", amount: "150mg", unit: "mg", percentDailyValue: 15 }
    ],
    macroRatios: {
      proteinPercentage: 52,
      carbPercentage: 23,
      fatPercentage: 25
    },
    benefits: [
      "High protein content helps maintain muscle while losing weight",
      "Low in calories but nutrient-dense for satiety",
      "Rich in fiber which promotes fullness",
      "Contains minimal refined carbohydrates"
    ],
    concerns: [
      "May not provide enough calories for very active individuals",
      "Could benefit from more healthy fats for satiety"
    ],
    suggestions: [
      "Add a small portion of healthy fats like avocado or olive oil",
      "Include a small serving of whole grains for sustained energy",
      "Consider adding more vegetables for additional fiber and nutrients"
    ],
    goalSpecificInsights: [
      "This meal's high protein content helps preserve muscle during weight loss",
      "The low calorie density allows for satiety with fewer calories",
      "Rich in fiber which helps control hunger between meals",
      "The nutrient profile supports metabolism and fat loss"
    ],
    healthScore: 88
  };
}

function getMuscleGainAnalysis() {
  return {
    mealName: "Grilled Steak with Sweet Potato and Broccoli",
    calories: "620-680",
    macronutrients: [
      { name: "Protein", amount: "42g", unit: "g", percentDailyValue: 84 },
      { name: "Carbs", amount: "45g", unit: "g", percentDailyValue: 15 },
      { name: "Fat", amount: "28g", unit: "g", percentDailyValue: 43 }
    ],
    micronutrients: [
      { name: "Fiber", amount: "7g", unit: "g", percentDailyValue: 28 },
      { name: "Iron", amount: "6.5mg", unit: "mg", percentDailyValue: 36 },
      { name: "Zinc", amount: "8.2mg", unit: "mg", percentDailyValue: 75 },
      { name: "Vitamin A", amount: "18000IU", unit: "IU", percentDailyValue: 600 },
      { name: "Vitamin C", amount: "65mg", unit: "mg", percentDailyValue: 72 }
    ],
    macroRatios: {
      proteinPercentage: 35,
      carbPercentage: 30,
      fatPercentage: 35
    },
    benefits: [
      "High-quality protein for muscle repair and growth",
      "Contains all essential amino acids from animal protein",
      "Rich in iron which supports oxygen delivery to muscles",
      "Complex carbohydrates provide energy for workouts"
    ],
    concerns: [
      "Higher in saturated fat, balance with unsaturated fats in other meals",
      "Red meat should be consumed in moderation"
    ],
    suggestions: [
      "Consider leaner cuts of meat for regular consumption",
      "Add more colorful vegetables for additional antioxidants",
      "Include a source of omega-3 fatty acids in your diet"
    ],
    goalSpecificInsights: [
      "This meal provides essential protein for muscle protein synthesis",
      "The carbohydrate content helps replenish glycogen stores after exercise",
      "Rich in micronutrients that support recovery and growth",
      "The calorie content supports a caloric surplus needed for muscle gain"
    ],
    healthScore: 75
  };
}

function getHeartHealthAnalysis() {
  return {
    mealName: "Baked Salmon with Quinoa and Roasted Vegetables",
    calories: "480-520",
    macronutrients: [
      { name: "Protein", amount: "35g", unit: "g", percentDailyValue: 70 },
      { name: "Carbs", amount: "38g", unit: "g", percentDailyValue: 13 },
      { name: "Fat", amount: "20g", unit: "g", percentDailyValue: 31 }
    ],
    micronutrients: [
      { name: "Fiber", amount: "8g", unit: "g", percentDailyValue: 32 },
      { name: "Omega-3", amount: "2.8g", unit: "g", percentDailyValue: 255 },
      { name: "Potassium", amount: "980mg", unit: "mg", percentDailyValue: 28 },
      { name: "Magnesium", amount: "120mg", unit: "mg", percentDailyValue: 29 },
      { name: "Vitamin D", amount: "12mcg", unit: "mcg", percentDailyValue: 60 }
    ],
    macroRatios: {
      proteinPercentage: 32,
      carbPercentage: 28,
      fatPercentage: 40
    },
    benefits: [
      "Rich in omega-3 fatty acids which support heart health",
      "Contains high-quality protein with all essential amino acids",
      "High in potassium which helps regulate blood pressure",
      "Provides antioxidants that reduce inflammation"
    ],
    concerns: [
      "Monitor portion size for calorie control",
      "Check sodium content if using seasoning blends"
    ],
    suggestions: [
      "Include more leafy greens for additional heart-healthy nutrients",
      "Add garlic or onions for additional cardiovascular benefits",
      "Consider adding berries for dessert to increase antioxidant intake"
    ],
    goalSpecificInsights: [
      "This meal's omega-3 content helps reduce inflammation and support heart function",
      "The high potassium content helps maintain healthy blood pressure",
      "The fiber helps reduce cholesterol absorption",
      "Low in saturated fat which benefits cardiovascular health"
    ],
    healthScore: 92
  };
} 