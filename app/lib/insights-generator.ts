/**
 * Enhanced Insights Generator for meal analysis
 * 
 * This module provides functions to generate laser-focused, tactical insights
 * from meal analysis data, focused on measurable performance outcomes.
 */

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

/**
 * Generate tactical, performance-focused insights based on analysis data and user profile
 */
export function generateMealInsights(mealData: any, userProfile?: UserProfile): string {
  try {
    const insights: string[] = [];
    
    // Get user specifics for tactical analysis
    const age = userProfile?.age || 30;
    const weight = userProfile?.weight || 70;
    const height = userProfile?.height || 175;
    const gender = userProfile?.gender || 'unknown';
    const activityLevel = userProfile?.activity_level || 'moderate';
    const goal = mealData.goal || userProfile?.goal || "performance optimization";
    const calories = mealData.calories || mealData.analysis?.calories || 0;
    
    // Calculate BMR and daily needs for context
    const bmr = calculateBMR(age, weight, height, gender);
    const dailyCalories = calculateDailyCalories(bmr, activityLevel);
    const mealPercentage = Math.round((calories / dailyCalories) * 100);
    
    // TACTICAL HEADER
    insights.push(`# 🎯 PERFORMANCE NUTRITION ANALYSIS`);
    insights.push(`**Athlete Profile:** ${age}yr ${gender} | ${weight}kg | ${activityLevel} activity | Goal: ${goal}`);
    insights.push(`**Meal Impact:** ${calories} kcal (${mealPercentage}% of ${Math.round(dailyCalories)} daily target)`);
    insights.push('');
    
    // CRITICAL METABOLIC INSIGHTS
    const macros = mealData.macronutrients || mealData.analysis?.macronutrients || [];
      const protein = macros.find((m: any) => m.name.toLowerCase().includes('protein'));
      const carbs = macros.find((m: any) => m.name.toLowerCase().includes('carb'));
      const fat = macros.find((m: any) => m.name.toLowerCase().includes('fat'));
      
    insights.push(`## ⚡ IMMEDIATE METABOLIC IMPACT`);
    
    if (protein && carbs && fat) {
      const proteinRatio = (protein.amount * 4 / calories * 100).toFixed(0);
      const carbRatio = (carbs.amount * 4 / calories * 100).toFixed(0);
      const fatRatio = (fat.amount * 9 / calories * 100).toFixed(0);
      
      insights.push(`**Macro Split:** ${proteinRatio}P/${carbRatio}C/${fatRatio}F`);
      
      // Specific performance insights based on ratios
      if (goal.toLowerCase().includes('muscle') || goal.toLowerCase().includes('strength')) {
        const proteinPerKg = protein.amount / weight;
        if (proteinPerKg >= 0.25) {
          insights.push(`✅ **Protein Hit:** ${protein.amount}g (${proteinPerKg.toFixed(1)}g/kg) - optimal for muscle protein synthesis`);
        } else {
          insights.push(`⚠️ **Protein Gap:** Only ${protein.amount}g (${proteinPerKg.toFixed(1)}g/kg) - add ${Math.round((0.25 * weight) - protein.amount)}g more protein for optimal MPS`);
        }
      }
      
      if (goal.toLowerCase().includes('performance') || goal.toLowerCase().includes('athletic')) {
        if (carbs.amount >= 30) {
          insights.push(`✅ **Carb Timing:** ${carbs.amount}g carbs = sufficient glycogen replenishment for ${activityLevel} training`);
        } else {
          insights.push(`⚠️ **Carb Deficit:** ${carbs.amount}g insufficient for performance - target ${Math.round(weight * 0.5)}g for optimal glycogen`);
        }
      }
      
      // Fat analysis for hormone production
      if (fat.amount < 10) {
        insights.push(`🚨 **Fat Critical:** Only ${fat.amount}g fat - insufficient for hormone production and fat-soluble vitamin absorption`);
      } else if (fat.amount > 25) {
        insights.push(`⚠️ **Fat Heavy:** ${fat.amount}g fat may slow digestion - consider timing relative to training`);
      }
    }
    
    insights.push('');
    
    // PRECISION TIMING RECOMMENDATIONS
    insights.push(`## ⏰ TACTICAL TIMING`);
    
    if (goal.toLowerCase().includes('performance') || goal.toLowerCase().includes('athletic')) {
      insights.push(`**Pre-Workout Window:** Consume 2-3 hours before training for optimal energy availability`);
      insights.push(`**Post-Workout Window:** If eaten within 30min post-training, will maximize recovery and adaptation`);
      
      if (protein && protein.amount >= 20) {
        insights.push(`**MPS Trigger:** ${protein.amount}g protein = optimal muscle protein synthesis for 3-4 hours`);
      }
      
      if (carbs && carbs.amount >= 30) {
        insights.push(`**Glycogen Replenishment:** ${carbs.amount}g carbs = 60-90 minutes of glycogen restoration`);
      }
    }
    
    insights.push('');
    
    // MICRONUTRIENT PERFORMANCE GAPS
    const micros = mealData.micronutrients || mealData.analysis?.micronutrients || [];
    insights.push(`## 🔬 PERFORMANCE MICRONUTRIENTS`);
    
    // Find key performance nutrients
    const vitaminD = micros.find((m: any) => m.name.toLowerCase().includes('vitamin d'));
    const iron = micros.find((m: any) => m.name.toLowerCase().includes('iron'));
    const magnesium = micros.find((m: any) => m.name.toLowerCase().includes('magnesium'));
    const vitB12 = micros.find((m: any) => m.name.toLowerCase().includes('b12'));
    
    if (vitaminD && vitaminD.percentDailyValue < 25) {
      insights.push(`🚨 **Vitamin D Critical:** ${vitaminD.amount}${vitaminD.unit} (${vitaminD.percentDailyValue}% DV) - insufficient for testosterone production and recovery`);
    }
    
    if (iron && iron.percentDailyValue > 50) {
      insights.push(`✅ **Iron Loaded:** ${iron.amount}${iron.unit} (${iron.percentDailyValue}% DV) - excellent for oxygen transport and endurance`);
    }
    
    if (magnesium && magnesium.percentDailyValue < 20) {
      insights.push(`⚠️ **Magnesium Gap:** ${magnesium.amount}${magnesium.unit} (${magnesium.percentDailyValue}% DV) - add 200mg for muscle function and sleep quality`);
    }
    
    insights.push('');
    
    // TACTICAL IMPROVEMENTS
    insights.push(`## 🎯 IMMEDIATE UPGRADES`);
    
    const suggestions = mealData.suggestions || mealData.analysis?.suggestions || [];
    const expertRecs = mealData.expertRecommendations || [];
    
    // Add specific, measurable recommendations
    if (goal.toLowerCase().includes('muscle') || goal.toLowerCase().includes('strength')) {
      insights.push(`**Muscle Optimization:**`);
      insights.push(`- Add 5g creatine monohydrate post-meal for 15-20% strength gains`);
      insights.push(`- Include 3g leucine to maximize mTOR activation`);
      insights.push(`- Time meal within 2hrs of training for optimal protein synthesis`);
    }
    
    if (goal.toLowerCase().includes('performance') || goal.toLowerCase().includes('athletic')) {
      insights.push(`**Performance Enhancement:**`);
      insights.push(`- Add 200mg caffeine 45min pre-training for 3-5% power output increase`);
      insights.push(`- Include 3-5g beta-alanine for muscular endurance`);
      insights.push(`- Follow with 500ml water + electrolytes within 15min`);
    }
    
    // Add expert recommendations if available
    if (expertRecs.length > 0) {
      insights.push(`**Expert Recommendations:**`);
      expertRecs.slice(0, 3).forEach((rec: string) => {
        insights.push(`- ${rec}`);
      });
    }
    
    insights.push('');
    
    // PERFORMANCE PREDICTION
    insights.push(`## 📊 PERFORMANCE PREDICTION`);
    
    const healthRating = mealData.healthRating || 7;
    insights.push(`**Overall Score:** ${healthRating}/10 for ${goal}`);
    
    if (healthRating >= 8) {
      insights.push(`🔥 **Elite Level:** This meal composition will support peak performance and recovery`);
    } else if (healthRating >= 6) {
      insights.push(`💪 **Solid Foundation:** Good meal with room for tactical improvements`);
    } else {
      insights.push(`⚠️ **Needs Work:** Several optimization opportunities to maximize results`);
    }
    
    // Specific performance outcomes based on the meal
    if (calories >= dailyCalories * 0.25) {
      insights.push(`**Energy Duration:** Sustained energy for 3-4 hours of ${activityLevel} activity`);
    }
    
    if (protein && protein.amount >= 25) {
      insights.push(`**Recovery Impact:** Muscle protein synthesis elevated for 3-4 hours post-consumption`);
    }
    
    insights.push('');
    
    // NEXT LEVEL STRATEGY
    insights.push(`## 🚀 NEXT LEVEL STRATEGY`);
    insights.push(`For your ${goal} goals:`);
    
    if (goal.toLowerCase().includes('muscle')) {
      insights.push(`- Replicate this meal pattern 4-5x daily with ${Math.round(dailyCalories/4)} kcal each`);
      insights.push(`- Target ${(weight * 1.6).toFixed(0)}g total daily protein across 4-5 meals`);
      insights.push(`- Time protein intake every 3-4 hours for continuous MPS`);
    } else if (goal.toLowerCase().includes('performance')) {
      insights.push(`- Periodize carb intake: high on training days, moderate on rest days`);
      insights.push(`- Track HRV and adjust meal timing based on recovery status`);
      insights.push(`- Consider nutrient timing relative to circadian rhythm`);
      } else {
      insights.push(`- Maintain consistent meal timing for metabolic optimization`);
      insights.push(`- Track energy levels and adjust macronutrient ratios accordingly`);
      insights.push(`- Focus on nutrient density over calorie counting`);
    }
    
    return insights.join('\n');
    
  } catch (error) {
    console.error('Error generating tactical insights:', error);
    return 'Unable to generate performance insights for this meal. Please try uploading the image again.';
  }
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
function calculateBMR(age: number, weight: number, height: number, gender: string): number {
  const weightKg = typeof weight === 'number' ? weight : 70;
  const heightCm = typeof height === 'number' ? height : 175;
  const ageYears = typeof age === 'number' ? age : 30;
  
  if (gender?.toLowerCase() === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  }
}

/**
 * Calculate daily calorie needs based on activity level
 */
function calculateDailyCalories(bmr: number, activityLevel: string): number {
  const multipliers: { [key: string]: number } = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very active': 1.9,
    'high': 1.9
  };
  
  const multiplier = multipliers[activityLevel?.toLowerCase()] || 1.55;
  return bmr * multiplier;
}

