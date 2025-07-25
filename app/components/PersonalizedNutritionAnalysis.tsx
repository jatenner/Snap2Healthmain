'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './client/ClientAuthProvider';
import { safeForEach, safeMap, safeFilter, getArrayOrEmpty } from '../lib/utils';
import { createClient } from '../lib/supabase/client';
import EnhancedMicronutrientDisplay from './EnhancedMicronutrientDisplay';

// Enhanced interfaces to support all nutrient data
interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
  category?: 'vitamin' | 'mineral' | 'macronutrient' | 'antioxidant' | 'fatty-acid' | 'other';
  status?: 'low' | 'adequate' | 'high';
  personalizedDV?: number;
}

interface Phytonutrient {
  name: string;
  significance: string;
  food_source: string;
}

interface MealAnalysisData {
  id?: string;
  calories?: number;
  macronutrients?: Nutrient[];
  micronutrients?: Nutrient[];
  phytonutrients?: Phytonutrient[];
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  scientificInsights?: string[];
  goalAlignment?: string;
  glycemicImpact?: string;
  inflammatoryPotential?: string;
  nutrientDensity?: string;
  ingredients?: { name: string; portion: string; calories: number; notes?: string }[];
  analysis?: {
    calories?: number;
    totalCalories?: number;
    macronutrients?: Nutrient[];
    micronutrients?: Nutrient[];
    phytonutrients?: Phytonutrient[];
    personalized_insights?: string;
    insights?: string;
    glycemicImpact?: string;
    inflammatoryPotential?: string;
    nutrientDensity?: string;
    suggestions?: string[];
    scientificInsights?: string[];
    goalAlignment?: string;
  };
  nutrients?: {
    macronutrients?: Nutrient[];
    micronutrients?: Nutrient[];
  };
  personalized_insights?: string;
  insights?: string;
  insights_summary?: string;
  mealName?: string;
  goal?: string;
  imageUrl?: string;
  metabolicInsights?: string;
  personalizedHealthInsights?: string;
  metabolic_insights?: string;
  meal_name?: string;
  image_url?: string;
  created_at?: string;
  expert_recommendations?: string[];
  meal_story?: string;
  nutritional_narrative?: string;
  time_of_day_optimization?: string;
  [key: string]: any;
}

interface UserProfile {
  id?: string;
  full_name?: string;
  gender?: string;
  age?: number;
  weight?: number;
  height?: number;
  activity_level?: string;
  goal?: string;
  healthGoals?: string;
  calorieTarget?: number;
  health_conditions?: string[];
  dietary_restrictions?: string[];
  [key: string]: any;
}

interface PersonalizedNutritionAnalysisProps {
  analysisData: MealAnalysisData;
  userGoal?: string;
}

// Add back the missing nutrient name arrays
const vitaminNames = [
  'vitamin a', 'vitamin c', 'vitamin d', 'vitamin e', 'vitamin k', 
  'vitamin b1', 'vitamin b2', 'vitamin b3', 'vitamin b5', 'vitamin b6', 'vitamin b7', 'vitamin b9', 'vitamin b12',
  'thiamine', 'thiamin', 'riboflavin', 'niacin', 'folate', 'folic acid', 'cobalamin', 'biotin', 'pantothenic acid'
];

const mineralNames = [
  'calcium', 'iron', 'zinc', 'magnesium', 'potassium', 'sodium', 'phosphorus', 
  'iodine', 'selenium', 'copper', 'manganese', 'chromium', 'molybdenum', 'fluoride', 
  'chloride', 'sulfur', 'cobalt', 'boron', 'silicon', 'vanadium', 'nickel', 'tin', 'lithium'
];

const antioxidantNames = [
  'flavonoid', 'carotenoid', 'lycopene', 'lutein', 'zeaxanthin', 'resveratrol', 'anthocyanin',
  'catechin', 'quercetin', 'polyphenol', 'antioxidant'
];

const fattyAcidNames = [
  'omega-3', 'omega-6', 'omega-9', 'epa', 'dha', 'fatty acid', 'pufa', 'mufa', 
  'polyunsaturated', 'monounsaturated', 'polyunsaturated fat', 'monounsaturated fat'
];

