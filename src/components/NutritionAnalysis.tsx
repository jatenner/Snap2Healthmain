'use client';

import React, { useState, useEffect } from 'react';
import { FaAppleAlt, FaCarrot, FaChevronDown, FaChevronUp, FaLeaf, FaShieldAlt, FaCheckCircle, FaUtensils, FaExchangeAlt, FaPlusCircle, FaUserMd, FaBookOpen, FaBolt, FaUser } from 'react-icons/fa';
import { BiInfoCircle } from 'react-icons/bi';
import MacroDistributionChart from './MacroDistributionChart';
import { GiMolecule, GiCookingPot } from 'react-icons/gi';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import UserProfileSummary from './UserProfileSummary';
import { useAuth } from '@/context/auth';

// Enhanced nutrition data interface to support the expanded API response
interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
  benefits?: string;
}

interface IngredientItem {
  name: string;
  amount?: string | number;
  unit?: string;
  benefits?: string;
  concerns?: string;
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

interface Phytonutrient {
  name: string;
  amount: number | string;
  unit: string;
  benefits: string[];
}

interface RecoveryInsight {
  title: string;
  description: string;
  timeframe?: string;
  impactRating?: 'low' | 'moderate' | 'high';
  keyFindings?: string[];
  researchNotes?: string[];
  citations?: string[];
}

interface Hydration {
  level: number;
  waterContent: number;
  unit: string;
  tips: string[];
}

interface GlycemicLoad {
  value: number;
  index?: number;
  carbs: number;
  unit: string;
  foodTypes: string[];
  impact: string;
}

interface NutritionData {
  calories: number;
  macroNutrients: { [key: string]: Nutrient };
  microNutrients: { [key: string]: Nutrient };
  micronutrients?: { [key: string]: Nutrient };
  ingredients?: IngredientItem[];
  benefits?: Benefit[];
  concerns?: Concern[];
  phytonutrients?: Phytonutrient[];
  recoveryInsights?: RecoveryInsight[];
  hydration?: Hydration;
  glycemicLoad?: GlycemicLoad;
  goal?: string;
  goalDescription?: string;
  intolerances?: string[];
  allergies?: string[];
  image?: string;
  caption?: string;
  recommendations?: any;
  alternatives?: any;
  expertAdvice?: string;
  researchInsight?: string;
}

interface NutritionAnalysisProps {
  data: NutritionData;
  showType?: 'all' | 'macros' | 'micros';
  withUserProfile?: boolean;
}

// Helper functions to provide descriptions for nutrients
const getMacronutrientDescription = (name: string): string => {
  switch (name.toLowerCase()) {
    case 'protein':
      return 'Essential for muscle repair, immune function, and enzyme production.';
    case 'carbohydrates':
    case 'carbs':
      return 'Primary energy source for the body, especially during high-intensity activities.';
    case 'fat':
      return 'Important for hormone production, brain health, and nutrient absorption.';
    case 'fiber':
      return 'Promotes digestive health and helps maintain stable blood sugar levels.';
    case 'sugar':
      return 'Provides quick energy but should be limited for optimal health.';
    case 'sodium':
      return 'Essential for fluid balance and nerve function, but excess can affect blood pressure.';
    default:
      return '';
  }
};

// Modify this function to provide more contextual micronutrient descriptions
const getMicronutrientDescription = (name: string, amount: number, percentDailyValue?: number): string => {
  const isHighAmount = percentDailyValue && percentDailyValue > 50;
  const isModerateAmount = percentDailyValue && percentDailyValue > 20 && percentDailyValue <= 50;
  const isLowAmount = percentDailyValue && percentDailyValue <= 20;
  
  let baseDescription = '';
  let contextualAdvice = '';
  
  // Base description
  switch (name.toLowerCase()) {
    case 'vitamin a':
      baseDescription = 'Important for vision, immune function, and cell growth';
      break;
    case 'vitamin c':
      baseDescription = 'Supports immune health, collagen production, and acts as an antioxidant';
      break;
    case 'vitamin d':
      baseDescription = 'Essential for bone health, immune function, and calcium absorption';
      break;
    case 'vitamin e':
      baseDescription = 'Powerful antioxidant that protects cells from damage';
      break;
    case 'vitamin k':
      baseDescription = 'Necessary for blood clotting and bone health';
      break;
    case 'calcium':
      baseDescription = 'Critical for bone health, muscle function, and nerve signaling';
      break;
    case 'iron':
      baseDescription = 'Essential for oxygen transport in the blood and energy production';
      break;
    case 'potassium':
      baseDescription = 'Regulates fluid balance, muscle contractions, and nerve signals';
      break;
    case 'magnesium':
      baseDescription = 'Involved in over 300 enzyme reactions, including energy creation';
      break;
    case 'zinc':
      baseDescription = 'Important for immune function, wound healing, and DNA synthesis';
      break;
    case 'sodium':
      baseDescription = 'Essential for fluid balance and nerve/muscle function';
      break;
    case 'folate':
    case 'folic acid':
      baseDescription = 'Important for cell division and preventing certain birth defects';
      break;
    case 'vitamin b12':
      baseDescription = 'Essential for nerve function, brain health, and red blood cell formation';
      break;
    default:
      baseDescription = 'Important nutrient for overall health and wellbeing';
  }
  
  // Add contextual advice based on amount
  if (isHighAmount) {
    if (name.toLowerCase() === 'sodium') {
      contextualAdvice = ' — This is a high amount, which may contribute to high blood pressure for some people';
    } else if (name.toLowerCase() === 'sugar') {
      contextualAdvice = ' — This is a high amount, which may contribute to blood sugar spikes';
    } else {
      contextualAdvice = ' — This meal provides an excellent source of this nutrient';
    }
  } else if (isModerateAmount) {
    contextualAdvice = ' — This meal provides a good amount of this nutrient';
  } else if (isLowAmount) {
    contextualAdvice = ' — Consider additional sources of this nutrient in other meals';
  }
  
  return baseDescription + contextualAdvice;
};

// Add this function before the NutritionAnalysis component
const getMacroNutrientPercentages = (data: NutritionData) => {
  const totalCalories = 
    (data.macroNutrients.carbohydrates.amount * 4) + 
    (data.macroNutrients.protein.amount * 4) + 
    (data.macroNutrients.fat.amount * 9);
  
  return {
    carbs: Math.round((data.macroNutrients.carbohydrates.amount * 4 / totalCalories) * 100),
    protein: Math.round((data.macroNutrients.protein.amount * 4 / totalCalories) * 100),
    fat: Math.round((data.macroNutrients.fat.amount * 9 / totalCalories) * 100)
  };
};

// Add this function if it doesn't exist
const getGoalSpecificAdvice = (data: NutritionData): string => {
  const { goal } = data;
  
  if (!goal) return "";
  
  if (goal.toLowerCase().includes('weight loss')) {
    return "Focus on protein-rich foods and fiber to support satiety.";
  }
  
  if (goal.toLowerCase().includes('muscle') || goal.toLowerCase().includes('strength')) {
    return "Prioritize protein intake and consider nutrient timing around your workouts.";
  }
  
  if (goal.toLowerCase().includes('running') || goal.toLowerCase().includes('endurance')) {
    return "Complex carbohydrates are essential for glycogen replenishment and sustained energy during endurance activities.";
  }
  
  return `Consistent nutrition that aligns with your ${goal} is key to achieving optimal results.`;
};

// Helper function to categorize nutrients
const categorizeNutrients = (nutrients: any) => {
  const categories: Record<string, any[]> = {
    'Vitamins': [],
    'Minerals': [],
    'Other': []
  };
  
  // Determine the nutrient type based on name
  const getNutrientCategory = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('vitamin') || 
        ['a', 'b', 'c', 'd', 'e', 'k'].some(v => lowerName === v || lowerName === `vitamin ${v}`)) {
      return 'Vitamins';
    } else if (['calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 
               'sodium', 'zinc', 'copper', 'manganese', 'selenium', 
               'iodine'].some(m => lowerName.includes(m))) {
      return 'Minerals';
    } else {
      return 'Other';
    }
  };
  
  // Categorize nutrients based on structure
  if (Array.isArray(nutrients)) {
    nutrients.forEach((nutrient: any) => {
      const name = nutrient.name || 'Unknown';
      const category = getNutrientCategory(name);
      categories[category].push(nutrient);
    });
  } else if (nutrients && typeof nutrients === 'object') {
    Object.entries(nutrients).forEach(([key, nutrientValue]: [string, any]) => {
      const name = nutrientValue.name || key;
      const category = getNutrientCategory(name);
      categories[category].push({...nutrientValue, key});
    });
  }
  
  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([_, items]) => items.length > 0)
  );
};

