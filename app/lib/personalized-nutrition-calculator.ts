// Comprehensive Personalized Nutrition Calculator
// This module provides accurate, science-based personalized nutrient evaluation

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  weight_unit?: 'kg' | 'lbs';
  height_unit?: 'cm' | 'in';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | 'athlete';
  goal?: string;
  health_conditions?: string[];
}

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
}

export interface PersonalizedNutrientEvaluation {
  personalizedDV: number;
  personalizedTarget: number;
  status: 'low' | 'adequate' | 'high' | 'excellent' | 'excessive';
  colorClass: string;
  textColorClass: string;
  recommendation: string;
  isLimitNutrient: boolean;
}

// Age-specific DRI (Dietary Reference Intakes) data
// Sources: NIH Office of Dietary Supplements, IOM Dietary Reference Intakes
const DRI_DATA: Record<string, Record<string, { male: number; female: number }>> = {
  protein: {
    // RDA in g/kg body weight per day
    '1-3': { male: 1.05, female: 1.05 },
    '4-8': { male: 0.95, female: 0.95 },
    '9-13': { male: 0.95, female: 0.95 },
    '14-18': { male: 0.85, female: 0.85 },
    '19-30': { male: 0.8, female: 0.8 },
    '31-50': { male: 0.8, female: 0.8 },
    '51-70': { male: 0.8, female: 0.8 },
    '71+': { male: 0.8, female: 0.8 }
  },
  calcium: {
    // RDA in mg per day
    '1-3': { male: 700, female: 700 },
    '4-8': { male: 1000, female: 1000 },
    '9-13': { male: 1300, female: 1300 },
    '14-18': { male: 1300, female: 1300 },
    '19-30': { male: 1000, female: 1000 },
    '31-50': { male: 1000, female: 1000 },
    '51-70': { male: 1000, female: 1200 },
    '71+': { male: 1200, female: 1200 }
  },
  iron: {
    // RDA in mg per day
    '1-3': { male: 7, female: 7 },
    '4-8': { male: 10, female: 10 },
    '9-13': { male: 8, female: 8 },
    '14-18': { male: 11, female: 15 },
    '19-30': { male: 8, female: 18 },
    '31-50': { male: 8, female: 18 },
    '51-70': { male: 8, female: 8 },
    '71+': { male: 8, female: 8 }
  },
  vitamin_c: {
    // RDA in mg per day
    '1-3': { male: 15, female: 15 },
    '4-8': { male: 25, female: 25 },
    '9-13': { male: 45, female: 45 },
    '14-18': { male: 75, female: 65 },
    '19-30': { male: 90, female: 75 },
    '31-50': { male: 90, female: 75 },
    '51-70': { male: 90, female: 75 },
    '71+': { male: 90, female: 75 }
  },
  fiber: {
    // AI (Adequate Intake) in g per day
    '1-3': { male: 19, female: 19 },
    '4-8': { male: 25, female: 25 },
    '9-13': { male: 31, female: 26 },
    '14-18': { male: 38, female: 26 },
    '19-30': { male: 38, female: 25 },
    '31-50': { male: 38, female: 25 },
    '51-70': { male: 30, female: 21 },
    '71+': { male: 30, female: 21 }
  },
  vitamin_d: {
    // RDA in mcg per day
    '1-3': { male: 15, female: 15 },
    '4-8': { male: 15, female: 15 },
    '9-13': { male: 15, female: 15 },
    '14-18': { male: 15, female: 15 },
    '19-30': { male: 15, female: 15 },
    '31-50': { male: 15, female: 15 },
    '51-70': { male: 15, female: 15 },
    '71+': { male: 20, female: 20 }
  },
  vitamin_a: {
    // RDA in mcg RAE per day
    '1-3': { male: 300, female: 300 },
    '4-8': { male: 400, female: 400 },
    '9-13': { male: 600, female: 600 },
    '14-18': { male: 900, female: 700 },
    '19-30': { male: 900, female: 700 },
    '31-50': { male: 900, female: 700 },
    '51-70': { male: 900, female: 700 },
    '71+': { male: 900, female: 700 }
  },
  vitamin_e: {
    // RDA in mg per day
    '1-3': { male: 6, female: 6 },
    '4-8': { male: 7, female: 7 },
    '9-13': { male: 11, female: 11 },
    '14-18': { male: 15, female: 15 },
    '19-30': { male: 15, female: 15 },
    '31-50': { male: 15, female: 15 },
    '51-70': { male: 15, female: 15 },
    '71+': { male: 15, female: 15 }
  },
  vitamin_k: {
    // AI in mcg per day
    '1-3': { male: 30, female: 30 },
    '4-8': { male: 55, female: 55 },
    '9-13': { male: 60, female: 60 },
    '14-18': { male: 75, female: 75 },
    '19-30': { male: 120, female: 90 },
    '31-50': { male: 120, female: 90 },
    '51-70': { male: 120, female: 90 },
    '71+': { male: 120, female: 90 }
  },
  vitamin_b1: {
    // RDA in mg per day (Thiamine)
    '1-3': { male: 0.5, female: 0.5 },
    '4-8': { male: 0.6, female: 0.6 },
    '9-13': { male: 0.9, female: 0.9 },
    '14-18': { male: 1.2, female: 1.0 },
    '19-30': { male: 1.2, female: 1.1 },
    '31-50': { male: 1.2, female: 1.1 },
    '51-70': { male: 1.2, female: 1.1 },
    '71+': { male: 1.2, female: 1.1 }
  },
  vitamin_b2: {
    // RDA in mg per day (Riboflavin)
    '1-3': { male: 0.5, female: 0.5 },
    '4-8': { male: 0.6, female: 0.6 },
    '9-13': { male: 0.9, female: 0.9 },
    '14-18': { male: 1.3, female: 1.0 },
    '19-30': { male: 1.3, female: 1.1 },
    '31-50': { male: 1.3, female: 1.1 },
    '51-70': { male: 1.3, female: 1.1 },
    '71+': { male: 1.3, female: 1.1 }
  },
  vitamin_b3: {
    // RDA in mg per day (Niacin)
    '1-3': { male: 6, female: 6 },
    '4-8': { male: 8, female: 8 },
    '9-13': { male: 12, female: 12 },
    '14-18': { male: 16, female: 14 },
    '19-30': { male: 16, female: 14 },
    '31-50': { male: 16, female: 14 },
    '51-70': { male: 16, female: 14 },
    '71+': { male: 16, female: 14 }
  },
  vitamin_b5: {
    // AI in mg per day (Pantothenic Acid)
    '1-3': { male: 2, female: 2 },
    '4-8': { male: 3, female: 3 },
    '9-13': { male: 4, female: 4 },
    '14-18': { male: 5, female: 5 },
    '19-30': { male: 5, female: 5 },
    '31-50': { male: 5, female: 5 },
    '51-70': { male: 5, female: 5 },
    '71+': { male: 5, female: 5 }
  },
  vitamin_b6: {
    // RDA in mg per day
    '1-3': { male: 0.5, female: 0.5 },
    '4-8': { male: 0.6, female: 0.6 },
    '9-13': { male: 1.0, female: 1.0 },
    '14-18': { male: 1.3, female: 1.2 },
    '19-30': { male: 1.3, female: 1.3 },
    '31-50': { male: 1.3, female: 1.3 },
    '51-70': { male: 1.7, female: 1.5 },
    '71+': { male: 1.7, female: 1.5 }
  },
  vitamin_b12: {
    // RDA in mcg per day
    '1-3': { male: 0.9, female: 0.9 },
    '4-8': { male: 1.2, female: 1.2 },
    '9-13': { male: 1.8, female: 1.8 },
    '14-18': { male: 2.4, female: 2.4 },
    '19-30': { male: 2.4, female: 2.4 },
    '31-50': { male: 2.4, female: 2.4 },
    '51-70': { male: 2.4, female: 2.4 },
    '71+': { male: 2.4, female: 2.4 }
  },
  folate: {
    // RDA in mcg DFE per day
    '1-3': { male: 150, female: 150 },
    '4-8': { male: 200, female: 200 },
    '9-13': { male: 300, female: 300 },
    '14-18': { male: 400, female: 400 },
    '19-30': { male: 400, female: 400 },
    '31-50': { male: 400, female: 400 },
    '51-70': { male: 400, female: 400 },
    '71+': { male: 400, female: 400 }
  },
  magnesium: {
    // RDA in mg per day
    '1-3': { male: 80, female: 80 },
    '4-8': { male: 130, female: 130 },
    '9-13': { male: 240, female: 240 },
    '14-18': { male: 410, female: 360 },
    '19-30': { male: 400, female: 310 },
    '31-50': { male: 420, female: 320 },
    '51-70': { male: 420, female: 320 },
    '71+': { male: 420, female: 320 }
  },
  zinc: {
    // RDA in mg per day
    '1-3': { male: 3, female: 3 },
    '4-8': { male: 5, female: 5 },
    '9-13': { male: 8, female: 8 },
    '14-18': { male: 11, female: 9 },
    '19-30': { male: 11, female: 8 },
    '31-50': { male: 11, female: 8 },
    '51-70': { male: 11, female: 8 },
    '71+': { male: 11, female: 8 }
  },
  potassium: {
    // AI in mg per day
    '1-3': { male: 2000, female: 2000 },
    '4-8': { male: 2300, female: 2300 },
    '9-13': { male: 2500, female: 2300 },
    '14-18': { male: 3000, female: 2300 },
    '19-30': { male: 3400, female: 2600 },
    '31-50': { male: 3400, female: 2600 },
    '51-70': { male: 3400, female: 2600 },
    '71+': { male: 3400, female: 2600 }
  },
  selenium: {
    // RDA in mcg per day
    '1-3': { male: 20, female: 20 },
    '4-8': { male: 30, female: 30 },
    '9-13': { male: 40, female: 40 },
    '14-18': { male: 55, female: 55 },
    '19-30': { male: 55, female: 55 },
    '31-50': { male: 55, female: 55 },
    '51-70': { male: 55, female: 55 },
    '71+': { male: 55, female: 55 }
  },
  phosphorus: {
    // RDA in mg per day
    '1-3': { male: 460, female: 460 },
    '4-8': { male: 500, female: 500 },
    '9-13': { male: 1250, female: 1250 },
    '14-18': { male: 1250, female: 1250 },
    '19-30': { male: 700, female: 700 },
    '31-50': { male: 700, female: 700 },
    '51-70': { male: 700, female: 700 },
    '71+': { male: 700, female: 700 }
  },
  copper: {
    // RDA in mg per day
    '1-3': { male: 0.34, female: 0.34 },
    '4-8': { male: 0.44, female: 0.44 },
    '9-13': { male: 0.7, female: 0.7 },
    '14-18': { male: 0.89, female: 0.89 },
    '19-30': { male: 0.9, female: 0.9 },
    '31-50': { male: 0.9, female: 0.9 },
    '51-70': { male: 0.9, female: 0.9 },
    '71+': { male: 0.9, female: 0.9 }
  },
  manganese: {
    // AI in mg per day
    '1-3': { male: 1.2, female: 1.2 },
    '4-8': { male: 1.5, female: 1.5 },
    '9-13': { male: 1.9, female: 1.6 },
    '14-18': { male: 2.2, female: 1.6 },
    '19-30': { male: 2.3, female: 1.8 },
    '31-50': { male: 2.3, female: 1.8 },
    '51-70': { male: 2.3, female: 1.8 },
    '71+': { male: 2.3, female: 1.8 }
  },
  iodine: {
    // RDA in mcg per day
    '1-3': { male: 90, female: 90 },
    '4-8': { male: 90, female: 90 },
    '9-13': { male: 120, female: 120 },
    '14-18': { male: 150, female: 150 },
    '19-30': { male: 150, female: 150 },
    '31-50': { male: 150, female: 150 },
    '51-70': { male: 150, female: 150 },
    '71+': { male: 150, female: 150 }
  },
  chromium: {
    // AI in mcg per day
    '1-3': { male: 11, female: 11 },
    '4-8': { male: 15, female: 15 },
    '9-13': { male: 25, female: 21 },
    '14-18': { male: 35, female: 24 },
    '19-30': { male: 35, female: 25 },
    '31-50': { male: 35, female: 25 },
    '51-70': { male: 30, female: 20 },
    '71+': { male: 30, female: 20 }
  },
  molybdenum: {
    // RDA in mcg per day
    '1-3': { male: 17, female: 17 },
    '4-8': { male: 22, female: 22 },
    '9-13': { male: 34, female: 34 },
    '14-18': { male: 43, female: 43 },
    '19-30': { male: 45, female: 45 },
    '31-50': { male: 45, female: 45 },
    '51-70': { male: 45, female: 45 },
    '71+': { male: 45, female: 45 }
  },
  sodium: {
    // UL (Upper Limit) in mg per day
    '1-3': { male: 1500, female: 1500 },
    '4-8': { male: 1900, female: 1900 },
    '9-13': { male: 2200, female: 2200 },
    '14-18': { male: 2300, female: 2300 },
    '19-30': { male: 2300, female: 2300 },
    '31-50': { male: 2300, female: 2300 },
    '51-70': { male: 2300, female: 2300 },
    '71+': { male: 2300, female: 2300 }
  },
};

