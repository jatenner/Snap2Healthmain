/**
 * Food Confidence — Improves meal estimate reliability scoring.
 *
 * Applies domain-specific adjustments to the base confidence score
 * from nutrition-validation.ts based on food type complexity.
 */

interface FoodConfidenceInput {
  baseConfidence: number;        // from nutrition-validation.ts (0-100)
  mealName?: string;
  foods?: string[];
  ingredients?: string[];
  calories: number;
  consumptionType?: string;      // meal, drink, supplement, snack, etc.
  macronutrients?: Array<{ name: string; amount: number }>;
}

export interface FoodConfidenceResult {
  adjustedConfidence: number;    // 0-100
  adjustments: string[];         // human-readable explanations
}

// Simple foods are more reliably estimated by vision models
const SIMPLE_FOOD_PATTERNS = [
  /banana/i, /apple/i, /egg/i, /rice/i, /bread/i, /chicken breast/i,
  /salmon/i, /broccoli/i, /oatmeal/i, /yogurt/i, /milk/i, /orange/i,
  /steak/i, /potato/i, /avocado/i, /almonds/i, /blueberr/i,
];

// Mixed/complex dishes are harder to estimate accurately
const COMPLEX_FOOD_PATTERNS = [
  /casserole/i, /stew/i, /soup/i, /curry/i, /stir.?fry/i,
  /wrap/i, /burrito/i, /sandwich/i, /pizza/i, /pasta.*sauce/i,
  /mixed.*plate/i, /buffet/i, /combo/i, /mystery/i,
];

export function adjustFoodConfidence(input: FoodConfidenceInput): FoodConfidenceResult {
  let confidence = input.baseConfidence;
  const adjustments: string[] = [];

  const allFoods = [
    input.mealName || '',
    ...(input.foods || []),
    ...(input.ingredients || []),
  ].join(' ');

  // Boost for simple, identifiable foods
  const simpleMatches = SIMPLE_FOOD_PATTERNS.filter(p => p.test(allFoods)).length;
  if (simpleMatches >= 2) {
    confidence += 5;
    adjustments.push(`+5: multiple simple foods identified (${simpleMatches})`);
  } else if (simpleMatches === 1) {
    confidence += 3;
    adjustments.push('+3: simple food identified');
  }

  // Penalty for complex mixed dishes
  const complexMatches = COMPLEX_FOOD_PATTERNS.filter(p => p.test(allFoods)).length;
  if (complexMatches > 0) {
    confidence -= 8;
    adjustments.push(`-8: complex/mixed dish (harder to estimate portions)`);
  }

  // Boost for supplements (usually well-defined amounts)
  if (input.consumptionType === 'supplement') {
    confidence += 10;
    adjustments.push('+10: supplement (defined serving size)');
  }

  // Boost for drinks (usually standard serving sizes)
  if (input.consumptionType === 'drink' || input.consumptionType === 'beverage') {
    confidence += 5;
    adjustments.push('+5: beverage (standard serving)');
  }

  // Penalty for very high calorie meals (portion estimation harder)
  if (input.calories > 1200) {
    confidence -= 5;
    adjustments.push('-5: high calorie meal (portion estimation less reliable)');
  }

  // Penalty for no identified foods
  if (!input.foods?.length && !input.ingredients?.length) {
    confidence -= 10;
    adjustments.push('-10: no specific foods identified');
  }

  // Boost for many identified ingredients (more specific = more accurate)
  if ((input.ingredients?.length || 0) >= 5) {
    confidence += 3;
    adjustments.push('+3: detailed ingredient list');
  }

  return {
    adjustedConfidence: Math.max(0, Math.min(100, Math.round(confidence))),
    adjustments,
  };
}
