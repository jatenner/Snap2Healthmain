/**
 * Enhanced Insights Generator for meal analysis
 *
 * Generates personalized, goal-aware insights from meal analysis data.
 * Adapts recommendations based on the user's health goal category.
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

export type GoalCategory = 'weight_loss' | 'muscle_building' | 'athletic_performance' | 'disease_management' | 'general_wellness';

/**
 * Map free-text goal to a structured category
 */
export function categorizeGoal(goalText: string): GoalCategory {
  const g = (goalText || '').toLowerCase();
  if (g.includes('weight loss') || g.includes('lose weight') || g.includes('fat loss') || g.includes('slim') || g.includes('lean')) return 'weight_loss';
  if (g.includes('muscle') || g.includes('bulk') || g.includes('strength') || g.includes('gain')) return 'muscle_building';
  if (g.includes('performance') || g.includes('athletic') || g.includes('endurance') || g.includes('sport')) return 'athletic_performance';
  if (g.includes('diabetes') || g.includes('heart') || g.includes('cholesterol') || g.includes('blood pressure') || g.includes('kidney') || g.includes('hypertension')) return 'disease_management';
  return 'general_wellness';
}

const GOAL_LABELS: Record<GoalCategory, string> = {
  weight_loss: 'Weight Management',
  muscle_building: 'Muscle Building',
  athletic_performance: 'Athletic Performance',
  disease_management: 'Health Management',
  general_wellness: 'General Wellness',
};

/**
 * Generate personalized, goal-aware insights based on analysis data and user profile
 */