/**
 * Helper function for performance-focused micronutrient benefits
 */
function getPerformanceBenefit(nutrientName: string): string {
  const name = nutrientName.toLowerCase();
  
  if (name.includes('vitamin d')) return 'testosterone production and muscle recovery';
  if (name.includes('vitamin c')) return 'collagen synthesis and iron absorption';
  if (name.includes('vitamin b12')) return 'energy metabolism and red blood cell production';
  if (name.includes('iron')) return 'oxygen transport and endurance capacity';
  if (name.includes('calcium')) return 'muscle contraction and bone density';
  if (name.includes('potassium')) return 'muscle function and blood pressure regulation';
  if (name.includes('magnesium')) return 'muscle recovery and sleep quality';
  if (name.includes('zinc')) return 'testosterone production and immune function';
  
  return 'overall athletic performance';
}

// Enhanced concise insights generation
export function generateConcisePersonalizedInsights(
  mealData: any,
  userProfile: any,
  mealHistory?: any[]
): string {
  console.log('[Enhanced Insights] Generating concise insights for:', {
    meal: mealData?.meal_name,
    user: userProfile?.name,
    historyCount: mealHistory?.length || 0
  });

  try {
    const insights = [];
    
    // Quick macro assessment
    const macroInsight = generateMacroInsight(mealData, userProfile);
    if (macroInsight) insights.push(macroInsight);
    
    // Calorie context with history
    const calorieInsight = generateCalorieInsight(mealData, userProfile, mealHistory);
    if (calorieInsight) insights.push(calorieInsight);
    
    // Key nutritional highlights (max 2)
    const nutritionHighlights = generateNutritionHighlights(mealData);
    insights.push(...nutritionHighlights.slice(0, 2));
    
    // Goal-specific actionable advice
    const goalInsight = generateGoalSpecificInsight(mealData, userProfile);
    if (goalInsight) insights.push(goalInsight);
    
    // Historical pattern insight (if available)
    if (mealHistory && mealHistory.length > 3) {
      const patternInsight = generatePatternInsight(mealData, mealHistory);
      if (patternInsight) insights.push(patternInsight);
    }
    
    // Combine into concise format (max 3-4 bullet points)
    const finalInsights = insights.slice(0, 4);
    
    return finalInsights.length > 0 
      ? `**Quick Analysis:**\n${finalInsights.map(insight => `• ${insight}`).join('\n')}`
      : generateFallbackInsight(mealData, userProfile);
      
  } catch (error) {
    console.error('[Enhanced Insights] Error:', error);
    return generateFallbackInsight(mealData, userProfile);
  }
}

