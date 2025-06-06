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