export function generateMealInsights(mealData: any, userProfile?: UserProfile): string {
  try {
    const insights: string[] = [];

    const age = userProfile?.age || 30;
    const weight = userProfile?.weight || 70;
    const height = userProfile?.height || 175;
    const gender = userProfile?.gender || 'unknown';
    const activityLevel = userProfile?.activity_level || 'moderate';
    const goalText = mealData.goal || userProfile?.goal || 'general wellness';
    const goalCategory = categorizeGoal(goalText);
    const calories = mealData.calories || mealData.analysis?.calories || 0;
    const healthConditions = userProfile?.health_conditions || [];

    const bmr = calculateBMR(age, weight, height, gender);
    const dailyCalories = calculateDailyCalories(bmr, activityLevel);
    const mealPercentage = Math.round((calories / dailyCalories) * 100);

    // HEADER - adapts to goal
    insights.push(`# Nutrition Analysis`);
    insights.push(`**Focus:** ${GOAL_LABELS[goalCategory]} | ${activityLevel} activity`);
    insights.push(`**Meal Impact:** ${calories} kcal (${mealPercentage}% of ~${Math.round(dailyCalories)} daily target)`);
    insights.push('');

    // MACRO ANALYSIS
    const macros = mealData.macronutrients || mealData.analysis?.macronutrients || [];
    const protein = macros.find((m: any) => m.name.toLowerCase().includes('protein'));
    const carbs = macros.find((m: any) => m.name.toLowerCase().includes('carb'));
    const fat = macros.find((m: any) => m.name.toLowerCase().includes('fat'));

    insights.push(`## Macro Breakdown`);

    if (protein && carbs && fat && calories > 0) {
      const proteinRatio = (protein.amount * 4 / calories * 100).toFixed(0);
      const carbRatio = (carbs.amount * 4 / calories * 100).toFixed(0);
      const fatRatio = (fat.amount * 9 / calories * 100).toFixed(0);
      insights.push(`**Macro Split:** ${proteinRatio}P / ${carbRatio}C / ${fatRatio}F`);

      // Goal-specific macro analysis
      if (goalCategory === 'weight_loss') {
        if (protein.amount >= 25) {
          insights.push(`- **Protein:** ${protein.amount}g -- good for satiety and preserving muscle during a deficit`);
        } else {
          insights.push(`- **Protein:** ${protein.amount}g -- aim for 25-35g per meal to stay full and protect muscle`);
        }
        if (calories > dailyCalories * 0.4) {
          insights.push(`- **Calorie note:** This meal is ${mealPercentage}% of your daily target. Balance with lighter meals.`);
        }
        const fiber = macros.find((m: any) => m.name.toLowerCase().includes('fiber'));
        if (fiber && fiber.amount >= 5) {
          insights.push(`- **Fiber:** ${fiber.amount}g -- excellent for fullness and blood sugar control`);
        }
      } else if (goalCategory === 'muscle_building') {
        const proteinPerKg = protein.amount / weight;
        if (proteinPerKg >= 0.25) {
          insights.push(`- **Protein:** ${protein.amount}g (${proteinPerKg.toFixed(1)}g/kg) -- optimal for muscle protein synthesis`);
        } else {
          insights.push(`- **Protein gap:** ${protein.amount}g (${proteinPerKg.toFixed(1)}g/kg) -- add ~${Math.round((0.25 * weight) - protein.amount)}g more protein`);
        }
        if (calories < dailyCalories * 0.2) {
          insights.push(`- **Calorie note:** Only ${mealPercentage}% of daily target. You may need a larger meal or extra snack to support growth.`);
        }
      } else if (goalCategory === 'athletic_performance') {
        if (carbs.amount >= 30) {
          insights.push(`- **Carbs:** ${carbs.amount}g -- sufficient glycogen replenishment for ${activityLevel} training`);
        } else {
          insights.push(`- **Carbs:** ${carbs.amount}g -- consider adding carbs for optimal energy (target ~${Math.round(weight * 0.5)}g per meal)`);
        }
        if (protein.amount >= 20) {
          insights.push(`- **Protein:** ${protein.amount}g -- supports recovery for 3-4 hours`);
        }
      } else if (goalCategory === 'disease_management') {
        const sodium = macros.find((m: any) => m.name.toLowerCase().includes('sodium'));
        const sugar = macros.find((m: any) => m.name.toLowerCase().includes('sugar'));
        const satFat = macros.find((m: any) => m.name.toLowerCase().includes('saturated'));
        if (sodium && sodium.amount > 600) {
          insights.push(`- **Sodium:** ${sodium.amount}mg -- high for one meal. Daily limit is 1500-2300mg for heart health.`);
        }
        if (sugar && sugar.amount > 15) {
          insights.push(`- **Sugar:** ${sugar.amount}g -- monitor blood sugar impact. Pair with fiber/protein to slow absorption.`);
        }
        if (satFat && satFat.amount > 7) {
          insights.push(`- **Saturated fat:** ${satFat.amount}g -- elevated. Swap for unsaturated fats where possible.`);
        }
      } else {
        // General wellness
        insights.push(`- **Protein:** ${protein.amount}g | **Carbs:** ${carbs.amount}g | **Fat:** ${fat.amount}g`);
        if (protein.amount < 15) {
          insights.push(`- Consider adding a protein source for better nutrient balance`);
        }
      }

      // Universal fat checks
      if (fat.amount < 10 && goalCategory !== 'weight_loss') {
        insights.push(`- **Low fat:** ${fat.amount}g -- needed for hormone production and vitamin absorption`);
      }
    }

    insights.push('');

    // MICRONUTRIENT HIGHLIGHTS
    const micros = mealData.micronutrients || mealData.analysis?.micronutrients || [];
    if (micros.length > 0) {
      insights.push(`## Key Nutrients`);

      const vitaminD = micros.find((m: any) => m.name.toLowerCase().includes('vitamin d'));
      const iron = micros.find((m: any) => m.name.toLowerCase().includes('iron'));
      const magnesium = micros.find((m: any) => m.name.toLowerCase().includes('magnesium'));
      const calcium = micros.find((m: any) => m.name.toLowerCase().includes('calcium'));
      const potassium = micros.find((m: any) => m.name.toLowerCase().includes('potassium'));

      // Highlight standouts (>30% DV)
      const standouts = micros.filter((m: any) => m.percentDailyValue > 30).slice(0, 3);
      if (standouts.length > 0) {
        standouts.forEach((n: any) => {
          insights.push(`- **${n.name}:** ${n.amount}${n.unit} (${n.percentDailyValue}% DV) -- ${getNutrientBenefit(n.name, goalCategory)}`);
        });
      }

      // Flag deficiencies (<15% DV)
      const gaps = micros.filter((m: any) => m.percentDailyValue > 0 && m.percentDailyValue < 15).slice(0, 2);
      if (gaps.length > 0) {
        gaps.forEach((n: any) => {
          insights.push(`- **${n.name}:** ${n.amount}${n.unit} (${n.percentDailyValue}% DV) -- low. ${getNutrientFoodSource(n.name)}`);
        });
      }

      insights.push('');
    }

    // ACTIONABLE RECOMMENDATIONS
    insights.push(`## Recommendations`);

    if (goalCategory === 'weight_loss') {
      insights.push(`- Prioritize high-volume, low-calorie foods (vegetables, lean proteins) to stay full`);
      insights.push(`- Aim for 25-30g fiber daily to support satiety and digestion`);
      insights.push(`- Spread protein across meals to maintain muscle during weight loss`);
    } else if (goalCategory === 'muscle_building') {
      insights.push(`- Target ${(weight * 1.6).toFixed(0)}g total daily protein across 4-5 meals`);
      insights.push(`- Time protein intake every 3-4 hours for sustained muscle protein synthesis`);
      insights.push(`- Ensure adequate calories to support growth (~${Math.round(dailyCalories)} kcal/day)`);
    } else if (goalCategory === 'athletic_performance') {
      insights.push(`- Time carb-rich meals 2-3 hours before training for optimal energy`);
      insights.push(`- Include protein + carbs within 1 hour post-training for recovery`);
      insights.push(`- Stay hydrated -- aim for at least 500ml water with this meal`);
    } else if (goalCategory === 'disease_management') {
      const conditions = healthConditions.map(c => c.toLowerCase());
      if (conditions.some(c => c.includes('diabetes') || c.includes('blood sugar'))) {
        insights.push(`- Pair carbohydrates with protein or healthy fats to reduce blood sugar spikes`);
        insights.push(`- Focus on low-glycemic foods and whole grains`);
      }
      if (conditions.some(c => c.includes('heart') || c.includes('cholesterol') || c.includes('hypertension'))) {
        insights.push(`- Limit sodium to <1500mg/day and saturated fat to <13g/day`);
        insights.push(`- Increase omega-3 fatty acids (fish, walnuts, flaxseed)`);
      }
      if (conditions.length === 0) {
        insights.push(`- Focus on whole, minimally processed foods`);
        insights.push(`- Monitor nutrients relevant to your specific condition`);
      }
      insights.push(`- Consult your healthcare provider for personalized dietary guidance`);
    } else {
      insights.push(`- Focus on nutrient-dense whole foods for sustained energy`);
      insights.push(`- Aim for variety across food groups throughout the day`);
      insights.push(`- Stay consistent with meal timing for metabolic health`);
    }

    insights.push('');

    // MEAL SCORE
    const healthRating = mealData.healthRating || 7;
    insights.push(`## Meal Score: ${healthRating}/10`);

    if (healthRating >= 8) {
      insights.push(`Excellent meal for your ${GOAL_LABELS[goalCategory].toLowerCase()} goals. Keep it up!`);
    } else if (healthRating >= 6) {
      insights.push(`Good foundation with room for small improvements.`);
    } else {
      insights.push(`This meal has some nutritional gaps. See recommendations above.`);
    }

    return insights.join('\n');

  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Unable to generate insights for this meal. Please try again.';
  }
}

