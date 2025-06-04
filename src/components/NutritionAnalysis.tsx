'use client';

import React, { useState, useEffect } from 'react';
import { FaAppleAlt, FaCarrot, FaChartPie, FaLightbulb, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { BiInfoCircle } from 'react-icons/bi';
import { useAuth } from '../context/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { uploadImageToSupabase } from '@/lib/uploadImageToSupabase';

// Enhanced nutrition data interface
interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
}

interface IngredientItem {
  name: string;
  amount?: string | number;
  unit?: string;
  quantity?: string;
  calories?: number;
}

interface Benefit {
  benefit?: string;
  explanation?: string;
  title?: string; 
  description?: string;
}

interface Concern {
  concern?: string;
  explanation?: string;
  severity?: 'low' | 'medium' | 'high';
  title?: string;
  description?: string;
}

interface NutritionData {
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  macroNutrients: { [key: string]: Nutrient };
  microNutrients: { [key: string]: Nutrient };
  macronutrients?: Nutrient[];
  micronutrients?: Nutrient[];
  micronutrientsArray?: Nutrient[];
  ingredients?: IngredientItem[];
  benefits?: Benefit[];
  concerns?: Concern[];
  goal?: string;
  image?: string;
  caption?: string;
  recommendations?: string[] | string;
  expertAdvice?: string;
  personalizedHealthInsights?: string;
  metabolicInsights?: string;
  userProfile?: any;
  mealStory?: string;
  nutritionalNarrative?: string;
  healthScore?: number;
  timeOfDayOptimization?: string;
}

interface NutritionAnalysisProps {
  data: NutritionData;
}

// Standard Daily Values (FDA guidelines)
const STANDARD_DAILY_VALUES: { [key: string]: number } = {
  'protein': 50,
  'carbohydrates': 300,
  'carbs': 300,
  'total fat': 65,
  'fat': 65,
  'saturated fat': 20,
  'dietary fiber': 25,
  'fiber': 25,
  'sodium': 2300,
  'total sugars': 50,
  'sugar': 50,
  'calcium': 1300,
  'iron': 18,
  'potassium': 4700,
  'vitamin a': 900,
  'vitamin c': 90,
  'vitamin d': 20
};

