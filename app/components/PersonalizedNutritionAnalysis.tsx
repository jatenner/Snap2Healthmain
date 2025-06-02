'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth';
import { safeForEach, safeMap, safeFilter, getArrayOrEmpty } from '../lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReactMarkdown from 'react-markdown';

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
    // Macronutrients
    'protein': 'Essential for muscle repair, immune function, and enzyme production. Helps maintain lean body mass and supports tissue growth.',
    'carbohydrates': 'Primary energy source for the body, especially during high-intensity activities. Provides fuel for the brain and nervous system.',
    'fat': 'Important for hormone production, brain health, nutrient absorption, and long-term energy storage. Essential fatty acids support heart and brain health.',
    'fiber': 'Promotes digestive health, helps maintain stable blood sugar levels, and increases satiety to aid weight management. May help reduce cholesterol levels.',
    'sugar': 'Provides quick energy but should be limited for optimal health. Excess consumption is linked to various health issues including obesity and diabetes.',
    'sodium': 'Essential for fluid balance and nerve function, but excess can affect blood pressure and cardiovascular health. Aim to keep below 2300mg daily.',
    'saturated fat': 'Should be limited in the diet as excessive intake is associated with increased cholesterol levels and heart disease risk. Aim to keep below 10% of daily calories.',
    'trans fat': 'Artificial fats that should be avoided as they increase LDL cholesterol and decrease HDL cholesterol. Even small amounts can negatively impact heart health.',
    'unsaturated fat': 'Healthy fats found in plant foods and fish that support heart health and reduce inflammation. Include sources like olive oil, avocados, and nuts.',
    'omega-3': 'Essential fatty acids that reduce inflammation, support brain health, and may lower heart disease risk. Found in fatty fish, flaxseeds, and walnuts.',
    'omega-6': 'Essential fatty acids that play a role in brain function and normal growth and development. Balance with omega-3s for optimal health.',
    'cholesterol': 'Used to make hormones, vitamin D, and substances that help digest foods. The body produces all it needs, so dietary intake should be moderate.',
    'calories': 'Unit of energy from food. Balance calorie intake with physical activity to maintain healthy weight. Needs vary based on age, gender, activity level, and goals.',
    
    // Vitamins
    'vitamin a': 'Critical for vision, immune function, cell growth, and maintaining healthy organs. Found in colorful fruits and vegetables like carrots and sweet potatoes.',
    'vitamin c': 'Powerful antioxidant that supports immune health, collagen production, and helps with iron absorption. Found in citrus fruits, bell peppers, and berries.',
    'vitamin d': 'Essential for calcium absorption, bone health, immune function, and mood regulation. Often called the "sunshine vitamin" as it\'s produced when skin is exposed to sunlight.',
    'vitamin e': 'Powerful antioxidant that protects cells from damage, supports immune function, and promotes skin health. Found in nuts, seeds, and vegetable oils.',
    'vitamin k': 'Necessary for blood clotting, bone health, and may help prevent arterial calcification. Found in leafy greens and fermented foods.',
    'vitamin b1': 'Also known as thiamine. Essential for energy metabolism and nerve, muscle, and heart function. Found in whole grains, meat, and legumes.',
    'vitamin b2': 'Also known as riboflavin. Helps convert food into energy and supports cellular function, growth, and development. Found in dairy, eggs, and leafy greens.',
    'vitamin b3': 'Also known as niacin. Helps convert nutrients into energy, repairs DNA, and supports nervous system health. Found in meat, fish, and fortified cereals.',
    'vitamin b5': 'Also known as pantothenic acid. Important for making blood cells and converting food into energy. Found in meat, broccoli, and avocados.',
    'vitamin b6': 'Important for brain development, immune function, and helps create neurotransmitters like serotonin and dopamine. Found in poultry, fish, and bananas.',
    'vitamin b7': 'Also known as biotin. Supports hair, skin, and nail health, and helps metabolize carbohydrates and fats. Found in eggs, nuts, and seeds.',
    'vitamin b9': 'Also known as folate or folic acid. Critical for DNA synthesis, cell division, and preventing neural tube defects. Found in leafy greens and legumes.',
    'vitamin b12': 'Essential for nerve function, brain health, red blood cell formation, and DNA synthesis. Found primarily in animal products.',
    'folate': 'Important for cell division, DNA synthesis, and preventing neural tube defects during pregnancy. Found in leafy greens, legumes, and fortified foods.',
    'riboflavin': 'Helps convert food into energy and is important for growth, development, and maintaining healthy skin and eyes. Found in dairy, eggs, and enriched grains.',
    'niacin': 'Helps convert nutrients into energy, repairs DNA, and acts as an antioxidant. May help lower cholesterol levels. Found in meat, fish, and peanuts.',
    'thiamine': 'Essential for energy metabolism, nerve function, and muscle contraction. Prevents beriberi disease. Found in whole grains, meat, and legumes.',
    'pantothenic acid': 'Vital for making blood cells and converting food into energy. Found in meat, broccoli, avocados, and whole grains.',
    'biotin': 'Supports metabolism of fats, carbohydrates, and proteins. Important for hair, skin, and nail health. Found in eggs, nuts, and seeds.',
    
    // Minerals
    'calcium': 'Critical for bone and teeth health, muscle function, nerve signaling, and blood clotting. Found in dairy products, fortified plant milks, and leafy greens.',
    'iron': 'Essential for oxygen transport in the blood, energy production, and immune function. Prevents anemia. Found in red meat, legumes, and fortified cereals.',
    'potassium': 'Regulates fluid balance, muscle contractions, and nerve signals. May help lower blood pressure. Found in bananas, potatoes, and legumes.',
    'magnesium': 'Involved in over 300 enzyme reactions, including energy creation, protein formation, and muscle movements. Found in nuts, seeds, and whole grains.',
    'zinc': 'Important for immune function, wound healing, DNA synthesis, and growth and development. Found in meat, shellfish, and legumes.',
    'phosphorus': 'Essential for bone health, energy production, cellular function, and properly functioning kidneys. Found in dairy, meat, and whole grains.',
    'selenium': 'Acts as an antioxidant, especially when paired with vitamin E. Supports thyroid and immune function. Found in Brazil nuts, seafood, and meats.',
    'iodine': 'Necessary for thyroid function and metabolism. Deficiency can lead to goiter and developmental issues. Found in iodized salt and seafood.',
    'copper': 'Important for iron metabolism, connective tissue formation, and neurotransmitter synthesis. Found in shellfish, nuts, and seeds.',
    'manganese': 'Involved in metabolism, bone development, wound healing, and antioxidant defenses. Found in whole grains, nuts, and leafy greens.',
    'chromium': 'Enhances insulin action and influences carbohydrate, fat, and protein metabolism. Found in meat, whole grains, and broccoli.',
    'molybdenum': 'Cofactor for enzymes that help metabolize toxins and drugs in the body. Found in legumes, grains, and nuts.'
  };
  
  // Return description if available, otherwise check for partial matches
  const exactMatch = descriptions[name.toLowerCase()];
  if (exactMatch) return exactMatch;
  
  // Try to find partial matches for important nutrients
  const lowercaseName = name.toLowerCase();
  
  // Check for B vitamins with different formats
  if (lowercaseName.includes('vitamin b') || lowercaseName.match(/b\d+/) || lowercaseName.includes('b vitamin')) {
    return 'B vitamins are essential for energy production, brain function, and cell metabolism. They help convert food into energy and are important for nervous system health.';
  }
  
  // Check for other vitamin partial matches
  if (lowercaseName.includes('vitamin')) {
    return 'Vitamins are essential micronutrients that support various bodily functions including immune health, energy production, and cell repair.';
  }
  
  // Check for mineral partial matches
  const minerals = ['iron', 'calcium', 'zinc', 'magnesium', 'potassium', 'sodium', 'copper', 'manganese', 'selenium'];
  for (const mineral of minerals) {
    if (lowercaseName.includes(mineral)) {
      return descriptions[mineral] || 'Essential mineral that supports various bodily functions and overall health.';
    }
  }
  
  // Default description
  return 'Important nutrient for overall health and wellbeing. Part of a balanced diet that supports bodily functions.';
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
      categories['Vitamins'].push(nutrient);
    } else if (category === 'mineral' || 
       ['calcium', 'iron', 'zinc', 'magnesium', 'potassium', 'sodium', 'phosphorus'].some(m => name.includes(m))) {
      categories['Minerals'].push(nutrient);
    } else if (category === 'antioxidant' || 
       ['flavonoid', 'carotenoid', 'lycopene', 'lutein', 'resveratrol', 'polyphenol'].some(a => name.includes(a))) {
      categories['Antioxidants'].push(nutrient);
    } else if (category === 'fatty-acid' || 
       ['omega', 'dha', 'epa', 'fatty acid'].some(f => name.includes(f))) {
      categories['Essential Fatty Acids'].push(nutrient);
    } else {
      categories['Other'].push(nutrient);
    }
  });
  
  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
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
  // Calculate personalized daily value for this nutrient
  // Using personalizedValues state instead of direct profile reference
  const personalizedDV = personalizedValues[nutrient.name.toLowerCase()] || null;
  
  // Use personalized value if available, otherwise use the standard one
  const displayValue = personalizedDV || nutrient.percentDailyValue || 0;
  
  // Cap percentage at 100% for display purposes
  const displayPercentage = Math.min(displayValue, 100);
  
  // Choose appropriate color based on type of nutrient
  let barColor = 'bg-blue-500';
  
  // Protein: Blue
  if (nutrient.name.toLowerCase().includes('protein')) {
    barColor = 'bg-blue-500';
  } 
  // Carbs: Green
  else if (nutrient.name.toLowerCase().includes('carb')) {
    barColor = 'bg-green-500';
  } 
  // Fats: Yellow/orange
  else if (nutrient.name.toLowerCase().includes('fat')) {
    barColor = 'bg-amber-500';
  }
  // Fiber: Purple
  else if (nutrient.name.toLowerCase().includes('fiber')) {
    barColor = 'bg-purple-500';
  }
  // Sugars: Red (usually try to minimize)
  else if (nutrient.name.toLowerCase().includes('sugar')) {
    barColor = 'bg-red-500';
  }
  
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
              {displayValue > 0 ? `(${displayValue}% DV${personalizedDV !== nutrient.percentDailyValue ? '*' : ''})` : '(DV not available)'}
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
      
      {personalizedDV !== nutrient.percentDailyValue && (
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
        if (age >= 19 && age <= 50) {
          return Math.round((nutrient.amount / 18) * 100); // Women 19-50 need 18mg iron
        } else {
          return Math.round((nutrient.amount / 8) * 100); // Women 51+ need 8mg iron
        }
      } else if (name === 'calcium') {
        if (age >= 51) {
          return Math.round((nutrient.amount / 1200) * 100); // Women 51+ need 1200mg calcium
        }
      }
    }
  }
  
  // Age-specific adjustments
  if (age) {
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
  
  // Add general recommendations if we don't have enough
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
    const insights = [];
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
  const { user, profile: userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'macronutrients' | 'micronutrients' | 'insights'>('macronutrients');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalizedValues, setPersonalizedValues] = useState<Record<string, number>>({});

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Try to get from window global first
        if (typeof window !== 'undefined' && window.currentUserProfile) {
          setProfile(window.currentUserProfile);
          
          // Calculate personalized daily values
          const personalDVs = calculatePersonalizedDailyValues(window.currentUserProfile);
          setPersonalizedValues(personalDVs);
          return;
        }

        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('No authenticated user for profile fetch');
          return;
        }
        
        // Fetch the user's profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
        } else if (data) {
          setProfile(data);
          
          // Calculate personalized daily values
          const personalDVs = calculatePersonalizedDailyValues(data);
          setPersonalizedValues(personalDVs);
        }
      } catch (error) {
        console.error('Exception fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  // Effect to get insights when analysis data is available
  useEffect(() => {
    if (analysisData) {
      // Check for personalized insights in various places in the data structure
      const insightsText = 
        analysisData.personalized_insights || 
        analysisData.insights || 
        (analysisData.analysis && analysisData.analysis.personalized_insights) || 
        (analysisData.analysis && analysisData.analysis.insights) ||
        null;
      
      if (insightsText) {
        setInsights(insightsText);
      } else {
        // No insights available, try to generate them from the analysisData
        try {
          // TODO: Implement a client-side insights generator if needed
          console.log("No pre-generated insights found in the analysis data");
        } catch (error) {
          console.error("Error generating insights:", error);
        }
      }
    }
  }, [analysisData]);

  // Skip rendering if no data
  if (!analysisData) {
    return (
      <div className="text-center p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Helper function to extract macronutrients and micronutrients
  const getMacronutrients = () => {
    const macros = analysisData.macronutrients || 
           analysisData.analysis?.macronutrients || 
           analysisData.nutrients?.macronutrients ||
           [];
    
    // Ensure it's an array
    return Array.isArray(macros) ? macros : [];
  };
  
  const getMicronutrients = () => {
    const micros = analysisData.micronutrients || 
           analysisData.analysis?.micronutrients || 
           analysisData.nutrients?.micronutrients ||
           [];
    
    // Ensure it's an array
    return Array.isArray(micros) ? micros : [];
  };

  // Helper function to get benefits
  const getBenefits = () => {
    const benefits = analysisData.benefits || 
                    analysisData.analysis?.benefits || 
                    [];
    
    // Ensure it's an array
    return Array.isArray(benefits) ? benefits : [];
  };

  // Helper function to get concerns
  const getConcerns = () => {
    const concerns = analysisData.concerns || 
                    analysisData.analysis?.concerns || 
                    [];
    
    // Ensure it's an array
    return Array.isArray(concerns) ? concerns : [];
  };

  // Helper function to get suggestions
  const getSuggestions = () => {
    const suggestions = analysisData.suggestions || 
                        analysisData.analysis?.suggestions || 
                        [];
    
    // Ensure it's an array
    return Array.isArray(suggestions) ? suggestions : [];
  };

  // Fix the calorie calculation to ensure proper typing
  const calories = analysisData.calories || 
                  (analysisData.analysis && (analysisData.analysis.calories || analysisData.analysis.totalCalories)) || 
                  0;

  // Helper function to extract phytonutrients
  const getPhytonutrients = () => {
    return analysisData.phytonutrients || 
           analysisData.analysis?.phytonutrients || 
           [];
  };

  // Helper function to get glycemic impact
  const getGlycemicImpact = () => {
    return analysisData.glycemicImpact || 
           analysisData.analysis?.glycemicImpact || 
           '';
  };

  // Helper function to get inflammatory potential
  const getInflammatoryPotential = () => {
    return analysisData.inflammatoryPotential || 
           analysisData.analysis?.inflammatoryPotential || 
           '';
  };

  // Helper function to get nutrient density
  const getNutrientDensity = () => {
    return analysisData.nutrientDensity || 
           analysisData.analysis?.nutrientDensity || 
           '';
  };

  // Helper function to get scientific insights
  const getScientificInsights = () => {
    return analysisData.scientificInsights || 
           analysisData.analysis?.scientificInsights || 
           [];
  };

  // Helper function to get goal alignment
  const getGoalAlignment = () => {
    return analysisData.goalAlignment || 
           analysisData.analysis?.goalAlignment || 
           '';
  };

  // Organize the categorized micronutrients
  const categorizedMicronutrients = categorizeNutrients(getMicronutrients());

  useEffect(() => {
    // Simplified initialization without profile fetching
    // Just set defaults for now
    setPersonalizedValues({
      calories: 2000,
      protein: 50,
      carbs: 275,
      fat: 78,
      fiber: 28
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Calories */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Calories & Nutrients</h2>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold text-gray-700">Calories</h3>
            <span className="text-2xl font-bold text-blue-600">
              {calories} <span className="text-sm font-normal">kcal</span>
            </span>
          </div>
          
          {userProfile && personalizedValues.calories && (
            <p className="text-sm text-gray-500 mt-1">
              {Math.round((calories / personalizedValues.calories) * 100)}% of your daily calorie goal 
              ({Math.round(personalizedValues.calories)} kcal)
            </p>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex -mb-px">
            <button 
              onClick={() => setActiveTab('macronutrients')}
              className={`mr-4 py-4 text-sm font-medium ${
                activeTab === 'macronutrients' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Macronutrients
            </button>
            <button 
              onClick={() => setActiveTab('micronutrients')}
              className={`mr-4 py-4 text-sm font-medium ${
                activeTab === 'micronutrients' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Micronutrients
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={`py-4 text-sm font-medium ${
                activeTab === 'insights' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Insights
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mt-6">
          {/* Macronutrients Tab */}
          {activeTab === 'macronutrients' && (
            <div className="space-y-4">
              {getMacronutrients().map((nutrient, index) => {
                const percentValue = nutrient.percentDailyValue || 0;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{nutrient.name}</span>
                      <span className="text-gray-900">
                        {nutrient.amount} {nutrient.unit}
                        {percentValue > 0 && (
                          <span className="text-sm text-gray-500 ml-1">
                            ({percentValue}% DV)
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          nutrient.name.toLowerCase().includes('protein') ? 'bg-blue-600' :
                          nutrient.name.toLowerCase().includes('carb') ? 'bg-green-500' :
                          nutrient.name.toLowerCase().includes('fat') ? 'bg-amber-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, percentValue)}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {nutrient.description || `${nutrient.name} is an essential macronutrient for your body.`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Micronutrients Tab */}
          {activeTab === 'micronutrients' && (
            <div className="space-y-6">
              {Object.keys(categorizedMicronutrients).length > 0 ? (
                <>
                  {Object.entries(categorizedMicronutrients).map(([category, nutrients]) => (
                    <div key={category} className="mb-6">
                      <h4 className="font-medium text-lg mb-3">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nutrients.map((nutrient: any, index: number) => {
                          // Skip if no name
                          if (!nutrient || !nutrient.name) return null;
                          
                          // Get badge for visual status indication
                          const badge = getNutrientBadge(nutrient);
                          const percentValue = nutrient.percentDailyValue || 0;
                          
                          return (
                            <div key={index} className="border rounded-lg p-3 shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                <h5 className="font-medium">{nutrient.name}</h5>
                                {badge && (
                                  <span className={`${badge.color} text-white text-xs px-2 py-0.5 rounded-full`}>
                                    {badge.label}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="font-bold">{nutrient.amount} {nutrient.unit}</span>
                                {percentValue > 0 && (
                                  <span className="text-gray-600 text-xs">{percentValue}% DV</span>
                                )}
                              </div>
                              
                              <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    percentValue >= 50 ? 'bg-green-500' : 
                                    percentValue >= 25 ? 'bg-green-400' : 
                                    'bg-green-300'
                                  }`}
                                  style={{ width: `${Math.min(percentValue, 100)}%` }}
                                ></div>
                              </div>
                              
                              {(nutrient.description || nutrient.name) && (
                                <p className="text-gray-600 mt-1 text-xs">
                                  {nutrient.description || getMicronutrientBenefit(nutrient.name)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {/* Phytonutrients section if available */}
                  {getPhytonutrients() && getPhytonutrients().length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-medium text-lg mb-3">Phytonutrients</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getPhytonutrients().map((phyto: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3 shadow-sm bg-green-50">
                            <h5 className="font-medium">{phyto.name}</h5>
                            <p className="text-gray-700 text-sm mt-1">{phyto.significance}</p>
                            {phyto.food_source && (
                              <p className="text-gray-600 text-xs mt-1">Source: {phyto.food_source}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No micronutrient data available for this meal.
                </div>
              )}
            </div>
          )}
          
          {/* Enhanced Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Markdown Insights */}
              <div className="prose max-w-none">
                {isLoading ? (
                  <div className="animate-pulse space-y-4 py-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : insights ? (
                  <ReactMarkdown>{insights}</ReactMarkdown>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Detailed insights not available for this meal.</p>
                    <p className="mt-2 text-sm">
                      Complete your profile to receive personalized nutritional insights.
                    </p>
                    
                    {/* Basic insights from other data */}
                    {(getBenefits().length > 0 || getSuggestions().length > 0) && (
                      <div className="mt-6 text-left bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-semibold text-blue-800 mb-2">Basic Analysis</h3>
                        
                        {/* Show benefits if available */}
                        {getBenefits().length > 0 && (
                          <div className="mb-3">
                            <h4 className="font-medium text-blue-700">Benefits:</h4>
                            <ul className="list-disc pl-5 text-gray-700">
                              {getBenefits().map((benefit, i) => (
                                <li key={i} className="text-sm">{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Show suggestions if available */}
                        {getSuggestions().length > 0 && (
                          <div>
                            <h4 className="font-medium text-blue-700">Suggestions:</h4>
                            <ul className="list-disc pl-5 text-gray-700">
                              {getSuggestions().map((suggestion, i) => (
                                <li key={i} className="text-sm">{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Glycemic Impact */}
              {getGlycemicImpact() && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-blue-800">Glycemic Impact</h3>
                  <p className="text-sm text-blue-700 mt-1">{getGlycemicImpact()}</p>
                </div>
              )}
              
              {/* Inflammatory Potential */}
              {getInflammatoryPotential() && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <h3 className="font-medium text-amber-800">Inflammatory Potential</h3>
                  <p className="text-sm text-amber-700 mt-1">{getInflammatoryPotential()}</p>
                </div>
              )}
              
              {/* Nutrient Density */}
              {getNutrientDensity() && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <h3 className="font-medium text-indigo-800">Nutrient Density</h3>
                  <p className="text-sm text-indigo-700 mt-1">{getNutrientDensity()}</p>
                </div>
              )}
              
              {/* Scientific Insights */}
              {getScientificInsights().length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <h3 className="font-medium text-purple-800">Scientific Insights</h3>
                  <ul className="mt-2 space-y-2">
                    {getScientificInsights().map((insight, index) => (
                      <li key={index} className="text-sm text-purple-700">• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Goal Alignment */}
              {getGoalAlignment() && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                  <h3 className="font-medium text-emerald-800">Goal Alignment</h3>
                  <p className="text-sm text-emerald-700 mt-1">{getGoalAlignment()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Health Benefits */}
      {getBenefits().length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Health Benefits</h2>
          
          <ul className="space-y-2">
            {getBenefits().map((benefit, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Suggestions */}
      {getSuggestions().length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Suggestions for Improvement</h2>
          
          <ul className="space-y-2">
            {getSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PersonalizedNutritionAnalysis; 