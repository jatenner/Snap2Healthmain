/**
 * NutritionAnalysis Component
 * 
 * This component displays detailed nutritional analysis of a meal,
 * including macronutrients, micronutrients, and health insights.
 * It can be personalized based on user profile data.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './client/ClientAuthProvider';
import { safeMap, getArrayOrEmpty } from '@/lib/utils';

interface MacroNutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue: number;
  description?: string;
}

interface MicroNutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue: number;
  description?: string;
  category?: string;
}

interface UserProfile {
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  goal?: string;
  activityLevel?: string;
}

interface NutritionData {
  calories: number;
  macronutrients: MacroNutrient[];
  micronutrients: MicroNutrient[];
  goal?: string;
  caption?: string;
  hydration?: {
    level: number;
    waterContent: number;
    unit: string;
  };
  glycemicLoad?: {
    value: number;
    index: number;
  };
}

interface NutritionAnalysisProps {
  data: NutritionData;
  showType?: 'macros' | 'micros' | 'all';
  withUserProfile?: boolean;
  userProfile?: UserProfile; // Add optional user profile
}

// Improved helper function to categorize micronutrients with more comprehensive recognition
const categorizeMicronutrients = (micronutrients: MicroNutrient[]) => {
  const categories: Record<string, MicroNutrient[]> = {
    'Vitamins': [],
    'Minerals': [],
    'Antioxidants': [],
    'Essential Fatty Acids': [],
    'Other Nutrients': []
  };
  
  // If micronutrients is undefined or not an array, return empty categories
  if (!micronutrients || !Array.isArray(micronutrients) || micronutrients.length === 0) {
    return {};
  }
  
  // Enhanced lists with comprehensive nutrient names
  const vitaminNames = [
    'vitamin a', 'vitamin c', 'vitamin d', 'vitamin e', 'vitamin k', 
    'vitamin b1', 'vitamin b2', 'vitamin b3', 'vitamin b5', 'vitamin b6', 'vitamin b7', 'vitamin b9', 'vitamin b12',
    'thiamine', 'riboflavin', 'niacin', 'folate', 'folic acid', 'cobalamin', 'biotin', 'pantothenic acid',
    'retinol', 'ascorbic acid', 'calciferol', 'tocopherol', 'phylloquinone', 'menaquinone', 'pyridoxine', 'cyanocobalamin',
    'choline', 'betaine', 'thiamin', 'folacin', 'pyridoxal', 'retinal', 'retinoic acid', 'dehydroretinol',
    'ergocalciferol', 'cholecalciferol', 'α-tocopherol', 'γ-tocopherol', 'δ-tocopherol', 'β-tocopherol'
  ];
  
  const mineralNames = [
    'calcium', 'iron', 'zinc', 'magnesium', 'potassium', 'sodium', 'phosphorus', 
    'iodine', 'selenium', 'copper', 'manganese', 'chromium', 'molybdenum', 
    'fluoride', 'chloride', 'sulfur', 'cobalt', 'boron', 'silicon', 'vanadium', 'nickel', 'tin', 'lithium',
    'phosphate', 'ferrous', 'ferric', 'phosphate', 'ferritin', 'transferrin', 'hemoglobin'
  ];
  
  const antioxidantNames = [
    'flavonoid', 'carotenoid', 'lycopene', 'lutein', 'zeaxanthin', 'resveratrol', 'anthocyanin',
    'catechin', 'quercetin', 'polyphenol', 'antioxidant', 'glutathione', 'coenzyme q10', 'coq10',
    'beta-carotene', 'alpha-carotene', 'astaxanthin', 'cryptoxanthin', 'epicatechin', 'epigallocatechin',
    'proanthocyanidin', 'isoflavone', 'lignans', 'kaempferol', 'myricetin', 'tannin', 'ellagic acid', 
    'curcumin', 'chlorogenic acid', 'caffeic acid', 'ferulic acid', 'selenium', 'glutathione peroxidase',
    'superoxide dismutase', 'catalase', 'thioredoxin', 'carotene', 'xanthophyll'
  ];
  
  const fattyAcidNames = [
    'omega-3', 'omega-6', 'omega-9', 'epa', 'dha', 'alpha-linolenic', 'linoleic acid',
    'oleic acid', 'fatty acid', 'essential fatty acid', 'pufa', 'mufa', 'saturated fat',
    'unsaturated fat', 'polyunsaturated', 'monounsaturated', 'docosahexaenoic', 'eicosapentaenoic',
    'arachidonic', 'linolenic', 'stearidonic', 'eicosatetraenoic', 'gamma-linolenic', 'dihomo-gamma-linolenic',
    'adrenic', 'docosapentaenoic', 'ala', 'sfa', 'medium-chain triglyceride', 'mct'
  ];
  
  // Additional category for other important nutrients
  const otherNutrientNames = [
    'fiber', 'dietary fiber', 'soluble fiber', 'insoluble fiber', 'protein', 'amino acid',
    'carbohydrate', 'starch', 'sugars', 'glucose', 'fructose', 'lactose', 'galactose', 'sucrose',
    'maltose', 'phytosterol', 'beta-glucan', 'phytate', 'isoflavone', 'zeaxanthin', 'choline',
    'betaine', 'creatine', 'carnitine', 'taurine', 'lecithin', 'inositol', 'glutamine', 'glycine',
    'cysteine', 'proline', 'arginine', 'tryptophan', 'lysine', 'methionine', 'theanine', 'bcaa'
  ];
  
  micronutrients.forEach(nutrient => {
    // Convert name to lowercase for case-insensitive matching
    const name = nutrient.name.toLowerCase();
    
    // Check for vitamins with much more comprehensive matching
    if (
        vitaminNames.some(v => name.includes(v)) || 
        name.match(/vitamin\s+[a-z]/i) || 
        name.match(/b\d+/) ||
        name.includes('vitamin') || 
        name.startsWith('vit') ||
        name.endsWith('vitamin')
    ) {
      nutrient.category = 'Vitamins';
      categories['Vitamins']?.push(nutrient);
    } 
    // Check for minerals with improved matching
    else if (
        mineralNames.some(m => name.includes(m)) || 
        name.includes('mineral') || 
        name.endsWith('ide') && !name.includes('saccharide') // Many minerals end with -ide (chloride, fluoride)
    ) {
      nutrient.category = 'Minerals';
      categories['Minerals']?.push(nutrient);
    } 
    // Check for antioxidants
    else if (
        antioxidantNames.some(a => name.includes(a)) ||
        name.includes('antioxidant') ||
        name.includes('flavon')
    ) {
      nutrient.category = 'Antioxidants';
      categories['Antioxidants']?.push(nutrient);
    }
    // Check for essential fatty acids
    else if (
        fattyAcidNames.some(f => name.includes(f)) ||
        name.includes('fat') && !name.includes('soluble')
    ) {
      nutrient.category = 'Essential Fatty Acids';
      categories['Essential Fatty Acids']?.push(nutrient);
    }
    // Check for other nutrients
    else if (otherNutrientNames.some(n => name.includes(n))) {
      nutrient.category = 'Other Nutrients';
      categories['Other Nutrients']?.push(nutrient);
    }
    // Anything else
    else {
      nutrient.category = 'Other Nutrients';
      categories['Other Nutrients']?.push(nutrient);
    }
  });
  
  // Filter out empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([_, nutrients]) => nutrients.length > 0)
  );
};

// Enhanced function to calculate personalized daily values
const calculatePersonalizedDailyValue = (
  nutrient: MacroNutrient | MicroNutrient, 
  userProfile?: UserProfile
): number => {
  // If no nutrient is provided or it's invalid, return 0
  if (!nutrient || typeof nutrient !== 'object') {
    return 0;
  }
  
  // If nutrient has no amount, or it's not a valid number, return 0 or the existing percentDailyValue if it exists
  if (nutrient.amount === undefined || nutrient.amount === null || isNaN(nutrient.amount)) {
    return nutrient.percentDailyValue || 0;
  }
  
  // If no user profile or nutrient already has a percentDailyValue, return it
  if (!userProfile || !nutrient.amount) {
    return nutrient.percentDailyValue || 0;
  }
  
  const name = nutrient.name?.toLowerCase() || '';
  const { gender, age, weight, height, goal, activityLevel } = userProfile;
  
  // Define comprehensive reference values for various demographics
  // These are based on recent dietary guidelines
  const baseValues: Record<string, number> = {
    // Macronutrients
    'protein': 50, // g
    'carbohydrates': 275, // g
    'carbohydrate': 275, // g
    'fat': 78, // g
    'dietary fiber': 28, // g
    'fiber': 28, // g
    'soluble fiber': 7, // g
    'insoluble fiber': 21, // g
    'sugar': 50, // g
    'sugars': 50, // g
    'added sugar': 25, // g
    'cholesterol': 300, // mg
    'sodium': 2300, // mg
    'calories': 2000, // kcal
    
    // Vitamins
    'vitamin a': 900, // mcg RAE
    'vitamin c': 90, // mg
    'vitamin d': 20, // mcg
    'vitamin e': 15, // mg
    'vitamin k': 120, // mcg
    'vitamin b1': 1.2, // mg (thiamine)
    'thiamine': 1.2, // mg
    'vitamin b2': 1.3, // mg (riboflavin)
    'riboflavin': 1.3, // mg
    'vitamin b3': 16, // mg (niacin)
    'niacin': 16, // mg
    'vitamin b5': 5, // mg (pantothenic acid)
    'pantothenic acid': 5, // mg
    'vitamin b6': 1.7, // mg
    'vitamin b7': 30, // mcg (biotin)
    'biotin': 30, // mcg
    'vitamin b9': 400, // mcg (folate)
    'folate': 400, // mcg
    'folic acid': 400, // mcg
    'vitamin b12': 2.4, // mcg
    'cobalamin': 2.4, // mcg
    'choline': 550, // mg
    
    // Minerals
    'calcium': 1000, // mg
    'iron': 18, // mg
    'magnesium': 420, // mg
    'zinc': 11, // mg
    'potassium': 3500, // mg
    'phosphorus': 700, // mg
    'iodine': 150, // mcg
    'selenium': 55, // mcg
    'copper': 0.9, // mg
    'manganese': 2.3, // mg
    'chromium': 35, // mcg
    'molybdenum': 45, // mcg
    'chloride': 2300, // mg
    
    // Antioxidants
    'beta-carotene': 6, // mg
    'lycopene': 10, // mg
    'lutein': 10, // mg
    'zeaxanthin': 2, // mg
    
    // Essential Fatty Acids
    'omega-3': 1.6, // g
    'epa': 0.5, // g
    'dha': 0.5, // g
    'alpha-linolenic acid': 1.6, // g
    'omega-6': 17, // g
    'linoleic acid': 17 // g
  };
  
  // Adjust nutritional needs based on gender
  let adjustedValue = baseValues[name] || nutrient.percentDailyValue;
  
  if (gender) {
    if (gender.toLowerCase() === 'female') {
      // Females generally need less of certain nutrients
      const femaleAdjustments: Record<string, number> = {
        'calories': 1800,
        'protein': 46,
        'carbohydrates': 230,
        'carbohydrate': 230,
        'fat': 65,
        'iron': age && age >= 19 && age <= 50 ? 18 : 8, // Women 19-50 need 18mg iron, 8mg after 50
        'calcium': age && age >= 51 ? 1200 : 1000, // Women 51+ need 1200mg calcium
        'zinc': 8,
        'vitamin a': 700,
        'vitamin c': 75,
        'vitamin b1': 1.1,
        'thiamine': 1.1,
        'vitamin b2': 1.1,
        'riboflavin': 1.1,
        'vitamin b3': 14,
        'niacin': 14,
        'vitamin b6': 1.5,
        'choline': 425
      };
      
      if (femaleAdjustments[name]) {
        adjustedValue = femaleAdjustments[name];
      }
    } else if (gender.toLowerCase() === 'male') {
      // Males generally need more of certain nutrients
      const maleAdjustments: Record<string, number> = {
        'calories': 2200,
        'protein': 56,
        'carbohydrates': 300,
        'carbohydrate': 300,
        'fat': 85,
        'iron': 8,
        'calcium': age && age >= 71 ? 1200 : 1000, // Men 71+ need 1200mg calcium
        'zinc': 11,
        'vitamin a': 900,
        'vitamin c': 90,
        'vitamin b1': 1.2,
        'thiamine': 1.2,
        'vitamin b2': 1.3,
        'riboflavin': 1.3,
        'vitamin b3': 16,
        'niacin': 16,
        'vitamin b6': 1.7,
        'choline': 550
      };
      
      if (maleAdjustments[name]) {
        adjustedValue = maleAdjustments[name];
      }
    }
  }
  
  // Age-specific adjustments
  if (age) {
    if (age >= 70) {
      // Older adults need more of certain nutrients
      if (name === 'vitamin d') adjustedValue = 25; // Seniors need 25mcg vitamin D
      if (name === 'vitamin b12') adjustedValue = 2.6; // Older adults may need more B12
      if (name === 'calcium') adjustedValue = 1200; // Older adults need 1200mg calcium
    } else if (age >= 50) {
      if (name === 'vitamin b12') adjustedValue = 2.6; // Older adults may need more B12
    } else if (age <= 18) {
      // Adjustments for teenagers
      if (name === 'calcium') adjustedValue = 1300; // Teens need 1300mg calcium
      if (name === 'protein') {
        // Teens need more protein per kg of body weight
        const teenProteinNeeds = gender && gender.toLowerCase() === 'female' ? 46 : 52;
        adjustedValue = teenProteinNeeds;
      }
    }
  }
  
  // Activity level adjustments
  if (activityLevel) {
    const activityMultipliers: Record<string, number> = {
      'sedentary': 1.0,
      'light': 1.2,
      'moderate': 1.4,
      'active': 1.6,
      'very active': 1.8,
      'athlete': 2.0
    };
    
    const activityKey = Object.keys(activityMultipliers).find(
      level => activityLevel.toLowerCase().includes(level)
    );
    
    if (activityKey) {
      const multiplier = activityMultipliers[activityKey];
      
      // Apply activity multiplier to key nutrients
      if (
        multiplier &&
        ['protein', 'calories', 'carbohydrates', 'carbohydrate',
         'vitamin b complex', 'potassium', 'magnesium', 'iron'].some(n => name.includes(n))
      ) {
        adjustedValue *= multiplier || 1;
      }
    }
  }
  
  // Goal-specific adjustments
  if (goal) {
    if (name === 'protein' || name.includes('protein')) {
      let proteinMultiplier = 0.8; // Default is 0.8g per kg for general health
      
      if (goal.toLowerCase().includes('muscle') || goal.toLowerCase().includes('strength')) {
        proteinMultiplier = 1.6; // Higher protein for muscle gain (1.6g per kg)
      } else if (goal.toLowerCase().includes('weight loss')) {
        proteinMultiplier = 1.2; // Slightly higher protein for weight loss to preserve muscle
      } else if (goal.toLowerCase().includes('endurance') || goal.toLowerCase().includes('athlete')) {
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
    
    // Other goal-specific adjustments
    if (goal.toLowerCase().includes('weight loss')) {
      if (name === 'calories') adjustedValue *= 0.8; // 20% calorie deficit
      if (name === 'carbohydrates' || name === 'carbohydrate') adjustedValue *= 0.8;
      if (name === 'sugar' || name === 'sugars') adjustedValue *= 0.5;
    } else if (goal.toLowerCase().includes('muscle') || goal.toLowerCase().includes('strength')) {
      if (name === 'calories') adjustedValue *= 1.2; // 20% calorie surplus
      if (name === 'carbohydrates' || name === 'carbohydrate') adjustedValue *= 1.3;
    } else if (goal.toLowerCase().includes('heart') || goal.toLowerCase().includes('cardiac')) {
      if (name === 'sodium') adjustedValue = 1500; // Lower sodium for heart health
      if (name === 'saturated fat') adjustedValue *= 0.7;
      if (name === 'fiber' || name === 'dietary fiber') adjustedValue *= 1.2;
      if (name === 'omega-3' || name === 'epa' || name === 'dha') adjustedValue *= 1.5;
    }
  }
  
  // Calculate the personalized daily value percentage
  return Math.round((nutrient.amount / adjustedValue) * 100);
};

const NutritionAnalysis: React.FC<NutritionAnalysisProps> = ({ 
  data,
  showType = 'all',
  withUserProfile = false,
  userProfile
}) => {
  const [activeTab, setActiveTab] = useState<'macros' | 'micros'>('macros');
  const [profileData, setProfileData] = useState<UserProfile | undefined>(userProfile);
  const [categorizedMicros, setCategorizedMicros] = useState<Record<string, MicroNutrient[]>>({});
  const { user } = useAuth();
  
  // Get user profile data from auth context if withUserProfile is true
  useEffect(() => {
    if (withUserProfile && user && !userProfile) {
      // Extract user profile data from metadata
      const metadata = user.user_metadata || {};
      
      setProfileData({
        age: metadata.age,
        gender: metadata.gender,
        weight: metadata.weight,
        height: metadata.height,
        goal: metadata.health_goal,
        activityLevel: metadata.activity_level
      });
    }
  }, [withUserProfile, user, userProfile]);
  
  // Categorize micronutrients when data changes
  useEffect(() => {
    if (data && data.micronutrients && Array.isArray(data.micronutrients)) {
      const categorized = categorizeMicronutrients(data.micronutrients);
      setCategorizedMicros(categorized);
    } else {
      // Reset to empty if no valid data
      setCategorizedMicros({});
    }
  }, [data]);
  
  const renderNutrientBar = (nutrient: MacroNutrient | MicroNutrient) => {
    // Calculate percentage for bar width
    const percentage = Math.min(nutrient.percentDailyValue || 0, 100);
    // Determine color based on percentage range
    let barColor = 'bg-cyan-500'; // Default cyan
    
    if (percentage <= 10) {
      barColor = 'bg-red-500'; // Low level - red
    } else if (percentage <= 30) {
      barColor = 'bg-orange-400'; // Moderate level - orange
    } else if (percentage <= 70) {
      barColor = 'bg-emerald-500'; // Good level - green
    } else if (percentage > 90) {
      barColor = 'bg-violet-500'; // Very high level - violet
    }
    
    // Add 10% to the bar width to make small percentages still visible
    const displayWidth = Math.max(percentage, 5);
    
    return (
      <div className="mb-4" key={nutrient.name}>
        <div className="flex justify-between mb-1 items-center">
          <div className="font-medium text-blue-100">
            {nutrient.name} {nutrient.amount && (
              <span className="text-sm font-normal text-blue-100/70">
                {nutrient.amount}{nutrient.unit}
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-blue-100/70">
            {nutrient.percentDailyValue}% DV
          </div>
        </div>
        <div className="w-full bg-darkBlue-accent/20 rounded-full h-2">
          <div 
            className={`${barColor} h-2 rounded-full transition-all duration-500`} 
            style={{ width: `${displayWidth}%` }}
          ></div>
        </div>
        {nutrient.description && (
          <div className="mt-1 text-xs text-blue-100/70 italic">
            {nutrient.description}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div>
      {/* Tabs for Macros and Micros */}
      {showType === 'all' && (
        <div className="flex mb-5 border-b border-darkBlue-accent/30">
          <button
            onClick={() => setActiveTab('macros')}
            className={`px-4 py-2 font-medium text-sm relative ${
              activeTab === 'macros' 
                ? 'text-cyan-accent' 
                : 'text-blue-100/70 hover:text-blue-100'
            }`}
          >
            Macronutrients
            {activeTab === 'macros' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-accent"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('micros')}
            className={`px-4 py-2 font-medium text-sm relative ${
              activeTab === 'micros' 
                ? 'text-cyan-accent' 
                : 'text-blue-100/70 hover:text-blue-100'
            }`}
          >
            Vitamins & Minerals
            {activeTab === 'micros' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-accent"></span>
            )}
          </button>
        </div>
      )}
      
      {/* Macronutrients Section */}
      {(showType === 'macros' || showType === 'all') && (
        <div className="mb-6">
          <h3 className="text-lg text-cyan-accent font-semibold mb-2">Macronutrients</h3>
          <div className="bg-darkBlue-secondary rounded-lg p-4">
            {data.macronutrients && data.macronutrients.length > 0 ? (
              safeMap(data.macronutrients, nutrient => renderNutrientBar(nutrient))
            ) : (
              <p className="text-blue-100/70 text-sm">No macronutrient data available.</p>
            )}
          </div>
        </div>
      )}
      
      {/* Micronutrients Section */}
      {(showType === 'micros' || showType === 'all') && activeTab === 'micros' && (
        <div className="mb-6">
          <h3 className="text-lg text-cyan-accent font-semibold mb-2">Vitamins & Minerals</h3>
          <div className="space-y-6">
            {Object.entries(categorizedMicros).length > 0 ? (
              Object.entries(categorizedMicros).map(([category, nutrients]) => (
                <div key={category} className="bg-darkBlue-secondary rounded-lg p-4">
                  <h4 className="text-cyan-accent mb-3">{category}</h4>
                  <div className="space-y-3">
                    {safeMap(nutrients, nutrient => renderNutrientBar(nutrient))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-darkBlue-secondary rounded-lg p-4">
                <p className="text-blue-100/70 text-sm">No micronutrient data available.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Show info about personalization */}
      {withUserProfile && profileData && (
        <div className="mt-4 p-3 bg-darkBlue-accent/20 rounded-md">
          <p className="text-xs text-blue-100/80">
            <span className="font-medium">Personalized Analysis:</span> Daily values are adjusted based on your{' '}
            {profileData.age ? `age (${profileData.age}), ` : ''}
            {profileData.gender ? `gender (${profileData.gender}), ` : ''}
            {profileData.weight ? `weight (${profileData.weight}lbs), ` : ''}
            {profileData.height ? `height (${profileData.height}"), ` : ''}
            {profileData.goal ? `goal (${profileData.goal}), ` : ''}
            {profileData.activityLevel ? `activity level (${profileData.activityLevel})` : ''}
            .
          </p>
        </div>
      )}
    </div>
  );
};

export default NutritionAnalysis;