function generateMacroInsight(mealData: any, userProfile: any): string | null {
  const macros = extractMacronutrients(mealData);
  if (!macros.protein && !macros.carbs && !macros.fat) return null;
  
  const goal = userProfile?.defaultGoal?.toLowerCase() || userProfile?.goal?.toLowerCase() || '';
  const weight = parseFloat(userProfile?.weight) || 70; // kg equivalent
  
  // Quick protein assessment for athletic goals
  if (goal.includes('athletic') || goal.includes('muscle') || goal.includes('performance')) {
    const proteinPerKg = (macros.protein || 0) / (weight * 0.453592); // Convert lbs to kg
    if (proteinPerKg < 1.2) {
      return `More protein needed for your ${goal} goal (aim for 30-40g per meal)`;
    } else if (proteinPerKg > 2.0) {
      return `Excellent protein content (${Math.round(macros.protein)}g) for muscle building 💪`;
    }
  }
  
  // Quick carb assessment for energy goals
  if (goal.includes('energy') || goal.includes('endurance')) {
    if ((macros.carbs || 0) > 50) {
      return `Great carb content (${Math.round(macros.carbs)}g) for sustained energy ⚡`;
    }
  }
  
  // Weight management focus
  if (goal.includes('weight loss') || goal.includes('lose')) {
    const calories = mealData?.calories || calculateCaloriesFromMacros(macros);
    if (calories > 600) {
      return `High-calorie meal (${calories}cal) - balance with lighter meals today`;
    } else if (calories < 300) {
      return `Light meal (${calories}cal) - perfect for weight management goals`;
    }
  }
  
  return null;
}