// Activity-level nutrient multipliers for nutrients that scale with physical demand
const ACTIVITY_NUTRIENT_MULTIPLIERS: Record<string, Record<string, number>> = {
  // Athletes need more of these nutrients due to sweat losses, energy metabolism, tissue repair
  sedentary:   { magnesium: 1.0, zinc: 1.0, b_vitamins: 1.0, potassium: 1.0, iron: 1.0, vitamin_c: 1.0, vitamin_e: 1.0 },
  light:       { magnesium: 1.0, zinc: 1.0, b_vitamins: 1.0, potassium: 1.0, iron: 1.0, vitamin_c: 1.0, vitamin_e: 1.0 },
  moderate:    { magnesium: 1.05, zinc: 1.0, b_vitamins: 1.05, potassium: 1.05, iron: 1.0, vitamin_c: 1.05, vitamin_e: 1.0 },
  active:      { magnesium: 1.1, zinc: 1.05, b_vitamins: 1.1, potassium: 1.1, iron: 1.1, vitamin_c: 1.1, vitamin_e: 1.05 },
  very_active: { magnesium: 1.15, zinc: 1.1, b_vitamins: 1.15, potassium: 1.15, iron: 1.15, vitamin_c: 1.15, vitamin_e: 1.1 },
  athlete:     { magnesium: 1.2, zinc: 1.15, b_vitamins: 1.2, potassium: 1.2, iron: 1.2, vitamin_c: 1.2, vitamin_e: 1.15 },
};