/**
 * Get a goal-relevant benefit description for a nutrient
 */
function getNutrientBenefit(name: string, goalCategory: GoalCategory): string {
  const n = name.toLowerCase();
  const benefits: Record<string, Record<GoalCategory, string>> = {
    'vitamin d': {
      weight_loss: 'supports metabolism and mood',
      muscle_building: 'supports muscle function and recovery',
      athletic_performance: 'supports recovery and bone strength',
      disease_management: 'supports immune function and bone health',
      general_wellness: 'supports immune function and bone health',
    },
    iron: {
      weight_loss: 'supports energy levels during caloric deficit',
      muscle_building: 'supports oxygen delivery for training',
      athletic_performance: 'critical for oxygen transport and endurance',
      disease_management: 'supports energy and immune function',
      general_wellness: 'supports energy and oxygen transport',
    },
    calcium: {
      weight_loss: 'may support fat metabolism',
      muscle_building: 'essential for muscle contraction',
      athletic_performance: 'prevents cramping and supports bone density',
      disease_management: 'supports bone and heart health',
      general_wellness: 'supports bone health',
    },
  };

  for (const [key, goalMap] of Object.entries(benefits)) {
    if (n.includes(key)) return goalMap[goalCategory];
  }
  return 'supports overall health';
}

/**
 * Suggest food sources for a nutrient
 */
function getNutrientFoodSource(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('vitamin d')) return 'Try fatty fish, eggs, or fortified foods.';
  if (n.includes('vitamin c')) return 'Add citrus fruits, bell peppers, or berries.';
  if (n.includes('vitamin a')) return 'Try sweet potatoes, carrots, or leafy greens.';
  if (n.includes('iron')) return 'Add red meat, lentils, or spinach.';
  if (n.includes('calcium')) return 'Try dairy, fortified plant milk, or leafy greens.';
  if (n.includes('magnesium')) return 'Add nuts, seeds, or dark leafy greens.';
  if (n.includes('potassium')) return 'Try bananas, sweet potatoes, or avocados.';
  if (n.includes('zinc')) return 'Add meat, shellfish, or pumpkin seeds.';
  if (n.includes('b12')) return 'Try meat, fish, eggs, or fortified foods.';
  if (n.includes('folate') || n.includes('b9')) return 'Add leafy greens, legumes, or fortified grains.';
  if (n.includes('fiber')) return 'Add whole grains, vegetables, or legumes.';
  return 'Consider adding more whole foods to address this gap.';
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

// getPerformanceBenefit removed - replaced by goal-aware getNutrientBenefit above

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