// Helper function to get detailed descriptions for nutrients
const getNutrientDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    // Macronutrients - Human-friendly descriptions
    'protein': 'Essential for building and repairing muscles, keeping you satisfied longer, and maintaining a strong body. Think of it as your body\'s construction material.',
    'carbohydrates': 'Your body\'s main energy source, like premium fuel for your brain and muscles. Helps you feel energized and mentally sharp.',
    'fat': 'Necessary for absorbing vitamins, producing hormones, and keeping your skin healthy. Quality fats support brain function and reduce inflammation.',
    'fiber': 'Keeps your digestive system running smoothly, helps you feel full, and feeds the good bacteria in your gut for better overall health.',
    'sugar': 'Quick energy source that can give you a rapid boost, but too much can lead to energy crashes and health issues over time.',
    'sodium': 'Helps maintain fluid balance and nerve function, but excess amounts can increase blood pressure and strain your cardiovascular system.',
    'saturated fat': 'Found in animal products and some oils. Small amounts are fine, but too much may raise cholesterol levels in some people.',
    'trans fat': 'Artificial fats that should be avoided - they increase inflammation and heart disease risk even in small amounts.',
    'unsaturated fat': 'The "good fats" found in olive oil, nuts, and fish that support heart health and reduce inflammation throughout your body.',
    'omega-3': 'Brain-boosting fats that fight inflammation, support memory, and may help prevent heart disease. Found in fish, walnuts, and flax seeds.',
    'omega-6': 'Essential fats your body needs, but balance is key - too much compared to omega-3s can promote inflammation.',
    'cholesterol': 'Your body makes most of what it needs. Dietary cholesterol has less impact on blood levels than once thought for most people.',
    'calories': 'Units of energy your body uses for everything from breathing to exercising. Balance is key for maintaining healthy weight.',
    
    // Vitamins - Simple, relatable descriptions
    'vitamin a': 'Keeps your eyes healthy for good vision, especially at night. Also supports immune function and skin health.',
    'vitamin c': 'Powerful immune system booster that helps fight off colds and infections. Also helps your body absorb iron and heal wounds.',
    'vitamin d': 'The "sunshine vitamin" that keeps bones strong, supports immune function, and may boost mood. Most people do not get enough.',
    'vitamin e': 'Protects your cells from damage and supports healthy skin. Acts like a bodyguard for your cell membranes.',
    'vitamin k': 'Essential for blood clotting when you get a cut, and helps keep your bones strong as you age.',
    'vitamin b1': 'Helps convert food into energy and supports proper nerve function. Important for brain health and energy levels.',
    'vitamin b2': 'Crucial for energy production and helps your body process other vitamins. Supports healthy eyes and skin.',
    'vitamin b3': 'Supports energy production, brain function, and healthy cholesterol levels. May help protect against cognitive decline.',
    'vitamin b5': 'Helps your body make energy from food and produces important hormones. Supports healthy skin and hair.',
    'vitamin b6': 'Important for brain development and function, helps make neurotransmitters that regulate mood and sleep.',
    'vitamin b7': 'Supports healthy hair, skin, and nails. Also important for processing fats and carbohydrates for energy.',
    'vitamin b9': 'Critical for cell division and DNA repair. Especially important for pregnant women to prevent birth defects.',
    'vitamin b12': 'Essential for nerve function, energy production, and making red blood cells. Deficiency can cause permanent nerve damage.',
    'biotin': 'Supports healthy hair, skin, and nails while helping your body process fats and carbohydrates for energy.',
    'folate': 'Works with B12 to make healthy red blood cells and support brain function. Important for cell growth and repair.',
    'thiamine': 'Helps your body convert food into energy and supports proper nerve, muscle, and heart function.',
    'riboflavin': 'Vital B vitamin that powers your cellular energy factories (mitochondria) and helps your body extract maximum energy from every calorie. Critical for athletic performance and mental sharpness.',
    'niacin': 'Essential for converting food into cellular energy and maintaining healthy blood flow to muscles during exercise. Supports brain function and may improve exercise endurance.',
    'pantothenic acid': 'Helps your body make energy from food and produces important hormones for stress response.',
    
    // Minerals - Practical, understandable descriptions
    'calcium': 'Builds strong bones and teeth that last a lifetime. Also helps your muscles work properly - think of it as structural support for your body!',
    'iron': 'Prevents fatigue and keeps your energy levels high all day. Iron from meat is super easy for your body to absorb - way better than iron pills!',
    'potassium': 'Keeps your blood pressure healthy and prevents muscle cramps. Works like a natural salt balancer - great if you eat a lot of processed foods!',
    'magnesium': 'Natural muscle relaxer that helps you sleep better and reduces cramps. Most people do not get enough - a super important mineral that is often missing!',
    'zinc': 'Boosts immune function, helps wounds heal faster, and supports taste and smell. Important for growth and development.',
    'phosphorus': 'Critical for ATP energy production in every cell and works with calcium to build unbreakable bones and teeth. Essential for muscle contraction and recovery after intense training.',
    'selenium': 'Master antioxidant that protects your thyroid, boosts immune defense, and helps your body recover from oxidative stress caused by intense exercise and daily life.',
    'iodine': 'Essential for proper thyroid function, which controls metabolism, energy levels, and body temperature.',
    'copper': 'Helps your body use iron properly, supports immune function, and is needed for healthy blood vessels.',
    'manganese': 'Supports bone development, blood clotting, and helps protect cells from damage.',
    'chromium': 'May help your body use insulin more effectively to control blood sugar levels.',
    'molybdenum': 'Helps your body process proteins and remove toxins. Needed in very small amounts.',
    'fluoride': 'Helps prevent tooth decay and may support bone health when consumed in appropriate amounts.',
    'chloride': 'Works with sodium to maintain fluid balance and is needed for proper digestion.',
    'sulfur': 'Important component of proteins and helps with detoxification processes in the liver.'
  };
  
  const exactMatch = descriptions[name.toLowerCase()];
  if (exactMatch) return exactMatch;
  
  // Check for partial matches with scientific context
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes('vitamin b') || lowercaseName.match(/b\d+/) || lowercaseName.includes('b vitamin')) {
    return 'B vitamins are essential cofactors for energy metabolism and neurotransmitter synthesis. They support mitochondrial function and are crucial for optimal brain performance.';
  }
  
  if (lowercaseName.includes('vitamin')) {
    return 'Vitamins are essential micronutrients that function as cofactors in enzymatic reactions, supporting cellular metabolism and optimal physiological function.';
  }
  
  // Check for mineral partial matches
  const minerals = ['iron', 'calcium', 'zinc', 'magnesium', 'potassium', 'sodium', 'copper', 'manganese', 'selenium'];
  for (const mineral of minerals) {
    if (lowercaseName.includes(mineral)) {
      return descriptions[mineral] || 'Essential mineral that supports enzymatic function, cellular metabolism, and optimal physiological performance.';
    }
  }
  
  return 'Important nutrient that supports cellular function and metabolic processes. Part of an optimal nutrition strategy for health and performance.';
};

// Helper function to categorize micronutrients into groups
const categorizeNutrients = (nutrients: Nutrient[] = []): Record<string, Nutrient[]> => {
  if (!nutrients || nutrients.length === 0) return {};
  
  // Define category groups for better display
  const categories: Record<string, Nutrient[]> = {
    'Vitamins': [],
    'Minerals': [],
    'Antioxidants': [],
    'Essential Fatty Acids': [],
    'Other': []
  };
  
  // Sort each nutrient into its appropriate category
  nutrients.forEach(nutrient => {
    if (!nutrient || !nutrient.name) return;
    
    const name = nutrient.name.toLowerCase();
    const category = nutrient.category || 'unknown';
    
    if (category === 'vitamin' || name.includes('vitamin')) {
      categories['Vitamins']?.push(nutrient);
    } else if (category === 'mineral' || 
       ['calcium', 'iron', 'zinc', 'magnesium', 'potassium', 'sodium', 'phosphorus'].some(m => name.includes(m))) {
      categories['Minerals']?.push(nutrient);
    } else if (category === 'antioxidant' || 
       ['flavonoid', 'carotenoid', 'lycopene', 'lutein', 'resveratrol', 'polyphenol'].some(a => name.includes(a))) {
      categories['Antioxidants']?.push(nutrient);
    } else if (category === 'fatty-acid' || 
       ['omega', 'dha', 'epa', 'fatty acid'].some(f => name.includes(f))) {
      categories['Essential Fatty Acids']?.push(nutrient);
    } else {
      categories['Other']?.push(nutrient);
    }
  });
  
  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key] && categories[key].length === 0) {
      delete categories[key];
    }
  });
  
  return categories;
};

