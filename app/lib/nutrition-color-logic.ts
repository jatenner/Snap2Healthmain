// Consistent Nutrition Color Logic
// This module provides scientifically-based color coding for nutrients

export interface NutrientColorEvaluation {
  colorClass: string;
  statusLabel: string;
  bgColor: string;
  textColorClass: string;
  recommendation: string;
}

// Nutrients that should be limited (not maximized)
const LIMIT_NUTRIENTS = [
  'sodium', 'saturated fat', 'trans fat', 'cholesterol', 'added sugar', 'sugar'
];

/**
 * Determine if a nutrient should be limited rather than maximized
 */
function isLimitNutrient(nutrientName: string): boolean {
  const name = nutrientName.toLowerCase();
  return LIMIT_NUTRIENTS.some(limit => name.includes(limit));
}

/**
 * Get consistent color coding for any nutrient based on its daily value percentage
 */
export function getNutrientColorEvaluation(
  nutrientName: string, 
  percentDailyValue: number
): NutrientColorEvaluation {
  const isLimit = isLimitNutrient(nutrientName);
  
  if (isLimit) {
    // For limit nutrients (sodium, sugar, etc.), high values are bad
    if (percentDailyValue >= 75) {
      return {
        colorClass: 'bg-red-500',
        statusLabel: 'High',
        bgColor: 'bg-red-900/20 border-red-500/30',
        textColorClass: 'text-red-400',
        recommendation: 'Consider reducing intake - above recommended limit'
      };
    } else if (percentDailyValue >= 40) {
      return {
        colorClass: 'bg-orange-500',
        statusLabel: 'Moderate',
        bgColor: 'bg-orange-900/20 border-orange-500/30',
        textColorClass: 'text-orange-400',
        recommendation: 'Approaching limit - monitor intake'
      };
    } else if (percentDailyValue >= 20) {
      return {
        colorClass: 'bg-yellow-500',
        statusLabel: 'Moderate',
        bgColor: 'bg-yellow-900/20 border-yellow-500/30',
        textColorClass: 'text-yellow-400',
        recommendation: 'Moderate level - within healthy range'
      };
    } else {
      return {
        colorClass: 'bg-green-500',
        statusLabel: 'Good',
        bgColor: 'bg-green-900/20 border-green-500/30',
        textColorClass: 'text-green-400',
        recommendation: 'Good - well below limit'
      };
    }
  } else {
    // For beneficial nutrients (protein, vitamins, etc.), higher values are better
    if (percentDailyValue >= 100) {
      return {
        colorClass: 'bg-green-500',
        statusLabel: 'Excellent',
        bgColor: 'bg-green-900/20 border-green-500/30',
        textColorClass: 'text-green-400',
        recommendation: 'Excellent - meets or exceeds target'
      };
    } else if (percentDailyValue >= 50) {
      return {
        colorClass: 'bg-green-400',
        statusLabel: 'Good',
        bgColor: 'bg-green-900/20 border-green-500/30',
        textColorClass: 'text-green-300',
        recommendation: 'Good - substantial contribution'
      };
    } else if (percentDailyValue >= 25) {
      return {
        colorClass: 'bg-yellow-500',
        statusLabel: 'Adequate',
        bgColor: 'bg-yellow-900/20 border-yellow-500/30',
        textColorClass: 'text-yellow-400',
        recommendation: 'Adequate - could be higher for optimal health'
      };
    } else if (percentDailyValue >= 10) {
      return {
        colorClass: 'bg-orange-500',
        statusLabel: 'Low',
        bgColor: 'bg-orange-900/20 border-orange-500/30',
        textColorClass: 'text-orange-400',
        recommendation: 'Low - consider increasing intake'
      };
    } else if (percentDailyValue > 0) {
      return {
        colorClass: 'bg-red-500',
        statusLabel: 'Very Low',
        bgColor: 'bg-red-900/20 border-red-500/30',
        textColorClass: 'text-red-400',
        recommendation: 'Very low - significantly below target'
      };
    } else {
      return {
        colorClass: 'bg-gray-500',
        statusLabel: 'Unknown',
        bgColor: 'bg-white/5 border-white/10',
        textColorClass: 'text-gray-400',
        recommendation: 'Data not available'
      };
    }
  }
}

/**
 * Get just the color class for quick usage
 */
export function getNutrientColorClass(nutrientName: string, percentDailyValue: number): string {
  return getNutrientColorEvaluation(nutrientName, percentDailyValue).colorClass;
}

/**
 * Get status label for a nutrient
 */
export function getNutrientStatusLabel(nutrientName: string, percentDailyValue: number): string {
  return getNutrientColorEvaluation(nutrientName, percentDailyValue).statusLabel;
}

/**
 * Special handling for macronutrients that don't have standard daily value percentages
 */
export function getMacronutrientColorClass(nutrientName: string, percentDailyValue: number): string {
  const name = nutrientName.toLowerCase();
  
  if (name.includes('protein')) {
    if (percentDailyValue >= 25) return 'bg-green-500';
    if (percentDailyValue >= 15) return 'bg-yellow-500';
    return 'bg-red-500';
  } else if (name.includes('saturated')) {
    if (percentDailyValue >= 75) return 'bg-red-500';
    if (percentDailyValue >= 50) return 'bg-orange-500';
    if (percentDailyValue >= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  } else if (name.includes('sodium')) {
    if (percentDailyValue >= 75) return 'bg-red-500';
    if (percentDailyValue >= 50) return 'bg-orange-500';
    if (percentDailyValue >= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  } else if (name.includes('fiber')) {
    if (percentDailyValue >= 25) return 'bg-green-500';
    if (percentDailyValue >= 15) return 'bg-yellow-500';
    return 'bg-red-500';
  } else if (name.includes('carb')) {
    if (percentDailyValue >= 20) return 'bg-green-500';
    if (percentDailyValue >= 10) return 'bg-yellow-500';
    return 'bg-orange-500';
  } else if (name.includes('fat')) {
    if (percentDailyValue >= 20 && percentDailyValue <= 35) return 'bg-green-500';
    if (percentDailyValue >= 15 || percentDailyValue <= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  }
  
  return 'bg-gray-500';
} 