// Personalized Daily Values calculation based on user profile
const calculatePersonalizedDV = (nutrientName: string, userProfile?: any): number => {
  if (!userProfile) {
    // Fallback to FDA standards if no profile
    return STANDARD_DAILY_VALUES[nutrientName.toLowerCase()] || 0;
  }

  const weight = userProfile.weight || 150; // lbs
  const age = userProfile.age || 30;
  const gender = userProfile.gender?.toLowerCase() || 'male';
  const activityLevel = userProfile.activityLevel || userProfile.activity_level || 'moderate';
  
  const nutrientKey = nutrientName.toLowerCase();
  
  switch (nutrientKey) {
    case 'protein':
      // Protein: 0.8-1.2g per lb body weight (sedentary to active)
      // Standard recommendations for adults
      let proteinPerLb = 0.8; // Sedentary adults
      if (activityLevel.includes('high') || activityLevel.includes('very active')) {
        proteinPerLb = 1.2; // Very active individuals
      } else if (activityLevel.includes('moderate') || activityLevel.includes('active')) {
        proteinPerLb = 1.0; // Moderately active individuals
      }
      return Math.round(weight * proteinPerLb);
      
    case 'carbohydrates':
    case 'carbs':
      // Carbs: 45-65% of total calories, assuming 2000-2500 cal based on activity
      let totalCals = 2000;
      if (activityLevel.includes('high') || activityLevel.includes('very active')) {
        totalCals = gender === 'male' ? 2500 : 2200;
      } else if (activityLevel.includes('moderate') || activityLevel.includes('active')) {
        totalCals = gender === 'male' ? 2200 : 1900;
      } else {
        totalCals = gender === 'male' ? 1800 : 1600;
      }
      return Math.round((totalCals * 0.55) / 4); // 55% of calories from carbs, 4 cal/g
      
    case 'total fat':
    case 'fat':
      // Fat: 20-35% of total calories
      let fatTotalCals = 2000;
      if (activityLevel.includes('high') || activityLevel.includes('very active')) {
        fatTotalCals = gender === 'male' ? 2500 : 2200;
      } else if (activityLevel.includes('moderate') || activityLevel.includes('active')) {
        fatTotalCals = gender === 'male' ? 2200 : 1900;
      } else {
        fatTotalCals = gender === 'male' ? 1800 : 1600;
      }
      return Math.round((fatTotalCals * 0.30) / 9); // 30% of calories from fat, 9 cal/g
      
    case 'saturated fat':
      // Saturated fat: <10% of total calories
      let satFatTotalCals = 2000;
      if (activityLevel.includes('high') || activityLevel.includes('very active')) {
        satFatTotalCals = gender === 'male' ? 2500 : 2200;
      } else if (activityLevel.includes('moderate') || activityLevel.includes('active')) {
        satFatTotalCals = gender === 'male' ? 2200 : 1900;
      } else {
        satFatTotalCals = gender === 'male' ? 1800 : 1600;
      }
      return Math.round((satFatTotalCals * 0.10) / 9);
      
    case 'dietary fiber':
    case 'fiber':
      // Fiber: 14g per 1000 calories
      let fiberTotalCals = 2000;
      if (activityLevel.includes('high') || activityLevel.includes('very active')) {
        fiberTotalCals = gender === 'male' ? 2500 : 2200;
      } else if (activityLevel.includes('moderate') || activityLevel.includes('active')) {
        fiberTotalCals = gender === 'male' ? 2200 : 1900;
      } else {
        fiberTotalCals = gender === 'male' ? 1800 : 1600;
      }
      return Math.round((fiberTotalCals / 1000) * 14);
      
    case 'sodium':
      // Sodium: 2300mg for most adults, 1500mg for older adults or hypertension risk
      return age > 50 ? 1500 : 2300;
      
    case 'calcium':
      // Calcium: varies by age and gender
      if (age < 19) return 1300;
      if (age < 51) return gender === 'male' ? 1000 : 1000;
      if (age < 71) return gender === 'male' ? 1000 : 1200;
      return gender === 'male' ? 1200 : 1200;
      
    case 'iron':
      // Iron: varies significantly by gender and age
      if (gender === 'female' && age >= 19 && age <= 50) return 18;
      if (gender === 'female' && age > 50) return 8;
      return 8; // Male or post-menopausal female
      
    case 'potassium':
      // Potassium: based on gender
      return gender === 'male' ? 3400 : 2600;
      
    case 'vitamin c':
      // Vitamin C: based on gender and smoking status
      return gender === 'male' ? 90 : 75;
      
    case 'vitamin a':
      // Vitamin A: based on gender
      return gender === 'male' ? 900 : 700;
      
    default:
      // Fallback to FDA standard
      return STANDARD_DAILY_VALUES[nutrientKey] || 0;
  }
};

// Helper function to calculate correct Daily Value percentages with personalization
const getPersonalizedDailyValue = (nutrientName: string, amount: number, userProfile?: any): number => {
  const personalizedDV = calculatePersonalizedDV(nutrientName, userProfile);
  
  if (!personalizedDV || personalizedDV === 0) return 0;
  
  return Math.round((amount / personalizedDV) * 100);
};

// Enhanced nutrient descriptions
const getMacronutrientDescription = (name: string): string => {
  switch (name.toLowerCase()) {
    case 'protein':
      return 'Essential for muscle repair, immune function, and enzyme production. Helps you feel full longer and stabilizes blood sugar levels.';
    case 'carbohydrates':
    case 'carbs':
      return 'Your body\'s primary energy source, especially crucial for brain function and high-intensity activities.';
    case 'total fat':
    case 'fat':
      return 'Critical for hormone production, brain health, and nutrient absorption. Provides long-lasting energy.';
    case 'saturated fat':
      return 'Can raise LDL cholesterol when consumed in excess. Limit intake and focus on unsaturated fats.';
    case 'dietary fiber':
    case 'fiber':
      return 'Promotes digestive health and helps maintain stable blood sugar levels. Feeds beneficial gut bacteria.';
    case 'total sugars':
    case 'sugar':
      return 'Provides quick energy but should be consumed mindfully. Natural sugars from fruits are preferable.';
    case 'sodium':
      return 'Essential for fluid balance and nerve function, but excess can elevate blood pressure.';
    default:
      return 'An important macronutrient that plays a vital role in your overall health.';
  }
};