// Helper function to categorize micronutrients
const categorizeMicronutrients = () => {
  // This function has been replaced by the improved categorizeNutrients function
  return {};
};

// New helper function to generate nutrient status badge
const getNutrientBadge = (nutrient: Nutrient): { label: string; color: string } | null => {
  if (!nutrient.percentDailyValue) return null;
  
  const dv = nutrient.percentDailyValue;
  const name = nutrient.name.toLowerCase();
  
  // High nutrient content (good for most nutrients)
  if (dv >= 50) {
    // For nutrients we typically want to limit
    if (name.includes('sodium') || name.includes('sugar') || name.includes('saturated fat') || name.includes('cholesterol')) {
      return { label: 'High', color: 'bg-red-500' };
    }
    // For beneficial nutrients
    return { label: 'Excellent Source', color: 'bg-green-500' };
  }
  
  // Good nutrient content
  if (dv >= 25) {
    // For nutrients we typically want to limit
    if (name.includes('sodium') || name.includes('sugar') || name.includes('saturated fat') || name.includes('cholesterol')) {
      return { label: 'Moderate', color: 'bg-yellow-500' };
    }
    // For beneficial nutrients
    return { label: 'Good Source', color: 'bg-green-400' };
  }
  
  // Low nutrient content
  if (dv < 10) {
    // For nutrients we typically want to limit
    if (name.includes('sodium') || name.includes('sugar') || name.includes('saturated fat') || name.includes('cholesterol')) {
      return { label: 'Low', color: 'bg-green-500' };
    }
    // For beneficial nutrients
    return { label: 'Low', color: 'bg-gray-500' };
  }
  
  return null;
};

// Render a nutrient bar with description and badge
const renderNutrientBar = (nutrient: Nutrient, index: number) => {
  const dv = nutrient.percentDailyValue || 0;
  
  // Use the red/yellow/green system for all nutrients based on daily value completion
  const barColor = dv >= 50 ? "bg-green-500" : dv >= 25 ? "bg-yellow-500" : "bg-red-500";
  
  
  // Use personalized value if available, otherwise use the standard one
  const displayValue = nutrient.percentDailyValue || 0;
  
  // Cap percentage at 100% for display purposes
  const displayPercentage = Math.min(displayValue, 100);
  
  // Get nutrient badge if applicable - use personalized DV for badge calculation
  const personalizedNutrient = {...nutrient, percentDailyValue: displayValue};
  const badge = getNutrientBadge(personalizedNutrient);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <h3 className="text-base font-medium text-cyan-accent">{nutrient.name}</h3>
          <span className="text-blue-100 ml-2">
            {nutrient.amount} {nutrient.unit} 
            <span className="text-blue-100/60 ml-1">
              {displayValue > 0 ? `(${displayValue}% DV${personalizedNutrient.percentDailyValue !== nutrient.percentDailyValue ? '*' : ''})` : '(DV not available)'}
            </span>
          </span>
        </div>
        
        {/* Show nutrient status badge */}
        {badge && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full text-white ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>
      
      <div className="h-2 w-full bg-darkBlue-accent/30 rounded-full">
        <div 
          className={`h-full ${barColor} rounded-full`} 
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
      
      {nutrient.description && (
        <p className="text-xs text-blue-100/70 mt-1">
          {nutrient.description}
        </p>
      )}
      
      {personalizedNutrient.percentDailyValue !== nutrient.percentDailyValue && (
        <p className="text-xs text-cyan-accent mt-1">
          *Personalized to your profile
        </p>
      )}
    </div>
  );
};

// Helper function to get personal daily value targets based on user profile
const getPersonalDailyValue = (nutrient: Nutrient, userProfile: UserProfile | null): number => {
  // Default percentDailyValue
  if (nutrient.percentDailyValue) {
    return nutrient.percentDailyValue;
  }
  
  // If no user profile or no adjustments needed
  if (!userProfile) {
    return 0;
  }
  
  const name = nutrient.name.toLowerCase();
  const { gender, age, weight, height, goal, activityLevel } = userProfile;
  
  // Define base reference values for an average adult
  const baseValues: Record<string, number> = {
    'protein': 50, // g
    'carbohydrates': 275, // g
    'fat': 78, // g
    'fiber': 28, // g
    'calcium': 1000, // mg
    'iron': 18, // mg
    'vitamin c': 90, // mg
    'vitamin d': 20, // mcg
    'vitamin a': 900, // mcg
    'vitamin e': 15, // mg
    'vitamin k': 120, // mcg
    'vitamin b12': 2.4, // mcg
    'folate': 400, // mcg
    'potassium': 3500, // mg
    'magnesium': 400, // mg
    'zinc': 11, // mg
    'sodium': 2300, // mg
    'cholesterol': 300 // mg
  };
  
  // Adjust protein needs based on weight and goal
  if (name === 'protein' || name.includes('protein')) {
    let proteinMultiplier = 0.8; // Default is 0.8g per kg for general health
    
    if (goal?.toLowerCase().includes('muscle') || goal?.toLowerCase().includes('strength')) {
      proteinMultiplier = 1.6; // Higher protein for muscle gain (1.6g per kg)
    } else if (goal?.toLowerCase().includes('weight loss')) {
      proteinMultiplier = 1.2; // Slightly higher protein for weight loss to preserve muscle
    } else if (goal?.toLowerCase().includes('endurance') || goal?.toLowerCase().includes('athlete')) {
      proteinMultiplier = 1.4; // Endurance athletes need more protein
    }
    
    if (weight) {
      // Convert lbs to kg if necessary (assuming weight is in pounds)
      const weightInKg = weight * 0.453592;
      // Calculate personalized protein target in grams
      const proteinTarget = weightInKg * proteinMultiplier;
      // Calculate what percentage of target this meal provides
      return Math.round((nutrient.amount / proteinTarget) * 100);
    }
  }
  
  // Adjust calorie needs based on gender, age, weight, height, and activity level
  if (name === 'calories' || name === 'calorie' || name === 'energy') {
    let bmr = 0;
    
    // Calculate BMR using Mifflin-St Jeor Equation
    if (gender && weight && height && age) {
      const weightInKg = weight * 0.453592;
      const heightInCm = height * 2.54;
      
      if (gender.toLowerCase() === 'male') {
        bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
      } else {
        bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
      }
      
      // Apply activity multiplier
      let activityMultiplier = 1.2; // Sedentary
      
      if (activityLevel) {
        if (activityLevel.toLowerCase().includes('moderate')) {
          activityMultiplier = 1.55;
        } else if (activityLevel.toLowerCase().includes('active') || activityLevel.toLowerCase().includes('high')) {
          activityMultiplier = 1.725;
        } else if (activityLevel.toLowerCase().includes('very') && activityLevel.toLowerCase().includes('active')) {
          activityMultiplier = 1.9;
        }
      }
      
      const calorieTarget = bmr * activityMultiplier;
      return Math.round((nutrient.amount / calorieTarget) * 100);
    }
  }
  
  // Gender-specific adjustments
  if (gender) {
    if (gender.toLowerCase() === 'female') {
      if (name === 'iron') {
        if (age !== undefined && age >= 19 && age <= 50) {
          return Math.round((nutrient.amount / 18) * 100); // Women 19-50 need 18mg iron
        } else {
          return Math.round((nutrient.amount / 8) * 100); // Women 51+ need 8mg iron
        }
      } else if (name === 'calcium') {
        if (age !== undefined && age >= 51) {
          return Math.round((nutrient.amount / 1200) * 100); // Women 51+ need 1200mg calcium
        }
      }
    }
  }
  
  // Age-specific adjustments
  if (age !== undefined) {
    if (age >= 70 && name === 'vitamin d') {
      return Math.round((nutrient.amount / 25) * 100); // Seniors need 25mcg vitamin D
    }
    
    if (age >= 50 && name === 'vitamin b12') {
      return Math.round((nutrient.amount / 2.6) * 100); // Older adults may need more B12
    }
  }
  
  // Use base values if no personalized calculation was done
  if (baseValues[name]) {
    return Math.round((nutrient.amount / baseValues[name]) * 100);
  }
  
  // Default
  return nutrient.percentDailyValue || 0;
};

