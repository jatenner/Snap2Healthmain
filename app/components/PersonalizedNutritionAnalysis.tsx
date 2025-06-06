'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './client/ClientAuthProvider';
import { safeForEach, safeMap, safeFilter, getArrayOrEmpty } from '../lib/utils';
import { createClient } from '../lib/supabase/client';

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
    // Macronutrients
    'protein': 'Builds and repairs your muscles, keeps you feeling full longer, and helps your body recover after workouts. Great for maintaining a strong, lean physique.',
    'carbohydrates': 'Primary fuel for brain function and high-intensity exercise. Glucose is the preferred substrate for neurons, with glycogen stores critical for sustained cognitive and physical performance.',
    'fat': 'Essential for hormone production, fat-soluble vitamin absorption, and cellular membrane integrity. Omega-3 fatty acids modulate inflammation and support neuroplasticity.',
    'fiber': 'Critical for microbiome health and metabolic regulation. Soluble fiber feeds beneficial bacteria, producing short-chain fatty acids that reduce inflammation and improve insulin sensitivity.',
    'sugar': 'Rapidly absorbed glucose that can cause insulin spikes. While providing quick energy, excess consumption can lead to glycation, oxidative stress, and metabolic dysfunction.',
    'sodium': 'Essential electrolyte for nerve conduction and fluid balance. However, excess intake can disrupt the renin-angiotensin system and increase cardiovascular stress.',
    'saturated fat': 'Can raise LDL cholesterol in some individuals. However, quality matters - medium-chain triglycerides from coconut oil may have different metabolic effects than palmitic acid.',
    'trans fat': 'Industrial trans fats severely disrupt cellular membrane function and increase systemic inflammation. Even small amounts can negatively impact cardiovascular health.',
    'unsaturated fat': 'Monounsaturated and polyunsaturated fats support cardiovascular health and reduce inflammation. Olive oil polyphenols activate longevity pathways.',
    'omega-3': 'EPA and DHA are crucial for brain health, reducing neuroinflammation, and supporting cognitive function. They also modulate the inflammatory response and may extend healthspan.',
    'omega-6': 'While essential, excessive omega-6 intake can promote inflammation when not balanced with omega-3s. The ideal ratio is closer to 4:1 or 2:1 omega-6 to omega-3.',
    'cholesterol': 'Precursor to steroid hormones including testosterone, estrogen, and cortisol. Dietary cholesterol has minimal impact on blood cholesterol for most people.',
    'calories': 'Units of energy that fuel cellular processes. Caloric restriction can activate sirtuins and other longevity pathways, while excess calories accelerate aging.',
    
    // Vitamins - Scientific descriptions
    'vitamin a': 'Critical for rhodopsin regeneration in the retina and immune function. Retinol supports T-cell differentiation and epithelial barrier function.',
    'vitamin c': 'Powerful antioxidant and cofactor for collagen synthesis. Essential for neutrophil function and may reduce exercise-induced oxidative stress.',
    'vitamin d': 'Steroid hormone that regulates over 1000 genes. Critical for calcium homeostasis, immune modulation, and potentially longevity. Most people are deficient.',
    'vitamin e': 'Fat-soluble antioxidant that protects cellular membranes from lipid peroxidation. Alpha-tocopherol is the most bioactive form.',
    'vitamin k': 'Essential cofactor for gamma-carboxylation of proteins involved in blood clotting and bone mineralization. K2 (MK-7) may support cardiovascular health.',
    'vitamin b1': 'Thiamine is crucial for glucose metabolism and nerve function. Deficiency can impair cognitive performance and energy production.',
    'vitamin b2': 'Riboflavin is essential for the electron transport chain and antioxidant enzyme function. Critical for mitochondrial energy production.',
    'vitamin b3': 'Niacin is a precursor to NAD+, crucial for cellular energy production and DNA repair. May support longevity through sirtuin activation.',
    'vitamin b5': 'Pantothenic acid is essential for CoA synthesis, critical for fatty acid metabolism and neurotransmitter production.',
    'vitamin b6': 'Pyridoxine is crucial for amino acid metabolism and neurotransmitter synthesis including serotonin and dopamine.',
    'vitamin b7': 'Biotin is essential for fatty acid synthesis and gluconeogenesis. Critical for gene regulation and cellular metabolism.',
    'vitamin b9': 'Folate is crucial for DNA methylation and one-carbon metabolism. Essential for neuroplasticity and cognitive function.',
    'vitamin b12': 'Cobalamin is essential for myelin synthesis and DNA methylation. Deficiency can cause irreversible neurological damage.',
    
    // Minerals - Scientific descriptions
    'calcium': 'Essential for muscle contraction, nerve signaling, and bone mineralization. Also crucial for cellular signaling and enzyme function.',
    'iron': 'Central component of hemoglobin and cytochromes. Essential for oxygen transport and mitochondrial energy production.',
    'potassium': 'Critical electrolyte for maintaining membrane potential and muscle function. May help counteract sodium\'s effects on blood pressure.',
    'magnesium': 'Cofactor for over 300 enzymes including those involved in ATP synthesis. Essential for muscle relaxation and nervous system function.',
    'zinc': 'Essential for immune function, protein synthesis, and wound healing. Cofactor for antioxidant enzymes and DNA repair mechanisms.',
    'phosphorus': 'Critical component of ATP, phospholipids, and bone mineral. Essential for cellular energy metabolism and membrane structure.',
    'selenium': 'Essential component of glutathione peroxidase, a key antioxidant enzyme. May support thyroid function and reduce cancer risk.',
    'iodine': 'Essential for thyroid hormone synthesis. Critical for metabolic rate regulation and brain development.',
    'copper': 'Essential for collagen cross-linking, iron metabolism, and antioxidant enzyme function. Important for cardiovascular health.',
    'manganese': 'Cofactor for superoxide dismutase and other antioxidant enzymes. Important for bone development and metabolism.',
    'chromium': 'May enhance insulin sensitivity and glucose metabolism, though evidence is mixed. Potentially important for metabolic health.',
    'molybdenum': 'Cofactor for enzymes involved in amino acid metabolism and toxin processing. Essential but needed in very small amounts.'
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
  // Calculate personalized daily value for this nutrient
  const personalizedDV = null; // Simplified for now, can be enhanced with user profile
  
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

  // Auto-generate insights on mount if we don't have them
  useEffect(() => {
    const existingInsights = getExistingInsights();
    
    if (existingInsights) {
      // We have good insights already - use them immediately
      console.log('[PersonalizedNutritionAnalysis] Using existing insights from meal analysis');
      setPersonalizedInsights(existingInsights);
      setIsGeneratingInsights(false);
    } else {
      // Only auto-generate if we have no insights at all
      console.log('[PersonalizedNutritionAnalysis] No insights found - checking again...');
      
      // Try checking the database or API to get fresh insights
      const freshInsights = analysisData?.personalized_insights || analysisData?.insights;
      if (freshInsights && freshInsights.length > 100) {
        console.log('[PersonalizedNutritionAnalysis] Found fresh insights from data');
        setPersonalizedInsights(freshInsights);
        setIsGeneratingInsights(false);
      } else {
        // Auto-generate insights instead of showing fallback
        console.log('[PersonalizedNutritionAnalysis] Automatically generating insights...');
        setIsGeneratingInsights(true);
        generatePersonalizedInsights();
      }
    }
  }, [analysisData]);

  const generatePersonalizedInsights = async () => {
    // Always check for existing insights first
    const existingInsights = getExistingInsights();
    
    if (existingInsights && !forceRegenerate) {
      console.log('[generatePersonalizedInsights] Using existing insights instead of regenerating');
      setPersonalizedInsights(existingInsights);
      return;
    }

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
    return macros.map(nutrient => ({
      ...nutrient,
      description: nutrient.description || getNutrientDescription(nutrient.name)
    }));
  };
  
  const getMicronutrients = (): Nutrient[] => {
    const micros = analysisData?.micronutrients || analysisData?.analysis?.micronutrients || [];
    return micros.map(nutrient => ({
      ...nutrient,
      description: nutrient.description || getNutrientDescription(nutrient.name)
    }));
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
      analysisData?.insights,
      analysisData?.analysis?.personalized_insights,
      analysisData?.analysis?.insights,
      (analysisData?.analysis as any)?.personalized_health_insights,
      analysisData?.personalizedHealthInsights,
      analysisData?.scientificInsights,
      (analysisData?.analysis as any)?.scientificInsights
    ];

    console.log('[getExistingInsights] Checking sources:', {
      'personalized_insights': !!analysisData?.personalized_insights,
      'insights': !!analysisData?.insights,
      'analysis.personalized_insights': !!analysisData?.analysis?.personalized_insights,
      'analysis.insights': !!analysisData?.analysis?.insights
    });

    for (const source of sources) {
      if (source && typeof source === 'string' && source.length > 100) {
        console.log('[getExistingInsights] Found insights of length:', source.length);
        console.log('[getExistingInsights] Preview:', source.substring(0, 200) + '...');
        return source;
      }
    }

    console.log('[getExistingInsights] No quality insights found in data');
    return '';
  };

  // Helper function to get nutrient status color
  const getNutrientStatusColor = (nutrient: Nutrient): string => {
    const dv = nutrient.percentDailyValue || 0;
    
    // For nutrients we want to limit (sodium, sugar, saturated fat)
    const limitNutrients = ['sodium', 'sugar', 'saturated fat', 'cholesterol'];
    const isLimitNutrient = limitNutrients.some(limit => 
      nutrient.name.toLowerCase().includes(limit)
    );
    
    if (isLimitNutrient) {
      if (dv >= 50) return 'bg-red-500';
      if (dv >= 25) return 'bg-yellow-500';
      return 'bg-green-500';
    }
    
    // For beneficial nutrients
    if (dv >= 50) return 'bg-green-500';
    if (dv >= 25) return 'bg-green-400';
    if (dv >= 10) return 'bg-blue-500';
    return 'bg-gray-500';
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
    if (dv >= 25) return 'Good';
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Meal Header */}
      {getImageUrl() && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="aspect-square relative rounded-xl overflow-hidden shadow-2xl">
              <img
                src={getImageUrl()}
                alt={getMealName()}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white leading-tight">{getMealName()}</h2>
              <div className="text-5xl font-bold text-blue-400 mb-4">
                {getCalories()} <span className="text-xl font-normal text-gray-400">calories</span>
              </div>
              {analysisData.created_at && (
                <p className="text-gray-400 text-lg">
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
          <nav className="flex">
            <button 
              onClick={() => setActiveTab('nutrients')}
              className={`flex-1 py-6 px-8 text-center font-semibold transition-all ${
                activeTab === 'nutrients' 
                  ? 'bg-blue-600 text-white border-b-4 border-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center text-lg">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Nutritional Analysis
              </span>
            </button>
            
            <button 
              onClick={() => setActiveTab('ai-insights')}
              className={`flex-1 py-6 px-8 text-center font-semibold transition-all ${
                activeTab === 'ai-insights' 
                  ? 'bg-blue-600 text-white border-b-4 border-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center text-lg">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Health Insights
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
                  <div className="grid lg:grid-cols-2 gap-6">
                    {getMacronutrients().map((nutrient, index) => (
                      <div key={index} className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-2xl font-semibold text-white mb-2">{nutrient.name}</h4>
                            <p className="text-3xl font-bold text-blue-400">
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
                              className={`h-4 rounded-full transition-all duration-700 ${
                                nutrient.name.toLowerCase().includes('protein') ? 'bg-blue-500' :
                          nutrient.name.toLowerCase().includes('carb') ? 'bg-green-500' :
                          nutrient.name.toLowerCase().includes('fat') ? 'bg-amber-500' : 'bg-purple-500'
                        }`}
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

              {/* Micronutrients */}
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
                  <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                    {getMicronutrients().map((nutrient, index) => (
                      <div key={index} className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-semibold text-white text-lg leading-tight">{nutrient.name}</h5>
                          {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getNutrientStatusColor(nutrient)}`}>
                              {getNutrientStatusText(nutrient)}
                                  </span>
                                )}
                              </div>
                              
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xl font-bold text-blue-400">
                            {nutrient.amount} {nutrient.unit}
                          </span>
                          {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                            <span className="text-gray-300 font-medium">
                              {Math.round(nutrient.percentDailyValue)}% DV
                            </span>
                                )}
                              </div>
                              
                        {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                          <div className="w-full bg-gray-600 rounded-full h-2 mb-4">
                            <div 
                              className={`h-2 rounded-full transition-all duration-700 ${getNutrientStatusColor(nutrient)}`}
                              style={{ width: `${Math.min(nutrient.percentDailyValue, 100)}%` }}
                                ></div>
                              </div>
                        )}
                        
                        <p className="text-gray-400 text-xs leading-relaxed">{nutrient.description}</p>
                          </div>
                        ))}
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
              <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                <span className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                Scientific Analysis & Personalized Insights
              </h3>

              {/* Personalized Insights */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <span className="text-2xl">🧠</span>
            </div>
                      <h3 className="text-xl font-semibold text-purple-300">Scientific Analysis & Personalized Insights</h3>
                    </div>
                    {personalizedInsights && (
                      <button
                        onClick={() => {
                          setForceRegenerate(true);
                          generatePersonalizedInsights(); // Regenerate with enhanced prompt
                        }}
                        disabled={isGeneratingInsights}
                        className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600/70 disabled:opacity-50 disabled:cursor-not-allowed text-purple-200 text-sm rounded-lg border border-purple-500/30 transition-all duration-200 hover:border-purple-400/50"
                      >
                        {isGeneratingInsights ? 'Generating...' : 'Regenerate Enhanced Analysis'}
                      </button>
                    )}
                  </div>
                  
                  {isGeneratingInsights ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-purple-300">Generating deep scientific analysis...</span>
                      </div>
                    </div>
                  ) : personalizedInsights ? (
                    <div className="prose prose-invert prose-purple max-w-none">
                      {personalizedInsights ? (
            <div className="space-y-6">
                          {personalizedInsights.split('\n\n').map((paragraph, index) => {
                            // Check if this is a section header (starts with ##)
                            if (paragraph.trim().startsWith('## ')) {
                              const headerText = paragraph.replace(/^## /, '').trim();
                              return (
                                <div key={index} className="border-l-4 border-purple-500 pl-4 mb-4">
                                  <h3 className="text-lg font-semibold text-purple-300 mb-2">
                                    {headerText}
                                  </h3>
                  </div>
                              );
                            }
                            // Check if this is a subsection header (starts with **)
                            else if (paragraph.trim().includes('**') && paragraph.trim().length < 200) {
                              const cleanText = paragraph.replace(/\*\*/g, '');
                              return (
                                <div key={index} className="mt-6 mb-3">
                                  <h4 className="text-md font-medium text-purple-200 opacity-90">
                                    {cleanText}
                                  </h4>
                                </div>
                              );
                            }
                            // Regular paragraph content
                            else if (paragraph.trim()) {
                              return (
                                <div key={index} className="text-gray-300 leading-relaxed mb-4">
                                  {paragraph.split('\n').map((line, lineIndex) => {
                                    // Handle bold text within paragraphs
                                    if (line.includes('**')) {
                                      const parts = line.split(/(\*\*.*?\*\*)/g);
                                      return (
                                        <p key={lineIndex} className="mb-2">
                                          {parts.map((part, partIndex) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                              return (
                                                <span key={partIndex} className="font-semibold text-purple-200">
                                                  {part.replace(/\*\*/g, '')}
                                                </span>
                                              );
                                            }
                                            return <span key={partIndex}>{part}</span>;
                                          })}
                                        </p>
                                      );
                                    } else if (line.trim()) {
                                      return <p key={lineIndex} className="mb-2">{line}</p>;
                                    }
                                    return null;
                                  })}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="animate-pulse">
                            <div className="bg-purple-900/30 h-4 rounded mb-4"></div>
                            <div className="bg-purple-900/30 h-4 rounded mb-4 w-3/4 mx-auto"></div>
                            <div className="bg-purple-900/30 h-4 rounded mb-4 w-1/2 mx-auto"></div>
                          </div>
                          <p className="text-purple-300 mt-4">
                            {isGeneratingInsights ? 'Generating personalized insights...' : 'Click to generate insights'}
                          </p>
                          </div>
                        )}
                          </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">Click below to generate AI-powered insights about how this meal will affect your daily life</div>
                      <button
                        onClick={generatePersonalizedInsights}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                      >
                        Generate Scientific Analysis
                      </button>
                      </div>
                    )}
                  </div>
              </div>
              
              {/* Expert Recommendations */}
              {analysisData.expert_recommendations && analysisData.expert_recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-green-900/50 to-teal-900/50 border border-green-700/50 rounded-xl p-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Expert Recommendations
                  </h4>
                  <div className="space-y-4">
                    {analysisData.expert_recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-3 h-3 bg-green-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <p className="text-green-100 text-lg leading-relaxed">{recommendation}</p>
                </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional Analysis Sections */}
              {analysisData.meal_story && (
                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-700/50 rounded-xl p-8">
                  <h4 className="text-2xl font-semibold text-white mb-6">Metabolic Journey</h4>
                  <p className="text-indigo-100 leading-relaxed text-lg">{analysisData.meal_story}</p>
                </div>
              )}
              
              {analysisData.nutritional_narrative && (
                <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border border-orange-700/50 rounded-xl p-8">
                  <h4 className="text-2xl font-semibold text-white mb-6">Nutritional Science</h4>
                  <p className="text-orange-100 leading-relaxed text-lg">{analysisData.nutritional_narrative}</p>
                </div>
              )}
              
              {analysisData.time_of_day_optimization && (
                <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-700/50 rounded-xl p-8">
                  <h4 className="text-2xl font-semibold text-white mb-6">Circadian Optimization</h4>
                  <p className="text-cyan-100 leading-relaxed text-lg">{analysisData.time_of_day_optimization}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedNutritionAnalysis; 