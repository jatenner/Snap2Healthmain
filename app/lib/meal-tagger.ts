// Meal tagging system: classifies meals based on nutritional content and timing
// Tags are stored in meal_tags column and used by the analytics engine

export interface MealTagInput {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macronutrients?: Array<{ name: string; amount: number; unit?: string }>;
  micronutrients?: Array<{ name: string; amount: number; unit?: string }>;
  mealTime: Date;
  ingredients?: string[];
  consumptionType?: string; // 'meal' | 'beverage' | 'supplement' | 'snack'
}

export function generateMealTags(meal: MealTagInput): string[] {
  const tags: string[] = [];
  const { calories, protein, carbs, fat, mealTime } = meal;
  const hour = mealTime.getHours();

  // Macro ratio tags (as % of total calories)
  const totalMacroCals = (protein * 4) + (carbs * 4) + (fat * 9);
  if (totalMacroCals > 0) {
    const carbPct = (carbs * 4) / totalMacroCals;
    const proteinPct = (protein * 4) / totalMacroCals;
    const fatPct = (fat * 9) / totalMacroCals;

    if (carbPct > 0.55) tags.push('high_carb');
    if (proteinPct > 0.35) tags.push('high_protein');
    if (fatPct > 0.45) tags.push('high_fat');
    if (proteinPct < 0.15) tags.push('low_protein');
  }

  // Absolute thresholds
  if (protein >= 30) tags.push('protein_rich');
  if (calories > 800) tags.push('large_meal');
  if (calories < 200 && calories > 0) tags.push('light_meal');

  // Extract fiber, sugar, sodium from macronutrients
  let fiber = 0, sugar = 0, sodium = 0;
  if (Array.isArray(meal.macronutrients)) {
    for (const m of meal.macronutrients) {
      const name = (m.name || '').toLowerCase();
      if (name.includes('fiber')) fiber = m.amount || 0;
      if (name.includes('sugar')) sugar = m.amount || 0;
      if (name.includes('sodium')) sodium = m.amount || 0;
    }
  }

  if (sugar > 25) tags.push('high_sugar');
  if (sugar > 50) tags.push('very_high_sugar');
  if (sodium > 800) tags.push('high_sodium');
  if (fiber >= 8) tags.push('high_fiber');

  // Timing tags
  if (hour >= 21) tags.push('late_night');
  if (hour >= 22 || hour < 5) tags.push('very_late');
  if (hour >= 5 && hour < 10) tags.push('breakfast');
  if (hour >= 11 && hour < 14) tags.push('lunch');
  if (hour >= 17 && hour < 21) tags.push('dinner');
  if (hour >= 14 && hour < 17) tags.push('afternoon_snack');

  // Sleep risk: late + high carb/sugar/large meal
  if (hour >= 20 && (sugar > 20 || carbs > 60 || calories > 700)) {
    tags.push('sleep_risk');
  }

  // Recovery supportive: high protein + moderate carbs + good micros
  const hasAntiInflammatory = checkAntiInflammatory(meal);
  if (protein >= 25 && carbs >= 20 && hasAntiInflammatory) {
    tags.push('recovery_supportive');
  }

  // Ultra-processed indicators
  if (isLikelyProcessed(meal.ingredients)) {
    tags.push('ultra_processed');
  }

  // Post-workout friendly: high protein + moderate-high carbs
  if (protein >= 20 && carbs >= 30) {
    tags.push('post_workout_friendly');
  }

  // Micronutrient-rich
  const microCount = countSignificantMicros(meal.micronutrients);
  if (microCount >= 5) tags.push('nutrient_dense');

  // Consumption type tags
  if (meal.consumptionType === 'beverage') tags.push('beverage');
  if (meal.consumptionType === 'supplement') tags.push('supplement');

  // Caffeine tracking (from macronutrients where we store caffeine)
  let caffeine = 0;
  if (Array.isArray(meal.macronutrients)) {
    for (const m of meal.macronutrients) {
      if ((m.name || '').toLowerCase().includes('caffeine')) caffeine = m.amount || 0;
    }
  }
  if (caffeine > 0) tags.push('contains_caffeine');
  if (caffeine >= 150) tags.push('high_caffeine');
  if (caffeine > 0 && hour >= 14) tags.push('afternoon_caffeine');
  if (caffeine > 0 && hour >= 18) tags.push('evening_caffeine');

  // Alcohol tracking
  let alcohol = 0;
  if (Array.isArray(meal.macronutrients)) {
    for (const m of meal.macronutrients) {
      if ((m.name || '').toLowerCase().includes('alcohol')) alcohol = m.amount || 0;
    }
  }
  if (alcohol > 0) tags.push('contains_alcohol');
  if (alcohol >= 28) tags.push('heavy_alcohol'); // 2+ standard drinks
  if (alcohol > 0 && hour >= 20) tags.push('late_alcohol');

  // Sleep-disruptive combination: late caffeine OR late alcohol OR late heavy meal
  if ((caffeine > 0 && hour >= 16) || (alcohol > 0 && hour >= 20)) {
    tags.push('sleep_disruptive');
  }

  // Tryptophan-rich (sleep supportive amino acid)
  if (Array.isArray(meal.micronutrients)) {
    for (const m of meal.micronutrients) {
      if ((m.name || '').toLowerCase().includes('tryptophan') && (m.amount || 0) > 100) {
        tags.push('high_tryptophan');
      }
    }
  }

  return tags;
}

function checkAntiInflammatory(meal: MealTagInput): boolean {
  if (!Array.isArray(meal.micronutrients)) return false;
  let score = 0;
  for (const m of meal.micronutrients) {
    const name = (m.name || '').toLowerCase();
    // Vitamin C, E, omega-3, selenium are anti-inflammatory markers
    if (name.includes('vitamin c') && m.amount > 15) score++;
    if (name.includes('vitamin e') && m.amount > 3) score++;
    if (name.includes('omega') && m.amount > 100) score++;
    if (name.includes('selenium') && m.amount > 10) score++;
    if (name.includes('magnesium') && m.amount > 50) score++;
  }
  // Also check fiber (anti-inflammatory)
  if (Array.isArray(meal.macronutrients)) {
    for (const m of meal.macronutrients) {
      if ((m.name || '').toLowerCase().includes('fiber') && m.amount >= 5) score++;
    }
  }
  return score >= 2;
}

function isLikelyProcessed(ingredients?: string[]): boolean {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return false;
  const processedMarkers = [
    'high fructose', 'corn syrup', 'artificial', 'hydrogenated',
    'preservative', 'msg', 'sodium nitrate', 'sodium nitrite',
    'bht', 'bha', 'aspartame', 'sucralose', 'modified starch',
    'xanthan', 'carrageenan', 'maltodextrin', 'dextrose',
  ];
  const lower = ingredients.map(i => i.toLowerCase());
  let hits = 0;
  for (const ingredient of lower) {
    for (const marker of processedMarkers) {
      if (ingredient.includes(marker)) hits++;
    }
  }
  return hits >= 2;
}

function countSignificantMicros(micros?: Array<{ name: string; amount: number; unit?: string; percentDailyValue?: number }>): number {
  if (!Array.isArray(micros)) return 0;
  return micros.filter(m => (m as any).percentDailyValue >= 15).length;
}