// Helper function to generate personalized recommendations
const getPersonalizedRecommendations = (analysisData: MealAnalysisData, userGoal?: string): string[] => {
  // Return existing suggestions if available
  if (analysisData.suggestions && analysisData.suggestions.length > 0) {
    return analysisData.suggestions;
  }
  
  // Otherwise, generate some basic recommendations
  const recommendations: string[] = [];
  
  // Check for goal-specific recommendations
  if (userGoal) {
    const goalLower = userGoal.toLowerCase();
    
    if (goalLower.includes('weight loss')) {
      recommendations.push('Focus on protein-rich foods to help with satiety and preserve muscle mass.');
      recommendations.push('Include plenty of fiber-rich vegetables to help you feel full longer.');
    } 
    else if (goalLower.includes('muscle') || goalLower.includes('strength')) {
      recommendations.push('Ensure adequate protein intake (about 1.6-2.2g per kg of body weight) to support muscle recovery and growth.');
      recommendations.push('Include carbohydrates to replenish muscle glycogen stores.');
    }
    else if (goalLower.includes('energy') || goalLower.includes('fatigue')) {
      recommendations.push('Include complex carbohydrates for sustained energy throughout the day.');
      recommendations.push('Ensure adequate B-vitamin intake, which plays a crucial role in energy metabolism.');
    }
    else if (goalLower.includes('heart') || goalLower.includes('cardiac')) {
      recommendations.push('Focus on foods low in sodium and saturated fat to support heart health.');
      recommendations.push('Include omega-3 rich foods and fiber to help manage cholesterol levels.');
    }
  }
  
  // Add general recommendations if we do not have enough
  if (recommendations.length < 3) {
    recommendations.push('Aim for a colorful plate with a variety of fruits and vegetables for optimal nutrition.');
    recommendations.push('Stay hydrated by drinking water throughout the day.');
    recommendations.push('Consider portion sizes to align with your individual energy needs and goals.');
  }
  
  return recommendations;
};

// Helper function to safely extract data from nested objects
function safeExtractData(data: any, path: string[], defaultValue: any = null) {
  try {
    let current = data;
    for (const key of path) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    return current === undefined ? defaultValue : current;
  } catch (e) {
    console.error('Error extracting data:', e);
    return defaultValue;
  }
}

// Helper to handle various data structures from different sources
function extractNutrientsFromMealData(mealData: MealAnalysisData | null | undefined) {
  if (!mealData) return { macros: [] as Nutrient[], micros: [] as Nutrient[] };
  
  // First normalize the data structure to avoid duplicates
  const normalizedData = normalizeDataStructure(mealData);
  
  // Now extract the data from consistent locations
  const extractedMacros = normalizedData.macronutrients || [] as Nutrient[];
  const extractedMicros = normalizedData.micronutrients || [] as Nutrient[];
  
  // Ensure arrays
  return { 
    macros: Array.isArray(extractedMacros) ? extractedMacros : [], 
    micros: Array.isArray(extractedMicros) ? extractedMicros : [] 
  };
}

// Helper to normalize data structure to avoid duplicates
function normalizeDataStructure(data: any): any {
  if (!data) return data;
  
  // Create a deep copy to avoid modifying the original
  const normalizedData = JSON.parse(JSON.stringify(data));
  
  // Step 1: Handle case where nutrients are in multiple places
  // If we have nutrients in different locations, consolidate them
  
  // For macronutrients
  let consolidatedMacros: Nutrient[] = [];
  
  // Collect from all possible locations
  if (normalizedData.macronutrients && Array.isArray(normalizedData.macronutrients)) {
    consolidatedMacros = [...normalizedData.macronutrients];
  }
  
  if (normalizedData.analysis?.macronutrients && Array.isArray(normalizedData.analysis.macronutrients)) {
    // Only add nutrients that aren't already in the array
    normalizedData.analysis.macronutrients.forEach((nutrient: Nutrient) => {
      if (!consolidatedMacros.some(m => m.name === nutrient.name)) {
        consolidatedMacros.push(nutrient);
      }
    });
  }
  
  if (normalizedData.nutrients?.macronutrients && Array.isArray(normalizedData.nutrients.macronutrients)) {
    // Only add nutrients that aren't already in the array
    normalizedData.nutrients.macronutrients.forEach((nutrient: Nutrient) => {
      if (!consolidatedMacros.some(m => m.name === nutrient.name)) {
        consolidatedMacros.push(nutrient);
      }
    });
  }
  
  // Set the consolidated list at the root level
  normalizedData.macronutrients = consolidatedMacros;
  
  // Remove from other locations to avoid duplicates
  if (normalizedData.analysis) {
    delete normalizedData.analysis.macronutrients;
  }
  
  if (normalizedData.nutrients) {
    delete normalizedData.nutrients.macronutrients;
  }
  
  // Do the same for micronutrients
  let consolidatedMicros: Nutrient[] = [];
  
  if (normalizedData.micronutrients && Array.isArray(normalizedData.micronutrients)) {
    consolidatedMicros = [...normalizedData.micronutrients];
  }
  
  if (normalizedData.analysis?.micronutrients && Array.isArray(normalizedData.analysis.micronutrients)) {
    normalizedData.analysis.micronutrients.forEach((nutrient: Nutrient) => {
      if (!consolidatedMicros.some(m => m.name === nutrient.name)) {
        consolidatedMicros.push(nutrient);
      }
    });
  }
  
  if (normalizedData.nutrients?.micronutrients && Array.isArray(normalizedData.nutrients.micronutrients)) {
    normalizedData.nutrients.micronutrients.forEach((nutrient: Nutrient) => {
      if (!consolidatedMicros.some(m => m.name === nutrient.name)) {
        consolidatedMicros.push(nutrient);
      }
    });
  }
  
  // Set the consolidated list at the root level
  normalizedData.micronutrients = consolidatedMicros;
  
  // Remove from other locations to avoid duplicates
  if (normalizedData.analysis) {
    delete normalizedData.analysis.micronutrients;
  }
  
  if (normalizedData.nutrients) {
    delete normalizedData.nutrients.micronutrients;
  }
  
  // Clean up empty objects
  if (normalizedData.nutrients && Object.keys(normalizedData.nutrients).length === 0) {
    delete normalizedData.nutrients;
  }
  
  return normalizedData;
}

function formatPercentage(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }
  return `${Math.round(value)}%`;
}

// Create a simple tooltip component since the original one wasn't found
const SimpleTooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-10 w-48 p-2 text-xs bg-gray-900 text-gray-200 rounded shadow-lg">
        {content}
      </div>
    </div>
  );
};

// Helper function to get a user-friendly name for a micronutrient
function getMicronutrientBenefit(name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('vitamin c')) return 'Supports immune function and collagen production';
  if (nameLower.includes('vitamin d')) return 'Essential for bone health and immune function';
  if (nameLower.includes('vitamin a')) return 'Supports vision and immune health';
  if (nameLower.includes('iron')) return 'Critical for oxygen transport in the blood';
  if (nameLower.includes('calcium')) return 'Important for bone health and muscle function';
  if (nameLower.includes('magnesium')) return 'Supports muscle and nerve function';
  if (nameLower.includes('potassium')) return 'Helps maintain proper fluid balance and nerve signals';
  if (nameLower.includes('zinc')) return 'Important for immune function and wound healing';
  if (nameLower.includes('folate') || nameLower.includes('folic')) return 'Essential for cell division and DNA synthesis';
  if (nameLower.includes('b12')) return 'Critical for nerve function and red blood cell formation';
  return 'Important for overall health and wellbeing';
}

// Local implementation of generateInsights to avoid circular dependencies
function generatePersonalizedInsights(mealData: any, userProfile?: any): string {
  try {
    // Extract personalized insights if already available
    if (mealData.analysis?.personalized_insights) {
      return mealData.analysis.personalized_insights;
    }
    
    if (mealData.personalized_insights) {
      return mealData.personalized_insights;
    }
    
    // Generate insights array
    const insights: string[] = [];
    const goal = userProfile?.goal || userProfile?.healthGoals || mealData.goal || 'General Health';
    
    // Add personalized greeting if we have user data
    if (userProfile) {
      insights.push(`## Personalized Nutrition Analysis for Your ${goal} Goals`);
      if (userProfile.age) {
        insights.push(`As a ${userProfile.age}-year-old ${userProfile.gender || 'person'} focused on ${goal.toLowerCase()}, here's my comprehensive analysis of this meal:`);
      } else {
        insights.push(`Based on your ${goal.toLowerCase()} goals, here's my detailed analysis of this meal:`);
      }
    } else {
      insights.push(`## Nutritional Analysis`);
      insights.push(`Here's a detailed analysis of this meal for your ${goal} goals:`);
    }
    
    // Basic analysis of calories and macronutrients
    const calories = mealData.analysis?.calories || mealData.calories || 0;
    insights.push(`This meal contains approximately ${calories} calories.`);
    
    // Return the formatted insights
    return insights.join('\n\n');
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Unable to generate detailed insights for this meal.';
  }
}

// Helper function to calculate personalized daily values
function calculatePersonalizedDailyValues(profile: any): Record<string, number> {
  // Default values
  const defaults = {
    calories: 2000,
    protein: 50,
    carbs: 275,
    fat: 78
    // Add more nutrients as needed
  };
  
  if (!profile) return defaults;
  
  // Calculate based on profile - simple example
  const calories = profile.weight 
    ? (profile.gender === 'Female' ? profile.weight * 12 : profile.weight * 14)
    : defaults.calories;
    
  return {
    calories,
    protein: profile.weight ? profile.weight * 0.8 : defaults.protein,
    carbs: calories * 0.5 / 4, // 50% of calories from carbs, 4 calories per gram
    fat: calories * 0.3 / 9,  // 30% of calories from fat, 9 calories per gram
  };
}

// Update the window interface
declare global {
  interface Window {
    currentUserProfile?: {
      id?: string;
      full_name?: string;
      goal?: string;
      activity_level?: string;
      age?: number;
      gender?: string;
      height?: number;
      weight?: number;
      [key: string]: any;
    };
  }
}