// Goal-specific nutrient adjustments (multipliers applied on top of DRI)
const GOAL_NUTRIENT_ADJUSTMENTS: Record<string, Record<string, number>> = {
  muscle_building: { protein: 1.3, zinc: 1.1, magnesium: 1.1, vitamin_d: 1.1, calcium: 1.05 },
  weight_loss:     { protein: 1.2, fiber: 1.2, vitamin_d: 1.0, iron: 1.0 },
  athletic_performance: { protein: 1.2, magnesium: 1.1, potassium: 1.1, iron: 1.1, b_vitamins: 1.1 },
  longevity:       { vitamin_c: 1.2, vitamin_e: 1.2, selenium: 1.1, vitamin_d: 1.1, omega3: 1.3 },
  heart_health:    { potassium: 1.15, magnesium: 1.1, fiber: 1.15, omega3: 1.3, sodium: 0.65 },
  disease_management: { vitamin_d: 1.15, vitamin_c: 1.1, zinc: 1.1, selenium: 1.1 },
  general_wellness: {},
};

// Activity level multipliers for energy and specific nutrients
const ACTIVITY_MULTIPLIERS: Record<string, { energy: number; protein: number; carbs: number }> = {
  sedentary: { energy: 1.2, protein: 1.0, carbs: 1.0 },
  light: { energy: 1.375, protein: 1.1, carbs: 1.1 },
  moderate: { energy: 1.55, protein: 1.2, carbs: 1.2 },
  active: { energy: 1.725, protein: 1.4, carbs: 1.4 },
  very_active: { energy: 1.9, protein: 1.6, carbs: 1.6 },
  athlete: { energy: 2.0, protein: 1.8, carbs: 1.8 }
};