function generateCalorieInsight(mealData: any, userProfile: any, mealHistory?: any[]): string | null {
  const calories = mealData?.calories || 0;
  if (calories === 0) return null;
  
  // Compare to recent meal average if history available
  if (mealHistory && mealHistory.length > 5) {
    const avgCalories = mealHistory.reduce((sum, meal) => sum + (meal.calories || 0), 0) / mealHistory.length;
    const difference = calories - avgCalories;
    
    if (Math.abs(difference) > 150) {
      const comparison = difference > 0 ? 'higher' : 'lower';
      return `${Math.abs(Math.round(difference))}cal ${comparison} than your recent average (${Math.round(avgCalories)}cal)`;
    }
  }
  
  // Activity-based calorie context
  const activityLevel = userProfile?.activityLevel?.toLowerCase() || '';
  if (activityLevel.includes('active') && calories < 400) {
    return `Light meal for an active lifestyle - consider a post-workout snack`;
  }
  
  return null;
}

function generateNutritionHighlights(mealData: any): string[] {
  const highlights = [];
  
  // Check for standout nutrients
  const micros = extractMicronutrients(mealData);
  const standoutNutrients = Object.entries(micros)
    .filter(([name, amount]) => (amount as number) > 20) // Good amount
    .slice(0, 2);
    
  if (standoutNutrients.length > 0) {
    standoutNutrients.forEach(([nutrient, amount]) => {
      highlights.push(`Rich in ${nutrient} (${Math.round(amount as number)}% DV)`);
    });
  }
  
  // Check for fiber
  const fiber = extractSpecificNutrient(mealData, 'fiber');
  if (fiber && fiber > 8) {
    highlights.push(`High fiber content (${Math.round(fiber)}g) supports digestive health`);
  }
  
  // Check for sodium
  const sodium = extractSpecificNutrient(mealData, 'sodium');
  if (sodium && sodium > 800) {
    highlights.push(`Watch sodium intake (${Math.round(sodium)}mg) - drink extra water`);
  }
  
  // Check for healthy fats
  const omega3 = extractSpecificNutrient(mealData, 'omega-3');
  const unsaturatedFat = extractSpecificNutrient(mealData, 'unsaturated fat');
  if (omega3 && omega3 > 0.5) {
    highlights.push(`Good omega-3 fatty acids for brain health 🧠`);
  } else if (unsaturatedFat && unsaturatedFat > 10) {
    highlights.push(`Healthy fats support nutrient absorption`);
  }
  
  return highlights;
}