// Enhanced component code for PersonalizedNutritionAnalysis
const PersonalizedNutritionAnalysis: React.FC<PersonalizedNutritionAnalysisProps> = ({ 
  analysisData, 
  userGoal 
}) => {
  const [activeTab, setActiveTab] = useState<'nutrients' | 'ai-insights'>('nutrients');
  const [personalizedInsights, setPersonalizedInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceRegenerate, setForceRegenerate] = useState(false);

  // Auto-generate insights on mount - always generate fresh insights
  useEffect(() => {
    // Always auto-generate insights - no more basic fallbacks!
    console.log('[PersonalizedNutritionAnalysis] Auto-generating comprehensive analysis...');
    setIsGeneratingInsights(true);
    generatePersonalizedInsights();
  }, [analysisData]);

  const generatePersonalizedInsights = async () => {
    // Skip existing insights check - always generate fresh comprehensive analysis
    console.log('[generatePersonalizedInsights] Generating fresh comprehensive insights...');
    setIsGeneratingInsights(true);
    setError(null);
    setForceRegenerate(false);

    try {
      // Get user profile from multiple sources
      const currentUserProfile = typeof window !== 'undefined' ? window.currentUserProfile : null;
      
      const payload = {
        mealData: {
          ...analysisData,
          id: analysisData.id || analysisData.mealId || 'temp-enhanced',
          enhancedPrompt: true,
          forceComprehensive: true
        },
        userProfile: currentUserProfile,
        userGoal: userGoal || (currentUserProfile as any)?.goal || 'general health',
        requestType: 'comprehensive_analysis',
        includeRealLifeScenarios: true
      };

      console.log('[generatePersonalizedInsights] Sending payload:', payload);

      const supabase = createClient();

      const response = await fetch('/api/generate-personalized-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.insights) {
        setPersonalizedInsights(data.insights);
        
        // If we have a valid meal ID, try to save the insights to the database
        const mealId = analysisData.id || analysisData.mealId;
        if (mealId && mealId !== 'temp-enhanced' && !mealId.includes('temp')) {
          try {
            const { error: updateError } = await supabase
              .from('meals')
              .update({ 
                insights: data.insights,
                personalized_insights: data.insights 
              })
              .eq('id', mealId);

            if (updateError) {
              console.error('[generatePersonalizedInsights] Error updating meal with insights:', updateError);
            } else {
              console.log('[generatePersonalizedInsights] Successfully saved insights to database');
            }
          } catch (saveError) {
            console.error('[generatePersonalizedInsights] Error saving insights to database:', saveError);
          }
        }
      } else {
        setError(data.error || 'Failed to generate insights');
      }
    } catch (error) {
      console.error('[generatePersonalizedInsights] Error:', error);
      setError('Failed to generate personalized insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Helper functions to extract data
  const getMacronutrients = (): Nutrient[] => {
    const macros = analysisData?.macronutrients || analysisData?.analysis?.macronutrients || [];
    const nutrientsWithDescription = macros.map(nutrient => ({
      ...nutrient,
      description: nutrient.description || getNutrientDescription(nutrient.name)
    }));
    // Filter out nutrients with zero or near-zero values - only show what's actually present
    return nutrientsWithDescription;
  };


  const getMicronutrients = (): Nutrient[] => {
    const micros = analysisData?.micronutrients || analysisData?.analysis?.micronutrients || [];
    const nutrientsWithDescription = micros.map(nutrient => ({
      ...nutrient,
      description: nutrient.description || getNutrientDescription(nutrient.name)
    }));
    // Filter out nutrients with zero or near-zero values - only show what's actually present
    return nutrientsWithDescription;
  };

  const getCalories = (): number => {
    return analysisData?.calories || analysisData?.analysis?.calories || 0;
  };

  const getMealName = (): string => {
    return analysisData?.mealName || analysisData?.meal_name || 'Analyzed Meal';
  };

  const getImageUrl = (): string => {
    return analysisData?.imageUrl || analysisData?.image_url || '';
  };

  const getExistingInsights = (): string => {
    // Check multiple possible locations for insights in priority order
    const sources = [
      analysisData?.personalized_insights,
      analysisData?.personalized_insights,
      analysisData?.analysis?.personalized_insights,
      analysisData?.analysis?.insights,
      (analysisData?.analysis as any)?.personalized_health_insights,
      analysisData?.personalizedHealthInsights,
      analysisData?.scientificInsights,
      (analysisData?.analysis as any)?.scientificInsights
    ];

    console.log('[getExistingInsights] Checking sources:', {
      'personalized_insights': !!analysisData?.personalized_insights,
      'insights': !!analysisData?.personalized_insights,
      'analysis.personalized_insights': !!analysisData?.analysis?.personalized_insights,
      'analysis.insights': !!analysisData?.analysis?.insights
    });

    for (const source of sources) {
      if (source && typeof source === 'string' && source.length > 1000) {
        // Only accept insights that are substantial (1000+ chars) and contain rich analysis
        const lowerSource = source.toLowerCase();
        const hasRichContent = (
          lowerSource.includes('your body') || 
          lowerSource.includes('metabolic') || 
          lowerSource.includes('personalized') ||
          lowerSource.includes('tdee') ||
          lowerSource.includes('protein target') ||
          lowerSource.includes('goal alignment') ||
          lowerSource.includes('how this meal fits') ||
          lowerSource.includes('what your body is doing') ||
          lowerSource.includes('specific improvements') ||
          lowerSource.includes('action plan')
        );
        
        if (hasRichContent) {
          console.log('[getExistingInsights] Found quality insights of length:', source.length);
          console.log('[getExistingInsights] Preview:', source.substring(0, 200) + '...');
          return source;
        } else {
          console.log('[getExistingInsights] Found basic insights, skipping:', source.substring(0, 100) + '...');
        }
      }
    }

    console.log('[getExistingInsights] No quality insights found in data - will generate new ones');
    return '';
  };

  // Helper function to get nutrient status color - RED/YELLOW/GREEN system only
  const getNutrientStatusColor = (nutrient: Nutrient): string => {
    const dv = nutrient.percentDailyValue || 0;
    
    // For nutrients we want to limit (sodium, sugar, saturated fat, cholesterol)
    const limitNutrients = ['sodium', 'sugar', 'saturated fat', 'cholesterol'];
    const isLimitNutrient = limitNutrients.some(limit => 
      nutrient.name.toLowerCase().includes(limit)
    );
    
    if (isLimitNutrient) {
      // Reverse logic for limit nutrients - high values are red (bad)
      if (dv >= 50) return 'bg-red-500';
      if (dv >= 20) return 'bg-yellow-500';
      return 'bg-green-500';
    }
    
    // For beneficial nutrients - high values are green (good)
    if (dv >= 50) return 'bg-green-500';
    if (dv >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getNutrientStatusText = (nutrient: Nutrient): string => {
    const dv = nutrient.percentDailyValue || 0;
    
    const limitNutrients = ['sodium', 'sugar', 'saturated fat', 'cholesterol'];
    const isLimitNutrient = limitNutrients.some(limit => 
      nutrient.name.toLowerCase().includes(limit)
    );
    
    if (isLimitNutrient) {
      if (dv >= 50) return 'High';
      if (dv >= 25) return 'Moderate';
      return 'Low';
    }
    
    if (dv >= 50) return 'Excellent';
    if (dv >= 20) return 'Good';
    if (dv >= 10) return 'Fair';
    return 'Low';
  };

  if (!analysisData) {
    return (
      <div className="bg-gray-800 rounded-2xl p-8 text-center">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      {/* Meal Header - Mobile Optimized */}
      {getImageUrl() && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-8 items-center">
            <div className="aspect-square relative rounded-lg sm:rounded-xl overflow-hidden shadow-2xl max-w-xs mx-auto lg:max-w-none lg:mx-0">
              <img
                src={getImageUrl()}
                alt={getMealName()}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">{getMealName()}</h2>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-400 mb-4">
                {getCalories()} <span className="text-lg sm:text-xl font-normal text-gray-400">calories</span>
              </div>
                            {analysisData.created_at && (
                <p className="text-gray-400 text-base sm:text-lg">
                  Analyzed on {new Date(analysisData.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
        
      {/* Main Analysis Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex flex-col sm:flex-row">
            <button 
              onClick={() => setActiveTab('nutrients')}
              className={`flex-1 py-4 sm:py-6 px-3 sm:px-8 text-center font-semibold transition-all touch-target ${
                activeTab === 'nutrients' 
                  ? 'bg-blue-600 text-white border-b-4 border-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center text-sm sm:text-lg flex-col sm:flex-row">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-0 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Nutritional Analysis</span>
                <span className="sm:hidden">Nutrients</span>
              </span>
            </button>
            
            <button 
              onClick={() => setActiveTab('ai-insights')}
              className={`flex-1 py-4 sm:py-6 px-3 sm:px-8 text-center font-semibold transition-all touch-target ${
                activeTab === 'ai-insights' 
                  ? 'bg-blue-600 text-white border-b-4 border-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center text-sm sm:text-lg flex-col sm:flex-row">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-0 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="hidden sm:inline">Health Insights</span>
                <span className="sm:hidden">AI Insights</span>
              </span>
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'nutrients' && (
            <div className="space-y-12">
              {/* Macronutrients */}
              <div>
                <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Macronutrients
                </h3>
                
                {getMacronutrients().length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {getMacronutrients().map((nutrient, index) => (
                      <div key={index} className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg" data-nutrient={nutrient.name} data-nutrient-amount={nutrient.amount} data-nutrient-unit={nutrient.unit} data-nutrient-dv={nutrient.percentDailyValue || 0} data-nutrient-type="macronutrient">
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                          <div>
                            <h4 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-2">{nutrient.name}</h4>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                              {nutrient.amount} {nutrient.unit}
                            </p>
                          </div>
                          
                          {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                            <div className="text-right">
                              <div className="text-xl font-bold text-white">
                                {Math.round(nutrient.percentDailyValue)}%
                              </div>
                              <div className="text-sm text-gray-400">Daily Value</div>
                            </div>
                          )}
                        </div>
                        
                        {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                          <div className="w-full bg-gray-600 rounded-full h-4 mb-4">
                            <div 
                              className={`h-4 rounded-full transition-all duration-700 ${getNutrientStatusColor(nutrient)}`}
                              style={{ width: `${Math.min(100, nutrient.percentDailyValue)}%` }}
                            ></div>
                          </div>
                        )}
                        
                        <p className="text-gray-300 text-sm leading-relaxed">{nutrient.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg">No macronutrient data available for this meal.</p>
                  </div>
                )}
              </div>

              {/* Micronutrients - Enhanced Display */}
              <div>
                <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <span className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </span>
                  Micronutrients
                </h3>
                
                {getMicronutrients().length > 0 ? (
                  <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
                    {getMicronutrients().map((nutrient, index) => {
                      const dv = nutrient.percentDailyValue || 0;
                      
                      // Simple unified color system: 0-19% red, 20-74% yellow, 75%+ green
                      let colorClass = "";
                      let statusLabel = "";
                      let bgColor = "";
                      
                      if (dv >= 75) {
                        colorClass = "bg-green-500";
                        statusLabel = "Excellent";
                        bgColor = "bg-green-900/20 border-green-500/30";
                      } else if (dv >= 20) {
                        colorClass = "bg-yellow-500";
                        statusLabel = "Good";
                        bgColor = "bg-yellow-900/20 border-yellow-500/30";
                      } else if (dv > 0) {
                        colorClass = "bg-red-500";
                        statusLabel = "Low";
                        bgColor = "bg-red-900/20 border-red-500/30";
                      } else {
                        colorClass = "bg-gray-500";
                        statusLabel = "Unknown";
                        bgColor = "bg-white/5 border-white/10";
                      }
                      
                      return (
                        <div key={index} className={`${bgColor} backdrop-blur-sm rounded-xl p-6 border hover:shadow-lg transition-all duration-300`}>
                          {/* Header with nutrient name and status badge */}
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-bold text-white text-lg leading-tight">{nutrient.name}</h4>
                            {dv > 0 && (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${colorClass}`}>
                                {statusLabel}
                              </span>
                            )}
                          </div>
                          
                          {/* Amount and DV% - Enhanced Typography */}
                          <div className="mb-4">
                            <div className="flex items-baseline justify-between mb-2">
                              <span className="text-3xl font-bold text-white">
                                {nutrient.amount}
                              </span>
                              <span className="text-lg text-gray-300 ml-2">
                                {nutrient.unit}
                              </span>
                            </div>
                            {dv > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-white">
                                  {Math.round(dv)}%
                                </span>
                                <span className="text-sm text-gray-400 font-medium">
                                  Daily Value
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Progress Bar - Enhanced */}
                          {dv > 0 && (
                            <div className="mb-4">
                              <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-700 shadow-lg ${colorClass}`}
                                  style={{ width: `${Math.min(dv, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {/* Description */}
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {nutrient.description || getNutrientDescription(nutrient.name)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p className="text-lg">No micronutrient data available for this meal.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'ai-insights' && (
            <div className="space-y-8">
              {/* Clean, Flowing Health Insights */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">🧠</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">Health Insights</h3>
                      <p className="text-gray-400">What this meal means for your body</p>
                    </div>
                  </div>
                  {personalizedInsights && (
                    <button
                      onClick={() => {
                        setForceRegenerate(true);
                        generatePersonalizedInsights();
                      }}
                      disabled={isGeneratingInsights}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      {isGeneratingInsights ? 'Analyzing...' : 'Refresh Analysis'}
                    </button>
                  )}
                </div>
                
                {isGeneratingInsights ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h4 className="text-xl font-semibold text-purple-300 mb-2">Analyzing Your Meal</h4>
                    <p className="text-purple-200/70">AI is processing nutritional data and generating personalized insights...</p>
                  </div>
                ) : personalizedInsights ? (
                  <div className="space-y-6">
                    {/* Clean markdown rendering */}
                    <div className="prose prose-invert prose-lg max-w-none">
                      <div 
                        className="text-gray-200 leading-relaxed space-y-4"
                        dangerouslySetInnerHTML={{
                          __html: personalizedInsights
                            // Convert markdown headers to HTML
                            .replace(/### \*\*(.*?)\*\*/g, '<h3 class="text-2xl font-bold text-white mt-8 mb-4 flex items-center"><span class="mr-3">📊</span>$1</h3>')
                            .replace(/### (.*?)$/gm, '<h3 class="text-2xl font-bold text-white mt-8 mb-4 flex items-center"><span class="mr-3">📊</span>$1</h3>')
                            .replace(/## \*\*(.*?)\*\*/g, '<h2 class="text-3xl font-bold text-white mt-10 mb-6 flex items-center"><span class="mr-3">🎯</span>$1</h2>')
                            .replace(/## (.*?)$/gm, '<h2 class="text-3xl font-bold text-white mt-10 mb-6 flex items-center"><span class="mr-3">🎯</span>$1</h2>')
                            // Convert bold text
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                            // Convert emojis and progress bars to styled elements
                            .replace(/📊 (.*?):/g, '<div class="flex items-center mb-3"><span class="text-2xl mr-3">📊</span><span class="text-lg font-semibold text-blue-300">$1:</span></div>')
                            .replace(/🔥 (.*?):/g, '<div class="flex items-center mb-3"><span class="text-2xl mr-3">🔥</span><span class="text-lg font-semibold text-orange-300">$1:</span></div>')
                            .replace(/💪 (.*?):/g, '<div class="flex items-center mb-3"><span class="text-2xl mr-3">💪</span><span class="text-lg font-semibold text-blue-300">$1:</span></div>')
                            .replace(/🥗 (.*?):/g, '<div class="flex items-center mb-3"><span class="text-2xl mr-3">🥗</span><span class="text-lg font-semibold text-green-300">$1:</span></div>')
                            .replace(/⚡ (.*?):/g, '<div class="flex items-center mb-3"><span class="text-2xl mr-3">⚡</span><span class="text-lg font-semibold text-yellow-300">$1:</span></div>')
                            .replace(/🎯 (.*?):/g, '<div class="flex items-center mb-3"><span class="text-2xl mr-3">🎯</span><span class="text-lg font-semibold text-purple-300">$1:</span></div>')
                            .replace(/🧬 (.*?):/g, '<div class="flex items-center mb-3"><span class="text-2xl mr-3">🧬</span><span class="text-lg font-semibold text-indigo-300">$1:</span></div>')
                            .replace(/🍽️ (.*?):/g, '<div class="flex items-center mb-3"><span class="text-2xl mr-3">🍽️</span><span class="text-lg font-semibold text-gray-300">$1:</span></div>')
                            // Convert progress bars to visual elements
                            .replace(/(████+░*)/g, '<div class="inline-block bg-gray-700 rounded-full h-2 w-32 mr-2 overflow-hidden"><div class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style="width: 60%"></div></div>')
                            // Convert line breaks to proper spacing
                            .replace(/\n\n/g, '</p><p class="mb-4">')
                            .replace(/\n/g, '<br/>')
                            // Wrap in paragraph tags
                            .replace(/^/, '<p class="mb-4">')
                            .replace(/$/, '</p>')
                            // Clean up empty paragraphs
                            .replace(/<p class="mb-4"><\/p>/g, '')
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl">🤖</span>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h4>
                    <p className="text-gray-400 mb-6">Click to generate personalized health insights for this meal</p>
                    <button
                      onClick={generatePersonalizedInsights}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Generate Insights
                    </button>
                  </div>
                )}
              </div>

              {/* Expert Recommendations - Enhanced */}
              {analysisData.expert_recommendations && analysisData.expert_recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-500/30 rounded-xl p-8 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">👨‍⚕️</span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-white">Expert Recommendations</h4>
                      <p className="text-emerald-300">Professional nutrition guidance</p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {analysisData.expert_recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-4 bg-emerald-900/20 rounded-lg p-4 border border-emerald-500/20">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                          {index + 1}
                        </div>
                        <p className="text-emerald-100 leading-relaxed flex-1">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional Analysis Sections - Enhanced */}
              <div className="grid gap-6">
                {analysisData.meal_story && (
                  <div className="bg-gradient-to-br from-indigo-900/30 to-blue-900/30 border border-indigo-500/30 rounded-xl p-8 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🧬</span>
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-white">Metabolic Journey</h4>
                        <p className="text-indigo-300">How your body processes this meal</p>
                      </div>
                    </div>
                    <div className="prose prose-invert prose-lg max-w-none">
                      <p className="text-indigo-100 leading-relaxed">{analysisData.meal_story}</p>
                    </div>
                </div>
              )}
              
                {analysisData.nutritional_narrative && (
                  <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-xl p-8 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔬</span>
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-white">Nutritional Science</h4>
                        <p className="text-orange-300">Science behind the nutrients</p>
                      </div>
                    </div>
                    <div className="prose prose-invert prose-lg max-w-none">
                      <p className="text-orange-100 leading-relaxed">{analysisData.nutritional_narrative}</p>
                    </div>
                </div>
              )}
              
                {analysisData.time_of_day_optimization && (
                  <div className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 border border-cyan-500/30 rounded-xl p-8 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🌅</span>
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-white">Circadian Optimization</h4>
                        <p className="text-cyan-300">Best timing for this meal</p>
                      </div>
                    </div>
                    <div className="prose prose-invert prose-lg max-w-none">
                      <p className="text-cyan-100 leading-relaxed">{analysisData.time_of_day_optimization}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedNutritionAnalysis; 