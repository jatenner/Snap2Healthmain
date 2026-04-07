/**
 * Nutrition Validation Module
 *
 * Validates GPT-4o nutrition estimates before storage.
 * Catches impossible values, checks internal consistency, assigns confidence score.
 *
 * This is the gate between untrusted LLM output and trusted storage.
 */

export interface ValidationFlag {
  field: string;
  type: 'bounds' | 'consistency' | 'impossible' | 'missing';
  severity: 'error' | 'warning' | 'info';
  message: string;
  originalValue?: number;
  correctedValue?: number;
}

export interface NutritionValidationResult {
  isValid: boolean;
  confidenceScore: number;  // 0-100
  flags: ValidationFlag[];
}

// Per-meal bounds (single meal, not daily totals)
const BOUNDS: Record<string, { min: number; max: number }> = {
  calories:  { min: 0, max: 3000 },
  protein:   { min: 0, max: 200 },
  carbs:     { min: 0, max: 400 },
  fat:       { min: 0, max: 200 },
  fiber:     { min: 0, max: 80 },
  sugar:     { min: 0, max: 200 },
  sodium:    { min: 0, max: 8000 },
  caffeine:  { min: 0, max: 1000 },
  alcohol:   { min: 0, max: 100 },
};

/**
 * Validate a parsed GPT-4o nutrition analysis result.
 * Call this BEFORE storing to the meals table.
 */
export function validateNutritionEstimate(analysis: any): NutritionValidationResult {
  const flags: ValidationFlag[] = [];
  let confidence = 100;

  if (!analysis || typeof analysis !== 'object') {
    return { isValid: false, confidenceScore: 0, flags: [{ field: 'analysis', type: 'missing', severity: 'error', message: 'No analysis data' }] };
  }

  const calories = Number(analysis.calories) || 0;
  const protein = Number(analysis.protein) || 0;
  const carbs = Number(analysis.carbs) || 0;
  const fat = Number(analysis.fat) || 0;

  // --- Bounds checks on top-level macros ---
  for (const [field, bounds] of Object.entries(BOUNDS)) {
    const value = Number(analysis[field]);
    if (value !== undefined && value !== null && !isNaN(value)) {
      if (value < bounds.min) {
        flags.push({ field, type: 'bounds', severity: 'warning', message: `${field} is negative (${value})`, originalValue: value, correctedValue: bounds.min });
        confidence -= 5;
      } else if (value > bounds.max) {
        flags.push({ field, type: 'bounds', severity: 'warning', message: `${field} exceeds maximum (${value} > ${bounds.max})`, originalValue: value, correctedValue: bounds.max });
        confidence -= 10;
      }
    }
  }

  // Also check macronutrients array for caffeine/alcohol/fiber/sugar/sodium bounds
  if (Array.isArray(analysis.macronutrients)) {
    for (const macro of analysis.macronutrients) {
      const name = (macro.name || '').toLowerCase();
      const amount = Number(macro.amount) || 0;
      if (amount < 0) {
        flags.push({ field: name, type: 'bounds', severity: 'warning', message: `${macro.name} is negative (${amount})`, originalValue: amount, correctedValue: 0 });
        confidence -= 5;
      }
    }
  }

  // --- Macro-calorie consistency check ---
  if (calories > 0 && (protein > 0 || carbs > 0 || fat > 0)) {
    // Find alcohol grams from macronutrients array
    let alcoholGrams = 0;
    if (Array.isArray(analysis.macronutrients)) {
      for (const m of analysis.macronutrients) {
        if ((m.name || '').toLowerCase().includes('alcohol')) {
          alcoholGrams = Number(m.amount) || 0;
        }
      }
    }

    const expectedCalories = (protein * 4) + (carbs * 4) + (fat * 9) + (alcoholGrams * 7);
    if (expectedCalories > 0) {
      const ratio = calories / expectedCalories;
      if (ratio < 0.6 || ratio > 1.5) {
        flags.push({
          field: 'calories',
          type: 'consistency',
          severity: 'warning',
          message: `Reported ${calories} kcal but macros sum to ~${Math.round(expectedCalories)} kcal (ratio: ${ratio.toFixed(2)})`,
          originalValue: calories,
        });
        confidence -= 15;
      } else if (ratio < 0.8 || ratio > 1.2) {
        flags.push({
          field: 'calories',
          type: 'consistency',
          severity: 'info',
          message: `Minor calorie-macro mismatch: reported ${calories} vs computed ${Math.round(expectedCalories)}`,
          originalValue: calories,
        });
        confidence -= 5;
      }
    }
  }

  // --- Impossible value detection ---
  if (protein > 0 && calories > 0 && (protein * 4) > calories * 1.1) {
    flags.push({ field: 'protein', type: 'impossible', severity: 'error', message: `Protein calories (${protein * 4}) exceed total calories (${calories})` });
    confidence -= 20;
  }
  if (fat > 0 && calories > 0 && (fat * 9) > calories * 1.1) {
    flags.push({ field: 'fat', type: 'impossible', severity: 'error', message: `Fat calories (${fat * 9}) exceed total calories (${calories})` });
    confidence -= 20;
  }
  if (calories === 0 && (protein > 1 || carbs > 1 || fat > 1)) {
    flags.push({ field: 'calories', type: 'impossible', severity: 'error', message: 'Zero calories with non-zero macros' });
    confidence -= 15;
  }

  // --- Micronutrient extreme check ---
  if (Array.isArray(analysis.micronutrients)) {
    for (const micro of analysis.micronutrients) {
      const dv = Number(micro.percentDailyValue) || 0;
      if (dv > 500) {
        flags.push({ field: micro.name, type: 'bounds', severity: 'warning', message: `${micro.name} at ${dv}% DV seems extremely high for a single meal` });
        confidence -= 5;
      }
    }
  }

  // --- Missing critical data ---
  if (!analysis.mealName && !analysis.foods?.length) {
    flags.push({ field: 'identification', type: 'missing', severity: 'info', message: 'No food items identified' });
    confidence -= 10;
  }

  confidence = Math.max(0, Math.min(100, confidence));
  const hasErrors = flags.some(f => f.severity === 'error');

  return {
    isValid: confidence >= 25 && !hasErrors,
    confidenceScore: confidence,
    flags,
  };
}