// Nutrients that should be limited (not maximized)
const LIMIT_NUTRIENTS = [
  'sodium', 'saturated fat', 'trans fat', 'cholesterol', 'added sugar', 'sugar'
];

/**
 * Normalize goal text to a standard key for lookup
 */
function normalizeGoal(goal?: string): string {
  if (!goal) return 'general_wellness';
  const g = goal.toLowerCase();
  if (g.includes('muscle') || g.includes('strength') || g.includes('bulk')) return 'muscle_building';
  if (g.includes('weight loss') || g.includes('lose') || g.includes('cut')) return 'weight_loss';
  if (g.includes('athletic') || g.includes('performance') || g.includes('sport')) return 'athletic_performance';
  if (g.includes('longevity') || g.includes('aging') || g.includes('anti-aging')) return 'longevity';
  if (g.includes('heart') || g.includes('cardio') || g.includes('blood pressure')) return 'heart_health';
  if (g.includes('disease') || g.includes('manage') || g.includes('condition')) return 'disease_management';
  return 'general_wellness';
}

/**
 * Get age group for DRI lookup
 */
function getAgeGroup(age: number): string {
  if (age <= 3) return '1-3';
  if (age <= 8) return '4-8';
  if (age <= 13) return '9-13';
  if (age <= 18) return '14-18';
  if (age <= 30) return '19-30';
  if (age <= 50) return '31-50';
  if (age <= 70) return '51-70';
  return '71+';
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
function calculateBMR(profile: UserProfile): number {
  const { age, gender, weight, height, weight_unit = 'lbs', height_unit = 'in' } = profile;
  
  // Convert to metric
  const weightKg = weight_unit === 'lbs' ? weight * 0.453592 : weight;
  const heightCm = height_unit === 'in' ? height * 2.54 : height;
  
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 */
function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level]?.energy || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate personalized target for a specific nutrient
 */
function calculatePersonalizedTarget(nutrient: Nutrient, profile: UserProfile): number {
  const { age, gender, weight, height, weight_unit = 'lbs', activity_level, goal } = profile;
  const nutrientName = nutrient.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const ageGroup = getAgeGroup(age);
  
  // Convert weight to kg if needed
  const weightKg = weight_unit === 'lbs' ? weight * 0.453592 : weight;
  
  // Get TDEE for calorie-based calculations
  const tdee = calculateTDEE(profile);
  
  let target = 0;

  switch (nutrientName) {
    case 'protein':
      // Use DRI as base, but adjust for activity and goals
      const proteinData = DRI_DATA['protein']?.[ageGroup];
      const proteinPerKg = proteinData?.[gender] || 0.8;
      target = weightKg * proteinPerKg;
      
      // Activity adjustments
      const activityMultiplier = ACTIVITY_MULTIPLIERS[activity_level]?.protein || 1.2;
      target *= activityMultiplier;
      
      // Goal-specific adjustments
      if (goal?.toLowerCase().includes('muscle') || goal?.toLowerCase().includes('strength')) {
        target *= 1.3; // Higher for muscle building
      } else if (goal?.toLowerCase().includes('weight loss')) {
        target *= 1.2; // Higher for weight loss to preserve muscle
      }
      
      // Cap at reasonable maximums
      target = Math.min(target, weightKg * 2.2); // Max 2.2g/kg
      break;

    case 'carbohydrates':
    case 'carbs':
      // Base on TDEE and activity level
      let carbPercentage = 0.50; // 50% default
      
      if (activity_level === 'athlete' || activity_level === 'very_active') {
        carbPercentage = 0.60; // 60% for high activity
      } else if (goal?.toLowerCase().includes('weight loss')) {
        carbPercentage = 0.40; // 40% for weight loss
      } else if (goal?.toLowerCase().includes('keto') || goal?.toLowerCase().includes('low carb')) {
        carbPercentage = 0.10; // 10% for keto
      }
      
      target = (tdee * carbPercentage) / 4; // 4 calories per gram
      break;

    case 'fat':
    case 'total_fat':
      // Base on TDEE and goals
      let fatPercentage = 0.30; // 30% default
      
      if (goal?.toLowerCase().includes('keto')) {
        fatPercentage = 0.70; // 70% for keto
      } else if (goal?.toLowerCase().includes('heart health')) {
        fatPercentage = 0.25; // 25% for heart health
      }
      
      target = (tdee * fatPercentage) / 9; // 9 calories per gram
      break;

    case 'fiber':
    case 'dietary_fiber':
      const fiberData = DRI_DATA['fiber']?.[ageGroup];
      target = fiberData?.[gender] || 25;
      break;

    case 'calcium':
      const calciumData = DRI_DATA['calcium']?.[ageGroup];
      target = calciumData?.[gender] || 1000;
      break;

    case 'iron':
      const ironData = DRI_DATA['iron']?.[ageGroup];
      target = ironData?.[gender] || 8;
      break;

    case 'vitamin_c':
      const vitaminCData = DRI_DATA['vitamin_c']?.[ageGroup];
      target = vitaminCData?.[gender] || 75;
      // Athletes may need more
      if (activity_level === 'athlete' || activity_level === 'very_active') {
        target *= 1.2;
      }
      break;

    case 'sodium':
      target = 2300; // mg, upper limit
      if (goal?.toLowerCase().includes('heart') || goal?.toLowerCase().includes('blood pressure')) {
        target = 1500;
      }
      break;

    case 'saturated_fat':
      target = (tdee * 0.1) / 9;
      break;

    case 'sugar':
    case 'added_sugar':
      target = (tdee * 0.1) / 4;
      break;

    // All remaining DRI-backed nutrients — lookup from DRI_DATA with activity/goal adjustments
    case 'vitamin_d':
    case 'vitamin_a':
    case 'vitamin_e':
    case 'vitamin_k':
    case 'vitamin_b1':
    case 'vitamin_b2':
    case 'vitamin_b3':
    case 'vitamin_b5':
    case 'vitamin_b6':
    case 'vitamin_b12':
    case 'folate':
    case 'magnesium':
    case 'zinc':
    case 'potassium':
    case 'selenium':
    case 'phosphorus':
    case 'copper':
    case 'manganese':
    case 'iodine':
    case 'chromium':
    case 'molybdenum': {
      const driData = DRI_DATA[nutrientName]?.[ageGroup];
      if (driData) {
        target = driData[gender] || 0;

        // Apply activity multiplier for nutrients that scale with exercise
        const activityMults = ACTIVITY_NUTRIENT_MULTIPLIERS[activity_level];
        if (activityMults) {
          // Direct nutrient match
          if (nutrientName in activityMults) {
            target *= (activityMults as any)[nutrientName];
          }
          // B vitamins group multiplier
          if (nutrientName.startsWith('vitamin_b') || nutrientName === 'folate') {
            target *= activityMults.b_vitamins || 1.0;
          }
        }

        // Apply goal-specific adjustment
        const goalKey = normalizeGoal(goal);
        const goalAdj = GOAL_NUTRIENT_ADJUSTMENTS[goalKey];
        if (goalAdj) {
          if (nutrientName in goalAdj) {
            target *= goalAdj[nutrientName]!;
          }
          if (nutrientName.startsWith('vitamin_b') && goalAdj.b_vitamins) {
            target *= goalAdj.b_vitamins;
          }
        }
      }
      break;
    }

    default:
      return 0;
  }

  return Math.round(target * 10) / 10; // One decimal place precision
}

/**
 * Evaluate nutrient status based on personalized targets
 */
function evaluateNutrientStatus(
  amount: number,
  personalizedTarget: number,
  isLimitNutrient: boolean
): {
  status: 'low' | 'adequate' | 'high' | 'excellent' | 'excessive';
  colorClass: string;
  textColorClass: string;
  recommendation: string;
} {
  const percentage = personalizedTarget > 0 ? (amount / personalizedTarget) * 100 : 0;

  if (isLimitNutrient) {
    // For nutrients we want to limit (sodium, saturated fat, etc.)
    if (percentage >= 100) {
      return {
        status: 'excessive',
        colorClass: 'bg-red-500',
        textColorClass: 'text-red-400',
        recommendation: 'Consider reducing intake - above recommended limit'
      };
    } else if (percentage >= 75) {
      return {
        status: 'high',
        colorClass: 'bg-orange-500',
        textColorClass: 'text-orange-400',
        recommendation: 'Approaching limit - monitor intake'
      };
    } else if (percentage >= 50) {
      return {
        status: 'adequate',
        colorClass: 'bg-yellow-500',
        textColorClass: 'text-yellow-400',
        recommendation: 'Moderate level - within healthy range'
      };
    } else {
      return {
        status: 'low',
        colorClass: 'bg-green-500',
        textColorClass: 'text-green-400',
        recommendation: 'Good - well below limit'
      };
    }
  } else {
    // For beneficial nutrients (protein, vitamins, etc.)
    if (percentage >= 100) {
      return {
        status: 'excellent',
        colorClass: 'bg-green-500',
        textColorClass: 'text-green-400',
        recommendation: 'Excellent - meets or exceeds target'
      };
    } else if (percentage >= 75) {
      return {
        status: 'high',
        colorClass: 'bg-green-400',
        textColorClass: 'text-green-300',
        recommendation: 'Good - close to target'
      };
    } else if (percentage >= 50) {
      return {
        status: 'adequate',
        colorClass: 'bg-yellow-500',
        textColorClass: 'text-yellow-400',
        recommendation: 'Adequate - could be higher for optimal health'
      };
    } else if (percentage >= 25) {
      return {
        status: 'low',
        colorClass: 'bg-orange-500',
        textColorClass: 'text-orange-400',
        recommendation: 'Low - consider increasing intake'
      };
    } else {
      return {
        status: 'low',
        colorClass: 'bg-red-500',
        textColorClass: 'text-red-400',
        recommendation: 'Very low - significantly below target'
      };
    }
  }
}

/**
 * Main function to evaluate a nutrient with personalized recommendations
 */
export function calculatePersonalizedNutrientEvaluation(
  nutrient: Nutrient,
  profile: UserProfile
): PersonalizedNutrientEvaluation {
  const nutrientName = nutrient.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const isLimitNutrient = LIMIT_NUTRIENTS.some(limit => 
    nutrientName.includes(limit.replace(' ', '_'))
  );

  // Calculate personalized target
  const personalizedTarget = calculatePersonalizedTarget(nutrient, profile);
  
  // If we don't have a personalized target, fall back to API percentage
  let personalizedDV = nutrient.percentDailyValue || 0;
  
  if (personalizedTarget > 0) {
    personalizedDV = Math.round((nutrient.amount / personalizedTarget) * 100);
  }

  // Evaluate status
  const evaluation = evaluateNutrientStatus(
    nutrient.amount,
    personalizedTarget,
    isLimitNutrient
  );

  return {
    personalizedDV,
    personalizedTarget,
    isLimitNutrient,
    ...evaluation
  };
}

/**
 * Generate personalized insights for a collection of nutrients
 */
export function generatePersonalizedNutrientInsights(
  nutrients: Nutrient[],
  profile: UserProfile
): {
  excellent: string[];
  adequate: string[];
  needsAttention: string[];
  summary: string;
} {
  const excellent: string[] = [];
  const adequate: string[] = [];
  const needsAttention: string[] = [];

  nutrients.forEach(nutrient => {
    const evaluation = calculatePersonalizedNutrientEvaluation(nutrient, profile);
    
    if (evaluation.status === 'excellent' || evaluation.status === 'high') {
      excellent.push(nutrient.name);
    } else if (evaluation.status === 'adequate') {
      adequate.push(nutrient.name);
    } else {
      needsAttention.push(nutrient.name);
    }
  });

  // Generate summary
  const totalNutrients = nutrients.length;
  const excellentCount = excellent.length;
  const adequateCount = adequate.length;
  const needsAttentionCount = needsAttention.length;

  let summary = '';
  
  if (excellentCount / totalNutrients >= 0.7) {
    summary = `Excellent nutritional profile! ${excellentCount} nutrients are at optimal levels for your ${profile.age}-year-old ${profile.gender} profile with ${profile.activity_level} activity.`;
  } else if ((excellentCount + adequateCount) / totalNutrients >= 0.6) {
    summary = `Good nutritional balance overall. Focus on improving ${needsAttentionCount} nutrients that need attention.`;
  } else {
    summary = `This meal provides a foundation, but ${needsAttentionCount} nutrients could be improved to better match your personalized targets.`;
  }

  return {
    excellent,
    adequate,
    needsAttention,
    summary
  };
}

/**
 * Get ALL personalized nutrient targets for a user profile in one call.
 * Returns a map of normalized nutrient name → daily target amount.
 * Used by daily-summaries.ts for computing personalized %DV.
 */
export function getAllPersonalizedTargets(profile: UserProfile): Record<string, number> {
  const targets: Record<string, number> = {};

  // All nutrients we track, with their canonical names and units for DRI lookup
  const nutrientDefs: Array<{ key: string; name: string; unit: string }> = [
    { key: 'protein', name: 'Protein', unit: 'g' },
    { key: 'fiber', name: 'Fiber', unit: 'g' },
    { key: 'calcium', name: 'Calcium', unit: 'mg' },
    { key: 'iron', name: 'Iron', unit: 'mg' },
    { key: 'vitamin_c', name: 'Vitamin C', unit: 'mg' },
    { key: 'vitamin_d', name: 'Vitamin D', unit: 'mcg' },
    { key: 'vitamin_a', name: 'Vitamin A', unit: 'mcg' },
    { key: 'vitamin_e', name: 'Vitamin E', unit: 'mg' },
    { key: 'vitamin_k', name: 'Vitamin K', unit: 'mcg' },
    { key: 'vitamin_b1', name: 'Vitamin B1', unit: 'mg' },
    { key: 'vitamin_b2', name: 'Vitamin B2', unit: 'mg' },
    { key: 'vitamin_b3', name: 'Vitamin B3', unit: 'mg' },
    { key: 'vitamin_b5', name: 'Vitamin B5', unit: 'mg' },
    { key: 'vitamin_b6', name: 'Vitamin B6', unit: 'mg' },
    { key: 'vitamin_b12', name: 'Vitamin B12', unit: 'mcg' },
    { key: 'folate', name: 'Folate', unit: 'mcg' },
    { key: 'magnesium', name: 'Magnesium', unit: 'mg' },
    { key: 'zinc', name: 'Zinc', unit: 'mg' },
    { key: 'potassium', name: 'Potassium', unit: 'mg' },
    { key: 'selenium', name: 'Selenium', unit: 'mcg' },
    { key: 'phosphorus', name: 'Phosphorus', unit: 'mg' },
    { key: 'copper', name: 'Copper', unit: 'mg' },
    { key: 'manganese', name: 'Manganese', unit: 'mg' },
    { key: 'iodine', name: 'Iodine', unit: 'mcg' },
    { key: 'chromium', name: 'Chromium', unit: 'mcg' },
    { key: 'molybdenum', name: 'Molybdenum', unit: 'mcg' },
    { key: 'sodium', name: 'Sodium', unit: 'mg' },
  ];

  for (const def of nutrientDefs) {
    const target = calculatePersonalizedTarget(
      { name: def.key, amount: 0, unit: def.unit },
      profile
    );
    if (target > 0) {
      targets[def.key] = target;
    }
  }

  // Also add TDEE for calorie-based comparisons
  targets.calories = calculateTDEE(profile);

  return targets;
}
