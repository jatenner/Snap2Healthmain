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
  'vitamin_c': {
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
    // AI in g per day
    '1-3': { male: 19, female: 19 },
    '4-8': { male: 25, female: 25 },
    '9-13': { male: 31, female: 26 },
    '14-18': { male: 38, female: 26 },
    '19-30': { male: 38, female: 25 },
    '31-50': { male: 38, female: 25 },
    '51-70': { male: 30, female: 21 },
    '71+': { male: 30, female: 21 }
  }
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
  const nutrientName = nutrient.name.toLowerCase().replace(/[^a-z]/g, '_');
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
      // Lower for certain goals
      if (goal?.toLowerCase().includes('heart') || goal?.toLowerCase().includes('blood pressure')) {
        target = 1500;
      }
      break;

    case 'saturated_fat':
      // <10% of calories
      target = (tdee * 0.1) / 9; // 9 calories per gram of fat
      break;

    case 'sugar':
    case 'added_sugar':
      // <10% of calories (WHO recommendation)
      target = (tdee * 0.1) / 4; // 4 calories per gram of sugar
      break;

    default:
      // For nutrients not specifically handled, return 0 to use API value
      return 0;
  }

  return Math.round(target);
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
  const nutrientName = nutrient.name.toLowerCase().replace(/[^a-z]/g, '_');
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