export default function NutritionAnalysis({ data, showType = 'all', withUserProfile = false }: NutritionAnalysisProps) {
  const { user } = useAuth();
  const hasProfileData = user?.user_metadata?.height || user?.user_metadata?.weight || user?.user_metadata?.age;
  
  const protein = data.macroNutrients?.protein?.amount || 0;
  const carbs = data.macroNutrients?.carbohydrates?.amount || 0;
  const fat = data.macroNutrients?.fat?.amount || 0;
  const fiber = data.macroNutrients?.fiber?.amount || 0;
  const sugar = data.macroNutrients?.sugar?.amount || 0;
  const sodium = data.macroNutrients?.sodium?.amount || 0;

  // Calculate macro percentages for display
  const totalMacros = protein + carbs + fat;
  const proteinPercent = totalMacros > 0 ? Math.round((protein / totalMacros) * 100) : 33;
  const carbsPercent = totalMacros > 0 ? Math.round((carbs / totalMacros) * 100) : 33;
  const fatPercent = totalMacros > 0 ? Math.round((fat / totalMacros) * 100) : 34;

  const [expandedSections, setExpandedSections] = useState({
    macronutrients: true,
    micronutrients: true,
    healthBenefits: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section as keyof typeof expandedSections]
    });
  };

  const isSectionEmpty = (section: string) => {
    switch (section) {
      case 'micronutrients':
        // Check if either micronutrient property exists and has data
        const microData = data.microNutrients || data.micronutrients || {};
        return Object.keys(microData).length === 0;
      default:
        return false;
    }
  };

  const SectionHeader = ({ title, expanded, onToggle, icon }: { title: string, expanded: boolean, onToggle: () => void, icon?: React.ReactNode }) => (
    <div 
      className="flex items-center justify-between cursor-pointer p-3 rounded-lg mb-3 bg-darkBlue-accent/20 text-cyan-accent border border-darkBlue-accent/30"
      onClick={onToggle}
    >
      <div className="flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <span>
        {expanded ? <FaChevronUp /> : <FaChevronDown />}
      </span>
    </div>
  );

  // Add a new section for personalized insights
  const [expandedUserProfile, setExpandedUserProfile] = useState(true);
  
  // Calculate if meal is within daily calorie budget
  const getMealCalorieContext = () => {
    if (!user?.user_metadata) return null;
    
    const { height, weight, age, gender } = user.user_metadata;
    
    if (!height || !weight || !age || !gender) return null;
    
    // Simple calculation of daily calories
    const heightInches = parseFloat(height as string);
    const weightLbs = parseFloat(weight as string);
    const ageYears = parseFloat(age as string);
    
    if (isNaN(heightInches) || isNaN(weightLbs) || isNaN(ageYears)) {
      return null;
    }
    
    // Convert to metric
    const heightCm = heightInches * 2.54;
    const weightKg = weightLbs / 2.20462;
    
    // Base metabolic rate calculation
    let bmr;
    if ((gender as string).toLowerCase() === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }
    
    // Moderate activity level (factor of 1.55)
    const dailyCalories = Math.round(bmr * 1.55);
    
    // Calculate meal percentage of daily calories
    const mealCalories = data.calories || 0;
    const percentOfDaily = Math.round((mealCalories / dailyCalories) * 100);
    
    return {
      dailyCalories,
      mealCalories,
      percentOfDaily,
      isHighCalorie: percentOfDaily > 40,
      isLowCalorie: percentOfDaily < 15,
      isModerateCalorie: percentOfDaily >= 15 && percentOfDaily <= 40
    };
  };
  
  const calorieContext = getMealCalorieContext();
  
  // Get protein requirements based on user weight
  const getProteinContext = () => {
    if (!user?.user_metadata?.weight) return null;
    
    const weightLbs = parseFloat(user.user_metadata.weight as string);
    if (isNaN(weightLbs)) return null;
    
    const weightKg = weightLbs / 2.20462;
    
    // General recommendation: 0.8g per kg for general population, 
    // 1.6-2.2g per kg for active individuals
    const minProtein = Math.round(weightKg * 0.8);
    const maxProtein = Math.round(weightKg * 2.2);
    
    const mealProtein = data.macroNutrients?.protein?.amount || 0;
    const percentOfMinDaily = Math.round((mealProtein / minProtein) * 100);
    
    return {
      minDailyProtein: minProtein,
      maxDailyProtein: maxProtein,
      mealProtein,
      percentOfMinDaily,
      isHighProtein: percentOfMinDaily > 50,
      isLowProtein: percentOfMinDaily < 15,
      isModerateProtein: percentOfMinDaily >= 15 && percentOfMinDaily <= 50
    };
  };
  
  const proteinContext = getProteinContext();

  return (
    <div className="space-y-6 text-blue-100">
      {/* If withUserProfile is true and we have profile data, show the profile summary */}
      {withUserProfile && hasProfileData && (
        <div className="mb-6">
          <SectionHeader 
            title="Your Health Profile" 
            expanded={expandedUserProfile} 
            onToggle={() => setExpandedUserProfile(!expandedUserProfile)}
            icon={<FaUser />}
          />
          
          {expandedUserProfile && (
            <div className="mt-2">
              <UserProfileSummary compact showTitle={false} />
              
              {calorieContext && (
                <div className="mt-4 bg-darkBlue-secondary/40 border border-darkBlue-accent/20 rounded-lg p-4">
                  <h4 className="text-cyan-accent font-medium mb-2">Personalized Nutrition Insights</h4>
                  
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span>Meal calories</span>
                      <span className="font-medium">{calorieContext.mealCalories} cal</span>
                    </div>
                    <div className="w-full bg-darkBlue-accent/20 h-2 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          calorieContext.isHighCalorie ? 'bg-yellow-400' : 
                          calorieContext.isLowCalorie ? 'bg-blue-400' : 
                          'bg-green-400'
                        }`} 
                        style={{ width: `${Math.min(calorieContext.percentOfDaily, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-sm text-blue-100/70">
                      This meal provides <span className="font-medium">{calorieContext.percentOfDaily}%</span> of your estimated daily calorie needs ({calorieContext.dailyCalories} cal)
                    </p>
                  </div>
                  
                  {proteinContext && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Protein content</span>
                        <span className="font-medium">{proteinContext.mealProtein}g</span>
                      </div>
                      <div className="w-full bg-darkBlue-accent/20 h-2 rounded-full">
                        <div 
                          className="h-2 rounded-full bg-blue-400" 
                          style={{ width: `${Math.min(proteinContext.percentOfMinDaily, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-blue-100/70">
                        Provides <span className="font-medium">{proteinContext.percentOfMinDaily}%</span> of your minimum daily protein needs ({proteinContext.minDailyProtein}-{proteinContext.maxDailyProtein}g)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Simple Header with Meal Description, Goal, and Calories */}
      <div className="w-full p-6 md:p-8 bg-darkBlue-secondary/60 rounded-lg border border-darkBlue-accent/40">
        <div className="flex flex-col items-center text-center mb-4">
          {data.caption && (
            <h2 className="text-2xl font-bold text-white mb-2">
              {data.caption.includes('orange') ? 'Oranges' : data.caption.split(' - ')[0].split('with')[0].trim()}
            </h2>
          )}
          
          {data.goal && (
            <h3 className="text-lg font-medium text-cyan-accent mb-3">
              Goal: {data.goal}
            </h3>
          )}
          
          <div className="text-3xl font-bold text-white">
            {data.calories || 0} calories
          </div>
        </div>
      </div>

      {/* Macro Distribution Chart */}
      <div className="bg-darkBlue-secondary/40 border border-darkBlue-accent/20 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-cyan-accent/90 mb-3">Macronutrient Distribution</h4>
        <div className="h-14">
          <MacroDistributionChart protein={protein} carbs={carbs} fat={fat} />
        </div>
        <p className="mt-3 text-blue-100/90">
          This meal contains approximately <span className="text-cyan-accent font-bold">{data.calories} calories</span> with 
          a macronutrient distribution of <span className="text-blue-400">{proteinPercent}% protein</span>, <span 
          className="text-green-400">{carbsPercent}% carbohydrates</span>, and <span 
          className="text-yellow-400">{fatPercent}% fat</span>.
        </p>
      </div>

      {/* Detailed Macronutrients Section */}
      <div className="mb-8">
        <SectionHeader 
          title="Macronutrients" 
          expanded={expandedSections.macronutrients} 
          onToggle={() => toggleSection('macronutrients')}
          icon={<FaAppleAlt />}
        />
        
        {expandedSections.macronutrients && (
          <div className="bg-darkBlue-secondary/40 border border-darkBlue-accent/20 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Protein */}
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-blue-100">Protein</span>
                  <div>
                    <span className="text-xl font-bold text-blue-400">{protein} </span>
                    <span className="text-blue-100/70">g</span>
                  </div>
                </div>
                <div className="w-full bg-blue-900/30 h-2 rounded-full mb-1">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${Math.min(protein * 2, 100)}%` }}></div>
                </div>
                <p className="text-sm text-blue-100/70">Essential for muscle repair and growth</p>
              </div>
              
              {/* Carbohydrates */}
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-blue-100">Carbohydrates</span>
                  <div>
                    <span className="text-xl font-bold text-green-400">{carbs} </span>
                    <span className="text-blue-100/70">g</span>
                  </div>
                </div>
                <div className="w-full bg-green-900/30 h-2 rounded-full mb-1">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: `${Math.min(carbs / 3, 100)}%` }}></div>
                </div>
                <p className="text-sm text-blue-100/70">Primary source of energy</p>
              </div>
              
              {/* Fat */}
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-blue-100">Fat</span>
                  <div>
                    <span className="text-xl font-bold text-yellow-400">{fat} </span>
                    <span className="text-blue-100/70">g</span>
                  </div>
                </div>
                <div className="w-full bg-yellow-900/30 h-2 rounded-full mb-1">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${Math.min(fat * 3, 100)}%` }}></div>
                </div>
                <p className="text-sm text-blue-100/70">Important for hormone production and nutrient absorption</p>
              </div>
              
              {/* Fiber */}
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-blue-100">Fiber</span>
                  <div>
                    <span className="text-xl font-bold text-cyan-accent">{fiber} </span>
                    <span className="text-blue-100/70">g</span>
                  </div>
                </div>
                <div className="w-full bg-cyan-900/30 h-2 rounded-full mb-1">
                  <div className="bg-cyan-accent h-2 rounded-full" style={{ width: `${Math.min(fiber * 5, 100)}%` }}></div>
                </div>
                <p className="text-sm text-blue-100/70">Aids digestion and helps maintain steady blood sugar</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Micronutrients Section */}
      <div className="mb-8">
        <SectionHeader 
          title="Micronutrients" 
          expanded={expandedSections.micronutrients} 
          onToggle={() => toggleSection('micronutrients')}
          icon={<FaCarrot />}
        />
        
        {expandedSections.micronutrients && (
          <div className="bg-darkBlue-secondary/40 border border-darkBlue-accent/20 rounded-lg p-4">
            {(() => {
              // Get micronutrients from wherever they might be
              const micronutrients = 
                data.microNutrients || 
                data.micronutrients || 
                [];
              
              // Main rendering logic
              if ((Array.isArray(micronutrients) && micronutrients.length > 0) || 
                  (micronutrients && typeof micronutrients === 'object' && Object.keys(micronutrients).length > 0)) {
                
                const categorized = categorizeNutrients(micronutrients);
                
                return (
                  <div className="space-y-6">
                    {Object.entries(categorized).map(([category, nutrients]) => (
                      <div key={category}>
                        <h4 className="font-semibold text-cyan-accent mb-3">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {nutrients.map((nutrient, index) => (
                            <div key={index} className="flex flex-col">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-medium text-blue-100">
                                  {nutrient.name || (typeof index === 'string' ? index : 'Unknown')}
                                </span>
                                <div>
                                  <span className="text-xl font-bold text-cyan-accent">{nutrient.amount} </span>
                                  <span className="text-blue-100/70">{nutrient.unit}</span>
                                  {nutrient.percentDailyValue && (
                                    <span className={`ml-2 font-medium ${
                                      nutrient.percentDailyValue >= 50 ? 'text-green-400' :
                                      nutrient.percentDailyValue >= 25 ? 'text-blue-400' :
                                      nutrient.percentDailyValue >= 10 ? 'text-yellow-400' : 'text-red-400'
                                    }`}>({nutrient.percentDailyValue}% DV)</span>
                                  )}
                                </div>
                              </div>
                              
                              {nutrient.percentDailyValue ? (
                                <div className="w-full bg-darkBlue-accent/20 h-2 rounded-full mb-1">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      nutrient.percentDailyValue >= 50 ? 'bg-green-400' :
                                      nutrient.percentDailyValue >= 25 ? 'bg-blue-400' :
                                      nutrient.percentDailyValue >= 10 ? 'bg-yellow-400' : 'bg-red-400'
                                    }`} 
                                    style={{ width: `${Math.min(nutrient.percentDailyValue, 100)}%` }}
                                  ></div>
                                </div>
                              ) : (
                                <div className="w-full bg-darkBlue-accent/20 h-2 rounded-full mb-1">
                                  <div className="bg-cyan-accent h-2 rounded-full" style={{ width: "50%" }}></div>
                                </div>
                              )}
                              
                              <p className="text-sm text-blue-100/70">
                                {nutrient.description || 
                                 nutrient.benefits || 
                                 getMicronutrientDescription(
                                   nutrient.name || (typeof index === 'string' ? index : 'Unknown'), 
                                   nutrient.amount, 
                                   nutrient.percentDailyValue
                                 )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              
              // No data case
              return (
                <div className="text-center py-4">
                  <p className="text-blue-100/80">No micronutrient data available for this meal.</p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Health Benefits Section - Consolidated from Recovery Insights */}
      <div className="mb-8">
        <SectionHeader 
          title="Health Benefits" 
          expanded={expandedSections.healthBenefits} 
          onToggle={() => toggleSection('healthBenefits')}
          icon={<FaBolt />}
        />
        
        {expandedSections.healthBenefits && (
          <div className="bg-darkBlue-secondary/40 border border-darkBlue-accent/20 rounded-lg p-4">
            {data.goal && (
              <div className="mb-4 text-center">
                <h5 className="font-medium text-cyan-accent mb-2">For your {data.goal} goal:</h5>
                <p className="text-blue-100/90">
                  {data.expertAdvice || getGoalSpecificAdvice(data)}
                </p>
              </div>
            )}
            
            {/* Recovery Insights cards in a grid layout */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              {/* Rapid Energy Replenishment */}
              {data.recoveryInsights && data.recoveryInsights.some(insight => insight.title.includes('Energy') || insight.description.includes('energy')) && (
                <div className="bg-darkBlue-accent/20 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-accent mb-2">Rapid Energy Replenishment</h4>
                  <p className="text-sm text-blue-100">
                    The natural sugars in oranges provide quickly accessible energy to replenish glycogen stores after exercise.
                  </p>
                </div>
              )}
              
              {/* Antioxidant Recovery Support */}
              {data.recoveryInsights && data.recoveryInsights.some(insight => insight.title.includes('Immune') || insight.description.includes('vitamin C')) && (
                <div className="bg-darkBlue-accent/20 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-accent mb-2">Antioxidant Recovery Support</h4>
                  <p className="text-sm text-blue-100">
                    The high vitamin C content helps neutralize exercise-induced free radicals and reduce oxidative stress.
                  </p>
                </div>
              )}
              
              {/* Enhanced Hydration */}
              {data.hydration && (
                <div className="bg-darkBlue-accent/20 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-accent mb-2">Enhanced Hydration</h4>
                  <p className="text-sm text-blue-100">
                    The natural water content and electrolytes support rehydration after physical activity.
                  </p>
                </div>
              )}
              
              {/* Display any remaining recovery insights that weren't specifically handled above */}
              {data.recoveryInsights && data.recoveryInsights.filter(insight => 
                !insight.title.includes('Energy') && 
                !insight.description.includes('energy') && 
                !insight.title.includes('Immune') && 
                !insight.description.includes('vitamin C') &&
                !insight.title.includes('Hydration')
              ).map((insight: RecoveryInsight, index: number) => (
                <div key={index} className="bg-darkBlue-accent/20 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-accent mb-2">{insight.title}</h4>
                  <p className="text-sm text-blue-100">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 