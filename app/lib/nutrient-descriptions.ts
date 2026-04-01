// Personalized, goal-aware nutrient descriptions

import { categorizeGoal } from './insights-generator';
import type { GoalCategory } from './insights-generator';

export { type GoalCategory };

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
  category?: 'vitamin' | 'mineral' | 'macronutrient' | 'antioxidant' | 'fatty-acid' | 'other';
  status?: 'low' | 'adequate' | 'high';
  personalizedDV?: number;
}

export const filterRelevantNutrients = (nutrients: Nutrient[] = []): Nutrient[] => {
  return nutrients.filter(nutrient => nutrient.amount > 0.01);
};

// Base descriptions (general audience, no athlete assumptions)
const BASE_DESCRIPTIONS: Record<string, string> = {
  // Macronutrients
  'protein': 'Builds and repairs tissues, supports immune function, and helps you feel full between meals.',
  'carbohydrates': 'Your body\'s preferred energy source. Fuels your brain, muscles, and daily activities.',
  'fat': 'Essential for hormone production, vitamin absorption, and cell health. Choose healthy sources.',
  'fiber': 'Supports digestive health, blood sugar control, and helps you stay full longer.',
  'sugar': 'Provides quick energy. Natural sugars from whole foods are preferable to added sugars.',
  'sodium': 'Regulates fluid balance and nerve function. Most people should limit intake to 2300mg/day.',
  'saturated fat': 'Limit intake for heart health. Found in animal fats, full-fat dairy, and coconut oil.',
  'trans fat': 'Avoid completely -- increases inflammation and heart disease risk.',
  'unsaturated fat': 'Heart-healthy fats that reduce inflammation. Found in olive oil, nuts, and fish.',
  'cholesterol': 'Used to make hormones and cell membranes. Dietary impact varies by individual.',
  'calories': 'Energy to fuel your daily activities and bodily functions.',

  // Vitamins
  'vitamin a': 'Keeps your eyes healthy for good vision, especially at night. Also supports immune function and skin health.',
  'vitamin c': 'Powerful antioxidant that supports immune function, skin health, and iron absorption.',
  'vitamin d': 'Supports bone health, immune function, and mood. Many people are deficient, especially in winter.',
  'vitamin e': 'Protects cells from damage and supports immune function and skin health.',
  'vitamin k': 'Essential for blood clotting and bone health.',
  'vitamin b1': 'Converts carbohydrates into energy. Important for nerve and muscle function.',
  'vitamin b2': 'Helps produce energy and supports healthy skin and red blood cells.',
  'vitamin b3': 'Supports energy metabolism, skin health, and nervous system function.',
  'vitamin b5': 'Helps convert food into energy. Supports hormone production.',
  'vitamin b6': 'Important for protein metabolism, brain function, and immune health.',
  'vitamin b7': 'Supports healthy hair, skin, nails, and energy metabolism.',
  'vitamin b9': 'Essential for cell division and DNA synthesis. Especially important during pregnancy.',
  'vitamin b12': 'Critical for nerve function, red blood cell formation, and energy production.',

  // Minerals
  'calcium': 'Essential for strong bones, muscle function, and nerve signaling.',
  'iron': 'Carries oxygen throughout your body. Deficiency causes fatigue and weakness.',
  'potassium': 'Regulates blood pressure, fluid balance, and muscle contractions.',
  'magnesium': 'Supports muscle and nerve function, energy production, and sleep quality.',
  'zinc': 'Supports immune function, wound healing, and protein synthesis.',
  'phosphorus': 'Works with calcium for strong bones and teeth. Supports energy storage.',
  'selenium': 'Antioxidant that supports thyroid function and protects against cell damage.',
  'iodine': 'Essential for thyroid hormones that regulate metabolism.',
  'copper': 'Supports iron absorption, collagen formation, and immune function.',
  'manganese': 'Supports bone formation, blood clotting, and metabolism.',
  'chromium': 'May help regulate blood sugar and support insulin function.',
  'molybdenum': 'Helps process amino acids and supports enzyme function.',
};