function generateGoalSpecificInsight(mealData: any, userProfile: any): string | null {
  const goal = userProfile?.defaultGoal?.toLowerCase() || userProfile?.goal?.toLowerCase() || '';
  const mealName = mealData?.meal_name || '';
  
  if (goal.includes('athletic') || goal.includes('performance')) {
    const protein = extractSpecificNutrient(mealData, 'protein');
    const carbs = extractSpecificNutrient(mealData, 'carbohydrates');
    
    if (protein && protein > 25 && carbs && carbs > 30) {
      return `Perfect post-workout combination of protein & carbs for recovery`;
    } else if (protein && protein < 15) {
      return `Add a protein source to better support your athletic goals`;
    }
  }
  
  if (goal.includes('weight loss')) {
    const calories = mealData?.calories || 0;
    const protein = extractSpecificNutrient(mealData, 'protein');
    
    if (protein && protein > 20 && calories < 500) {
      return `Great balance for weight loss - high protein, controlled calories`;
    }
  }
  
  if (goal.includes('muscle') || goal.includes('gain')) {
    const protein = extractSpecificNutrient(mealData, 'protein');
    const calories = mealData?.calories || 0;
    
    if (calories > 600 && protein && protein > 25) {
      return `Solid muscle-building meal with adequate calories and protein`;
    }
  }
  
  return null;
}

function generatePatternInsight(currentMeal: any, mealHistory: any[]): string | null {
  if (mealHistory.length < 3) return null;
  
  // Check protein consistency
  const recentProtein = mealHistory.slice(0, 5).map(meal => extractSpecificNutrient(meal, 'protein') || 0);
  const avgProtein = recentProtein.reduce((sum, val) => sum + val, 0) / recentProtein.length;
  const currentProtein = extractSpecificNutrient(currentMeal, 'protein') || 0;
  
  if (currentProtein > avgProtein * 1.5) {
    return `Protein boost! 50% higher than your recent average`;
  } else if (currentProtein < avgProtein * 0.5 && avgProtein > 15) {
    return `Lower protein than usual - consider adding a protein source`;
  }
  
  // Check meal timing patterns
  const mealTimes = mealHistory.map(meal => new Date(meal.created_at).getHours()).filter(h => !isNaN(h));
  const currentHour = new Date().getHours();
  
  if (mealTimes.length > 3) {
    const avgMealTime = mealTimes.reduce((sum, time) => sum + time, 0) / mealTimes.length;
    if (Math.abs(currentHour - avgMealTime) > 3) {
      const timing = currentHour > avgMealTime ? 'later' : 'earlier';
      return `Eating ${timing} than usual - adjust portions if needed`;
    }
  }
  
  return null;
}

function generateFallbackInsight(mealData: any, userProfile: any): string {
  const mealName = mealData?.meal_name || 'this meal';
  const calories = mealData?.calories || 0;
  
  if (calories > 0) {
    return `**${mealName}** provides ${calories} calories. Track your daily total to stay aligned with your ${userProfile?.defaultGoal || 'health'} goals.`;
  }
  
  return `Good choice with **${mealName}**! Continue building healthy eating habits to support your wellness journey.`;
}

// Helper functions for nutrient extraction
function extractMacronutrients(mealData: any) {
  const macros = mealData?.macronutrients || mealData?.analysis?.macronutrients || [];
  const result = { protein: 0, carbs: 0, fat: 0 };
  
  macros.forEach((macro: any) => {
    const name = macro.name?.toLowerCase() || '';
    const amount = parseFloat(macro.amount) || 0;
    
    if (name.includes('protein')) result.protein = amount;
    if (name.includes('carb')) result.carbs = amount;
    if (name.includes('fat') && !name.includes('trans')) result.fat = amount;
  });
  
  return result;
}

function extractMicronutrients(mealData: any): Record<string, number> {
  const micros = mealData?.micronutrients || mealData?.analysis?.micronutrients || [];
  const result: Record<string, number> = {};
  
  micros.forEach((micro: any) => {
    if (micro.name && micro.percentDailyValue) {
      result[micro.name] = parseFloat(micro.percentDailyValue) || 0;
    }
  });
  
  return result;
}

function extractSpecificNutrient(mealData: any, targetNutrient: string): number | null {
  const allNutrients = [
    ...(mealData?.macronutrients || []),
    ...(mealData?.micronutrients || []),
    ...(mealData?.analysis?.macronutrients || []),
    ...(mealData?.analysis?.micronutrients || [])
  ];
  
  const nutrient = allNutrients.find((n: any) => 
    n.name?.toLowerCase().includes(targetNutrient.toLowerCase())
  );
  
  return nutrient ? parseFloat(nutrient.amount) || 0 : null;
}

function calculateCaloriesFromMacros(macros: any): number {
  return (macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9);
} 