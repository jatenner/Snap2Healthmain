export interface Macro { grams: number; dv: number; target: number; remaining: number; }
export interface MacroComponent { grams: number; dv: number; }
export interface Macros {
  protein: Macro;
  totalCarbs: Macro;
  totalFat: Macro;
  alcohol?: Macro;
  components: {
    sugar: MacroComponent;
    fiber: MacroComponent;
    starch?: MacroComponent;
    saturatedFat: MacroComponent;
    unsatFat?: MacroComponent;
    transFat?: MacroComponent;
    cholesterol?: MacroComponent;
    sodium?: MacroComponent;
  };
}

export interface Nutrient { name: string; amount: number; unit: string; dv: number; note: string; }

export interface MealAnalysis {
  id: string;
  photo_url: string;
  name: string;
  calories: number;
  macros: Macros;
  vitamins: Nutrient[];
  minerals: Nutrient[];
  otherMicros: Nutrient[];
}

interface UserProfile {
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
  activity_level?: string;
  goal?: string;
}

export function bucketAndSort(rawData: any, userProfile?: UserProfile): MealAnalysis {
  const nutrients = rawData.macronutrients || rawData.nutrients?.macronutrients || [];
  const micros = rawData.micronutrients || rawData.nutrients?.micronutrients || [];
  
  // Helper to find nutrient by name
  const findNutrient = (name: string) => 
    nutrients.find((n: any) => n.name?.toLowerCase().includes(name.toLowerCase()));
  
  const findMicro = (name: string) => 
    micros.find((n: any) => n.name?.toLowerCase().includes(name.toLowerCase()));

  // Calculate personalized targets based on profile
  const getPersonalizedTarget = (macro: string, amount: number): number => {
    if (!userProfile) return amount * 3; // Default 3x current
    
    const { weight = 70, activity_level = 'moderate', goal = 'maintain' } = userProfile;
    const multipliers = {
      protein: goal === 'muscle-gain' ? 2.2 : 1.6,
      carbs: activity_level === 'high' ? 6 : 4,
      fat: 1.2
    };
    
    switch (macro) {
      case 'protein': return weight * multipliers.protein;
      case 'carbs': return weight * multipliers.carbs;
      case 'fat': return weight * multipliers.fat;
      default: return amount * 3;
    }
  };

  // Build macro objects
  const protein = findNutrient('protein');
  const carbs = findNutrient('carbohydrate');
  const fat = findNutrient('fat');
  const alcohol = findNutrient('alcohol');

  const proteinTarget = getPersonalizedTarget('protein', protein?.amount || 0);
  const carbsTarget = getPersonalizedTarget('carbs', carbs?.amount || 0);
  const fatTarget = getPersonalizedTarget('fat', fat?.amount || 0);

  const macros: Macros = {
    protein: {
      grams: protein?.amount || 0,
      dv: protein?.percentDailyValue || 0,
      target: proteinTarget,
      remaining: Math.max(0, proteinTarget - (protein?.amount || 0))
    },
    totalCarbs: {
      grams: carbs?.amount || 0,
      dv: carbs?.percentDailyValue || 0,
      target: carbsTarget,
      remaining: Math.max(0, carbsTarget - (carbs?.amount || 0))
    },
    totalFat: {
      grams: fat?.amount || 0,
      dv: fat?.percentDailyValue || 0,
      target: fatTarget,
      remaining: Math.max(0, fatTarget - (fat?.amount || 0))
    },
    ...(alcohol && { alcohol: {
      grams: alcohol.amount,
      dv: alcohol.percentDailyValue || 0,
      target: 0,
      remaining: 0
    }}),
    components: {
      sugar: {
        grams: findNutrient('sugar')?.amount || 0,
        dv: findNutrient('sugar')?.percentDailyValue || 0
      },
      fiber: {
        grams: findNutrient('fiber')?.amount || 0,
        dv: findNutrient('fiber')?.percentDailyValue || 0
      },
      starch: findNutrient('starch') ? {
        grams: findNutrient('starch')!.amount,
        dv: findNutrient('starch')!.percentDailyValue || 0
      } : undefined,
      saturatedFat: {
        grams: findNutrient('saturated')?.amount || 0,
        dv: findNutrient('saturated')?.percentDailyValue || 0
      },
      unsatFat: findNutrient('unsaturated') ? {
        grams: findNutrient('unsaturated')!.amount,
        dv: findNutrient('unsaturated')!.percentDailyValue || 0
      } : undefined,
      transFat: findNutrient('trans') ? {
        grams: findNutrient('trans')!.amount,
        dv: findNutrient('trans')!.percentDailyValue || 0
      } : undefined,
      cholesterol: findMicro('cholesterol') ? {
        grams: findMicro('cholesterol')!.amount,
        dv: findMicro('cholesterol')!.percentDailyValue || 0
      } : undefined,
      sodium: findMicro('sodium') ? {
        grams: findMicro('sodium')!.amount,
        dv: findMicro('sodium')!.percentDailyValue || 0
      } : undefined
    }
  };

  // Categorize micronutrients
  const vitaminNames = ['vitamin', 'thiamine', 'riboflavin', 'niacin', 'folate', 'biotin'];
  const mineralNames = ['calcium', 'iron', 'zinc', 'magnesium', 'potassium', 'phosphorus', 'selenium', 'copper', 'manganese'];
  
  const vitamins: Nutrient[] = [];
  const minerals: Nutrient[] = [];
  const otherMicros: Nutrient[] = [];

  micros.forEach((micro: any) => {
    const nutrient: Nutrient = {
      name: micro.name,
      amount: micro.amount,
      unit: micro.unit || 'mg',
      dv: micro.percentDailyValue || 0,
      note: micro.description || ''
    };

    const name = micro.name.toLowerCase();
    if (vitaminNames.some(v => name.includes(v))) {
      vitamins.push(nutrient);
    } else if (mineralNames.some(m => name.includes(m))) {
      minerals.push(nutrient);
    } else {
      otherMicros.push(nutrient);
    }
  });

  // Sort by %DV (high to low)
  const sortByDV = (a: Nutrient, b: Nutrient) => b.dv - a.dv;
  
  return {
    id: rawData.id || '',
    photo_url: rawData.image_url || rawData.imageUrl || '',
    name: rawData.meal_name || rawData.mealName || 'Meal',
    calories: rawData.calories || 0,
    macros,
    vitamins: vitamins.sort(sortByDV),
    minerals: minerals.sort(sortByDV),
    otherMicros: otherMicros.sort(sortByDV)
  };
} 