// Goal-specific addendums for key nutrients
const GOAL_ADDENDUMS: Record<string, Partial<Record<GoalCategory, string>>> = {
  'protein': {
    weight_loss: 'Higher protein helps preserve muscle during caloric deficit and increases satiety.',
    muscle_building: 'Aim for 1.6-2.2g per kg of bodyweight daily to maximize muscle protein synthesis.',
    athletic_performance: 'Supports muscle recovery after training. Time intake around workouts for best results.',
  },
  'carbohydrates': {
    weight_loss: 'Choose complex carbs with fiber to maintain energy while managing calories.',
    muscle_building: 'Adequate carbs fuel intense workouts and support muscle glycogen replenishment.',
    athletic_performance: 'Your primary training fuel. Time carb-rich meals around exercise for peak performance.',
  },
  'fat': {
    weight_loss: 'Calorie-dense (9 cal/g) -- moderate intake, but don\'t eliminate. Needed for hormones.',
    muscle_building: 'Supports testosterone production. Include healthy fat sources daily.',
  },
  'fiber': {
    weight_loss: 'Your best friend for appetite control. Aim for 25-35g daily.',
    disease_management: 'Helps manage blood sugar and cholesterol levels.',
  },
  'sodium': {
    disease_management: 'If managing blood pressure or heart health, aim for under 1500mg/day.',
    athletic_performance: 'Lost through sweat -- you may need more than sedentary individuals.',
  },
  'iron': {
    weight_loss: 'Caloric restriction can reduce iron intake. Monitor for fatigue.',
    athletic_performance: 'Intense training increases iron needs. Critical for oxygen delivery to muscles.',
  },
  'calcium': {
    weight_loss: 'Dairy calcium may support fat metabolism. Keep intake adequate during deficits.',
    athletic_performance: 'Prevents stress fractures and supports muscle contraction.',
  },
  'vitamin d': {
    muscle_building: 'Supports muscle function and may support testosterone levels.',
    disease_management: 'Supports immune function and may reduce inflammation.',
  },
  'magnesium': {
    athletic_performance: 'Commonly low in athletes. Supports recovery, sleep, and prevents cramping.',
    general_wellness: 'Supports 300+ enzyme reactions. Many people don\'t get enough.',
  },
};

/**
 * Get a nutrient description tailored to the user's goal
 */
export const getNutrientDescription = (name: string, goalText?: string): string => {
  const lowName = name.toLowerCase();
  const goalCategory = goalText ? categorizeGoal(goalText) : 'general_wellness';

  // Find base description
  let base = BASE_DESCRIPTIONS[lowName];
  if (!base) {
    // Partial match
    for (const [key, desc] of Object.entries(BASE_DESCRIPTIONS)) {
      if (lowName.includes(key) || key.includes(lowName)) {
        base = desc;
        break;
      }
    }
  }
  if (!base) {
    if (lowName.includes('vitamin b') || lowName.match(/b\d+/)) {
      base = 'B-complex vitamin that helps convert food into energy and supports nervous system function.';
    } else if (lowName.includes('vitamin')) {
      base = 'Essential vitamin that supports optimal body function and health.';
    } else {
      base = 'Important nutrient that supports your overall health.';
    }
  }

  // Add goal-specific addendum
  for (const [key, addendums] of Object.entries(GOAL_ADDENDUMS)) {
    if (lowName.includes(key)) {
      const addendum = addendums[goalCategory as GoalCategory];
      if (addendum) {
        return `${base} ${addendum}`;
      }
      break;
    }
  }

  return base;
};

/**
 * Enhanced description with DV context
 */
export const getEnhancedNutrientDescription = (nutrient: Nutrient, userGoal?: string): string => {
  const baseDescription = getNutrientDescription(nutrient.name, userGoal);
  const dv = nutrient.percentDailyValue;

  let insight = '';

  if (dv && dv > 0) {
    if (dv >= 100) {
      insight = ` This meal covers your full daily needs (${Math.round(dv)}%).`;
    } else if (dv >= 50) {
      insight = ` Good -- this meal provides ${Math.round(dv)}% of your daily target.`;
    } else if (dv >= 25) {
      insight = ` This meal contributes ${Math.round(dv)}% of your daily target.`;
    } else if (dv >= 10) {
      insight = ` Modest amount (${Math.round(dv)}% DV). Look for more sources in other meals.`;
    } else {
      insight = ` Small amount (${Math.round(dv)}% DV). Consider supplementing from other foods.`;
    }
  }

  return baseDescription + insight;
};