const getMicronutrientDescription = (name: string): string => {
  switch (name.toLowerCase()) {
    case 'vitamin a':
      return 'Crucial for vision, immune function, and cellular growth. Supports night vision and healthy skin.';
    case 'vitamin c':
      return 'A powerful antioxidant that supports immune health and collagen synthesis. Helps fight infections.';
    case 'vitamin d':
      return 'Essential for bone health and calcium absorption. Often called the "sunshine vitamin".';
    case 'calcium':
      return 'Critical for bone and teeth health, muscle function, and nerve signaling.';
    case 'iron':
      return 'Essential for oxygen transport and energy production. Key component of hemoglobin.';
    case 'potassium':
      return 'Regulates fluid balance, muscle contractions, and blood pressure.';
    case 'magnesium':
      return 'Involved in over 300 enzyme reactions. Often called the "relaxation mineral".';
    case 'zinc':
      return 'Important for immune function, wound healing, and protein synthesis.';
    case 'folate':
    case 'folic acid':
      return 'Crucial for DNA synthesis and cell division. Especially important for pregnant women.';
    case 'vitamin b12':
      return 'Essential for nerve function and red blood cell formation.';
    default:
      return 'An important micronutrient that supports various bodily functions.';
  }
};

// Helper to categorize micronutrients
const categorizeNutrients = (nutrients: any, userProfile?: any) => {
  if (!nutrients) return {};
  
  const categories: { [key: string]: Nutrient[] } = {
    'Vitamins': [],
    'Minerals': []
  };
  
  const getNutrientCategory = (name: string) => {
    const lowerName = name.toLowerCase();
    
    // Vitamins
    if (lowerName.includes('vitamin') || 
        ['thiamine', 'riboflavin', 'niacin', 'folate', 'folic acid', 'biotin', 'pantothenic acid'].some(vitamin => lowerName.includes(vitamin))) {
      return 'Vitamins';
    }
    
    // Minerals (excluding sodium which should be in macronutrients)
    if (['calcium', 'iron', 'potassium', 'magnesium', 'zinc', 'phosphorus', 'manganese', 'copper', 'selenium', 'chromium', 'molybdenum', 'iodine'].some(mineral => lowerName.includes(mineral))) {
      return 'Minerals';
    }
    
    // Default to minerals for other micronutrients (but sodium should not reach here)
    return 'Minerals';
  };
  
  // Handle both object and array formats
  const nutrientList = Array.isArray(nutrients) ? nutrients : Object.values(nutrients);
  
  nutrientList.forEach((nutrient: any) => {
    if (nutrient && nutrient.name) {
      const lowerName = nutrient.name.toLowerCase();
      
      // Skip sodium - it should be in macronutrients
      if (lowerName.includes('sodium')) {
        console.warn('[NutritionAnalysis] Sodium found in micronutrients - this should be in macronutrients');
        return;
      }
      
      const category = getNutrientCategory(nutrient.name);
      // Fix Daily Value calculation
      const correctedDV = getPersonalizedDailyValue(nutrient.name, nutrient.amount, userProfile);
      const nutrientWithCorrectDV = {
        ...nutrient,
        percentDailyValue: correctedDV > 0 ? correctedDV : nutrient.percentDailyValue
      };
      categories[category]?.push(nutrientWithCorrectDV);
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

export default function NutritionAnalysis({ data }: NutritionAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'insights'>('nutrition');

  // Validation and accuracy checks
  React.useEffect(() => {
    // Check for unrealistically low calories
    if (data.calories && data.calories < 300) {
      console.warn('[NutritionAnalysis] ⚠️ Potentially inaccurate: Very low calorie count', data.calories);
    }
    
    // Check for sodium in micronutrients (should be in macronutrients)
    const microNutrientsList = data.micronutrients || data.micronutrientsArray || [];
    const hasSodiumInMicros = Array.isArray(microNutrientsList) 
      ? microNutrientsList.some((n: any) => n.name?.toLowerCase().includes('sodium'))
      : Object.values(microNutrientsList).some((n: any) => n.name?.toLowerCase().includes('sodium'));
    
    if (hasSodiumInMicros) {
      console.warn('[NutritionAnalysis] ⚠️ Accuracy issue: Sodium found in micronutrients - should be in macronutrients');
    }
    
    // Check for non-null percentDailyValue (should all be null)
    const macroList = data.macronutrients || [];
    const microList = Array.isArray(microNutrientsList) ? microNutrientsList : Object.values(microNutrientsList);
    
    const hasNonNullDV = [...macroList, ...microList].some((n: any) => 
      n.percentDailyValue !== null && n.percentDailyValue !== undefined
    );
    
    if (hasNonNullDV) {
      console.warn('[NutritionAnalysis] ⚠️ Accuracy issue: Found non-null percentDailyValue - should all be null for personalized calculation');
    }
    
    // Check for realistic protein content
    if (data.calories && data.calories > 500) {
      const proteinCalories = (data.protein || 0) * 4; // 4 calories per gram of protein
      const proteinPercentage = (proteinCalories / data.calories) * 100;
      
      if (proteinPercentage < 10) {
        console.warn('[NutritionAnalysis] ⚠️ Potentially inaccurate: Very low protein percentage', proteinPercentage.toFixed(1) + '%');
      }
    }
    
    // Log accuracy summary
    console.log('[NutritionAnalysis] Accuracy Check Summary:', {
      calories: data.calories,
      protein: data.protein,
      sodiumInMicros: hasSodiumInMicros,
      hasNonNullDV: hasNonNullDV,
      totalMacros: macroList.length,
      totalMicros: microList.length
    });
  }, [data]);

  // Convert macronutrients array to object format if needed
  const macroNutrients = data.macroNutrients || 
    (data.macronutrients ? 
      data.macronutrients.reduce((acc: any, nutrient: any, index: number) => {
        acc[`macro_${index}`] = nutrient;
        return acc;
      }, {}) : 
      {}
    );

  // Convert micronutrients array to object format if needed  
  const microNutrients = data.microNutrients || 
    (data.micronutrients ? 
      data.micronutrients.reduce((acc: any, nutrient: any, index: number) => {
        acc[`micro_${index}`] = nutrient;
        return acc;
      }, {}) : 
      {}
    );

  const TabButton = ({ tab, label, icon }: { tab: 'nutrition' | 'insights', label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
        activeTab === tab
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 bg-gray-800 text-gray-100 rounded-lg shadow-xl">
      {/* Compact Header */}
      <div className="mb-6">
        {/* Smaller Image */}
        {data.image && (
          <div className="mb-4 rounded-lg overflow-hidden shadow-lg h-32 relative">
            <Image src={data.image} alt={data.caption || 'Meal image'} layout="fill" objectFit="cover" />
          </div>
        )}
        
        {/* Title and Basic Info */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-2">
            {data.caption || 'Meal Analysis'}
          </h1>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-400">
            <span>Goal: {data.goal || 'General Wellness'}</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">{data.calories} calories</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-4 mb-6">
        <TabButton tab="nutrition" label="Nutrition Data" icon={<FaChartPie />} />
        <TabButton tab="insights" label="Health Insights" icon={<FaLightbulb />} />
      </div>

      {/* Tab Content */}
      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          {/* Macronutrients */}
          <Card className="bg-gray-750 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center">
                <FaAppleAlt className="mr-2" />
                Macronutrients
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {macroNutrients && Object.entries(macroNutrients).map(([key, nutrient]) => {
                  const typedNutrient = nutrient as Nutrient;
                  const correctedDV = getPersonalizedDailyValue(typedNutrient.name, typedNutrient.amount, data.userProfile);
                  const displayDV = correctedDV > 0 ? correctedDV : typedNutrient.percentDailyValue;
                  
                  // Debug logging for DV% calculations
                  if (typedNutrient.name.toLowerCase().includes('protein')) {
                    console.log(`[NutritionAnalysis] 🔍 PROTEIN DV% DEBUG:`, {
                      nutrientName: typedNutrient.name,
                      amount: typedNutrient.amount,
                      rawDV: typedNutrient.percentDailyValue,
                      personalizedDV: correctedDV,
                      displayDV: displayDV,
                      userWeight: data.userProfile?.weight,
                      userProfile: data.userProfile
                    });
                  }
                  
                  return (
                    <div key={key} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-indigo-400">{typedNutrient.name}</h4>
                        <p className="text-lg font-bold text-white">{typedNutrient.amount}{typedNutrient.unit}</p>
                      </div>
                      {displayDV !== undefined && displayDV !== null && displayDV > 0 && (
                        <>
                          <div className="w-full bg-gray-600 rounded-full h-2 mb-1">
                            <div
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(displayDV, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-right text-xs text-gray-400 mb-2">{displayDV}% DV</p>
                        </>
                      )}
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {typedNutrient.description || getMacronutrientDescription(typedNutrient.name)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Micronutrients */}
          <Card className="bg-gray-750 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center">
                <FaCarrot className="mr-2" />
                Micronutrients
              </h3>
              {(microNutrients && Object.keys(microNutrients).length > 0) || (data.micronutrientsArray && data.micronutrientsArray.length > 0) ? (
                Object.entries(categorizeNutrients(microNutrients || data.micronutrientsArray, data.userProfile)).map(([category, nutrientsInCategory]) => (
                  <div key={category} className="mb-4">
                    <h4 className="text-md font-semibold text-cyan-400 mb-3 border-b border-gray-600 pb-1">{category}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(nutrientsInCategory as Nutrient[]).map((nutrient, index) => {
                        // Calculate personalized DV% for micronutrients too
                        const personalizedDV = getPersonalizedDailyValue(nutrient.name, nutrient.amount, data.userProfile);
                        const displayDV = personalizedDV > 0 ? personalizedDV : nutrient.percentDailyValue;
                        
                        return (
                          <div key={nutrient.name || index} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                            <div className="flex justify-between items-baseline mb-2">
                              <h5 className="font-medium text-cyan-400 text-sm">{nutrient.name}</h5>
                              <p className="text-sm font-semibold text-white">{nutrient.amount}{nutrient.unit}</p>
                            </div>
                            {displayDV !== undefined && displayDV !== null && displayDV > 0 && (
                              <>
                                <div className="w-full bg-gray-600 rounded-full h-2 mb-1">
                                  <div
                                    className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(displayDV, 100)}%` }}
                                  ></div>
                                </div>
                                <p className="text-right text-xs text-gray-400 mb-2">{displayDV}% DV</p>
                              </>
                            )}
                            <p className="text-xs text-gray-300 leading-relaxed">
                              {nutrient.description || getMicronutrientDescription(nutrient.name)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No detailed micronutrient data available for this meal.</p>
              )}
            </CardContent>
          </Card>

          {/* Key Ingredients */}
          {data.ingredients && data.ingredients.length > 0 && (
            <Card className="bg-gray-750 border-gray-700">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-indigo-400 mb-3 flex items-center">
                  <BiInfoCircle className="mr-2" />
                  Key Ingredients
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {data.ingredients.slice(0, 8).map((ingredient, index) => (
                    <div key={index} className="bg-gray-700 px-3 py-2 rounded-md text-sm text-gray-300 text-center">
                      {typeof ingredient === 'string' ? ingredient : ingredient.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Health Score & Quick Summary */}
          {data.healthScore && (
            <Card className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-indigo-300">Health Score</h3>
                  <div className="flex items-center space-x-2">
                    <div className="text-4xl font-bold text-white">{data.healthScore}</div>
                    <div className="text-lg text-indigo-300">/10</div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(data.healthScore / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-300">
                  {data.healthScore >= 8 ? "Excellent nutritional choice! 🌟" : 
                   data.healthScore >= 6 ? "Good meal with room for improvement 👍" :
                   data.healthScore >= 4 ? "Moderate choice - consider some tweaks ⚖️" :
                   "This meal could use some nutritional optimization 🔧"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Meal Story - The Journey */}
          {data.mealStory && (
            <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-emerald-300 mb-4 flex items-center">
                  🌟 Your Nutritional Journey
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-emerald-100 leading-relaxed text-base whitespace-pre-line">
                    {data.mealStory}
                  </p>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Nutritional Narrative - The Good, Bad, Actionable */}
          {data.nutritionalNarrative && (
            <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center">
                  📖 Your Meal's Story
                </h3>
                <div className="prose prose-invert max-w-none">
                  <div className="text-amber-100 leading-relaxed text-base whitespace-pre-line">
                    {data.nutritionalNarrative}
                      </div>
                    </div>
              </CardContent>
            </Card>
          )}
          
          {/* Timing Optimization */}
          {data.timeOfDayOptimization && (
            <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30">
                  <CardContent className="p-6">
                <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                  ⏰ Optimal Timing Strategy
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-blue-100 leading-relaxed text-base whitespace-pre-line">
                    {data.timeOfDayOptimization}
                  </p>
                </div>
                  </CardContent>
                </Card>
          )}

          {/* Health Benefits */}
          {data.benefits && data.benefits.length > 0 && (
            <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center">
                  ✅ Health Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.benefits.map((benefit, index) => (
                    <div key={index} className="bg-green-900/30 border border-green-500/40 p-4 rounded-lg">
                      <p className="text-green-200 text-sm leading-relaxed">
                        {typeof benefit === 'string' ? benefit : benefit.benefit || benefit.title || benefit.description}
                      </p>
                      </div>
                    ))}
                </div>
                  </CardContent>
                </Card>
          )}

          {/* Nutritional Considerations */}
          {data.concerns && data.concerns.length > 0 && (
            <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center">
                  ⚠️ Things to Consider
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.concerns.map((concern, index) => (
                    <div key={index} className="bg-yellow-900/30 border border-yellow-500/40 p-4 rounded-lg">
                      <p className="text-yellow-200 text-sm leading-relaxed">
                        {typeof concern === 'string' ? concern : concern.concern || concern.title || concern.description}
                      </p>
                      </div>
                    ))}
                </div>
                  </CardContent>
                </Card>
          )}

          {/* Personalized Health Insights */}
          {data.personalizedHealthInsights && (
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center">
                  🎯 Personalized Analysis
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-purple-100 leading-relaxed text-base whitespace-pre-line">
                    {data.personalizedHealthInsights}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expert Recommendations */}
          {data.recommendations && (
            <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                  🧠 Expert Recommendations
                </h3>
                <div className="bg-blue-900/30 border border-blue-500/40 p-4 rounded-lg">
                  {Array.isArray(data.recommendations) ? (
                    <ul className="space-y-3">
                      {data.recommendations.map((rec, index) => (
                        <li key={index} className="text-blue-200 text-sm flex items-start leading-relaxed">
                          <span className="text-blue-400 mr-3 mt-1">💡</span>
                          {rec}
                        </li>
                      ))}
                        </ul>
                  ) : (
                    <p className="text-blue-200 text-sm leading-relaxed">{data.recommendations}</p>
                  )}
                      </div>
                  </CardContent>
                </Card>
          )}

          {/* Metabolic Insights */}
          {data.metabolicInsights && (
            <Card className="bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-red-300 mb-4 flex items-center">
                  🔥 Metabolic Impact
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-red-100 leading-relaxed text-base whitespace-pre-line">
                    {data.metabolicInsights}
                  </p>
                      </div>
                  </CardContent>
                </Card>
          )}
        </div>
      )}
    </div>
  );
} 