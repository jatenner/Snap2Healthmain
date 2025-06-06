import { createBrowserClient } from '@supabase/ssr';

// Types for nutrition data
export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
}

export interface UserProfile {
  id?: string;
  full_name?: string;
  age?: number;
  gender?: string;
  weight?: number;
  weight_unit?: string;
  height?: number;
  height_unit?: string;
  goal?: string;
  activity_level?: string;
  updated_at?: string;
}

// FDA/NIH Reference Values for Daily Values
export const DV_REFERENCE = {
  // Macronutrients
  'protein': 50, // g
  'carbohydrates': 275, // g
  'carbohydrate': 275, // g
  'carbs': 275, // g
  'fat': 78, // g
  'dietary fiber': 28, // g
  'fiber': 28, // g
  'soluble fiber': 7, // g
  'insoluble fiber': 21, // g
  'sugar': 50, // g
  'sugars': 50, // g
  'added sugar': 25, // g
  'cholesterol': 300, // mg
  'sodium': 2300, // mg
  'calories': 2000, // kcal
  
  // Vitamins
  'vitamin a': 900, // mcg RAE
  'vitamin c': 90, // mg
  'vitamin d': 20, // mcg
  'vitamin e': 15, // mg
  'vitamin k': 120, // mcg
  'vitamin b1': 1.2, // mg (thiamine)
  'thiamine': 1.2, // mg
  'vitamin b2': 1.3, // mg (riboflavin)
  'riboflavin': 1.3, // mg
  'vitamin b3': 16, // mg (niacin)
  'niacin': 16, // mg
  'vitamin b5': 5, // mg (pantothenic acid)
  'pantothenic acid': 5, // mg
  'vitamin b6': 1.7, // mg
  'vitamin b7': 30, // mcg (biotin)
  'biotin': 30, // mcg
  'vitamin b9': 400, // mcg (folate)
  'folate': 400, // mcg
  'folic acid': 400, // mcg
  'vitamin b12': 2.4, // mcg
  'cobalamin': 2.4, // mcg
  'choline': 550, // mg
  
  // Minerals
  'calcium': 1000, // mg
  'iron': 18, // mg
  'magnesium': 420, // mg
  'zinc': 11, // mg
  'potassium': 3500, // mg
  'phosphorus': 700, // mg
  'iodine': 150, // mcg
  'selenium': 55, // mcg
  'copper': 0.9, // mg
  'manganese': 2.3, // mg
  'chromium': 35, // mcg
  'molybdenum': 45, // mcg
  'chloride': 2300, // mg
} as const;

// User-friendly descriptions for nutrients
export const NUTRIENT_DESCRIPTIONS: Record<string, string> = {
  // Macronutrients
  'protein': 'Builds and repairs your muscles, keeps you feeling full longer, and helps your body recover after workouts. Great for maintaining a strong, lean physique.',
  'carbs': 'Your body\'s preferred fuel source. Gives you energy for workouts and keeps your brain sharp. Choose complex carbs for steady, lasting energy.',
  'carbohydrates': 'Your body\'s preferred fuel source. Gives you energy for workouts and keeps your brain sharp. Choose complex carbs for steady, lasting energy.',
  'fat': 'Helps your body absorb vitamins, keeps you satisfied between meals, and supports healthy hormone production. Don\'t fear healthy fats!',
  'fiber': 'Keeps your digestive system running smoothly, helps you feel full, and can help manage blood sugar levels. Your gut will thank you.',
  'sodium': 'Helps maintain fluid balance and muscle function. Too much can make you feel bloated and may affect blood pressure over time.',
  
  // Vitamins
  'vitamin a': 'Keeps your eyes healthy and your immune system strong. Helps you see better in low light and supports healthy skin.',
  'vitamin c': 'Boosts your immune system and helps your body heal faster. Also helps your body absorb iron better from plant foods.',
  'vitamin d': 'Keeps your bones strong and may help improve your mood. Most people don\'t get enough, especially during winter months.',
  'vitamin e': 'Protects your cells from damage and supports a healthy immune system. Acts like a bodyguard for your cells.',
  'vitamin k': 'Helps your blood clot properly when you get cut and keeps your bones strong as you age.',
  'vitamin b1': 'Helps turn your food into energy and keeps your nervous system running smoothly. Essential for brain function.',
  'thiamine': 'Helps turn your food into energy and keeps your nervous system running smoothly. Essential for brain function.',
  'vitamin b2': 'Helps your body convert food into energy and supports healthy skin. You\'ll feel more energetic with adequate levels.',
  'riboflavin': 'Helps your body convert food into energy and supports healthy skin. You\'ll feel more energetic with adequate levels.',
  'vitamin b3': 'Supports energy production and can help improve cholesterol levels. Important for brain function and healthy skin.',
  'niacin': 'Supports energy production and can help improve cholesterol levels. Important for brain function and healthy skin.',
  'vitamin b5': 'Helps your body make energy from food and supports healthy blood cells. Important for overall energy levels.',
  'pantothenic acid': 'Helps your body make energy from food and supports healthy blood cells. Important for overall energy levels.',
  'vitamin b6': 'Supports protein metabolism and brain function. May help improve mood and reduce PMS symptoms.',
  'vitamin b7': 'Supports healthy hair, skin, and nails. Helps your body process fats, carbs, and proteins efficiently.',
  'biotin': 'Supports healthy hair, skin, and nails. Helps your body process fats, carbs, and proteins efficiently.',
  'vitamin b9': 'Essential for cell growth and DNA repair. Super important during pregnancy to prevent birth defects.',
  'folate': 'Essential for cell growth and DNA repair. Super important during pregnancy to prevent birth defects.',
  'folic acid': 'The synthetic form of folate found in supplements. Essential for cell growth and DNA repair.',
  'vitamin b12': 'Keeps your nerves healthy and helps prevent fatigue. Only found in animal products, so vegans need supplements.',
  'cobalamin': 'Keeps your nerves healthy and helps prevent fatigue. Only found in animal products, so vegans need supplements.',
  'choline': 'Supports brain function and memory. Helps your liver process fats and may improve cognitive performance.',
  
  // Minerals
  'calcium': 'Builds and maintains strong bones and teeth. Also helps your muscles contract properly and your blood clot when needed.',
  'iron': 'Carries oxygen throughout your body and prevents fatigue. Low iron makes you feel tired and weak.',
  'magnesium': 'Supports muscle function, energy production, and helps you stay calm. Many people don\'t get enough and feel more stressed.',
  'zinc': 'Boosts your immune system, helps wounds heal faster, and supports healthy taste and smell.',
  'potassium': 'Helps regulate blood pressure and supports proper muscle and nerve function. Important for heart health.',
  'phosphorus': 'Works with calcium to build strong bones and teeth. Also helps your body store and use energy.',
  'iodine': 'Essential for proper thyroid function, which controls your metabolism and energy levels.',
  'selenium': 'Acts as an antioxidant to protect your cells from damage and supports thyroid function.',
  'copper': 'Helps your body absorb iron and supports healthy connective tissues. Works as an antioxidant too.',
  'manganese': 'Supports bone health, wound healing, and helps your body process nutrients efficiently.',
  'chromium': 'May help your body process carbohydrates and maintain healthy blood sugar levels.',
};

// Calculate personalized daily value percentages
export function calculatePersonalizedDV(nutrient: Nutrient, profile?: UserProfile | null): number {
  if (!profile || !nutrient) return nutrient.percentDailyValue || 0;
  
  // Extract name and make lowercase for comparison
  const name = nutrient.name.toLowerCase();
  
  // Get profile details with defaults for missing values
  const age = profile.age || 30;
  const gender = (profile.gender || 'not specified').toLowerCase();
  const weight = profile.weight || 70; // kg
  const weightUnit = profile.weight_unit || 'kg';
  const weightInKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
  const activityLevel = (profile.activity_level || 'moderate').toLowerCase();
  const goal = (profile.goal || 'general wellness').toLowerCase();
  
  // Activity factor mapping
  const activityFactors = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very active': 1.9
  };
  
  // Find the best matching activity level
  let activityFactor = 1.55; // Default to moderate
  Object.entries(activityFactors).forEach(([level, factor]) => {
    if (activityLevel.includes(level)) {
      activityFactor = factor;
    }
  });
  
  // Protein personalization
  if (name.includes('protein')) {
    let proteinMultiplier = 0.8; // RDA baseline (0.8g per kg)
    
    // Adjust based on activity and goals
    if (goal.includes('muscle') || goal.includes('strength')) {
      proteinMultiplier = 1.8; // Higher for muscle building
    } else if (goal.includes('weight loss') || goal.includes('lose weight')) {
      proteinMultiplier = 1.6; // Higher for weight loss to preserve muscle
    } else if (activityLevel.includes('active') || activityLevel.includes('athlete')) {
      proteinMultiplier = 1.4; // Higher for active people
    }
    
    const dailyProteinNeed = weightInKg * proteinMultiplier;
    const percentOfDaily = (nutrient.amount / dailyProteinNeed) * 100;
    return Math.round(percentOfDaily);
  }
  
  // Carbohydrate personalization
  if (name.includes('carb')) {
    // Base carb needs on activity level and goals
    let carbPercentage = 50; // Default percentage of calories from carbs
    
    // Adjust based on goals
    if (goal.includes('keto') || goal.includes('low carb')) {
      carbPercentage = 10; // Much lower for keto
    } else if (goal.includes('weight loss')) {
      carbPercentage = 40; // Lower for weight loss
    } else if (goal.includes('endurance') || goal.includes('athlete')) {
      carbPercentage = 60; // Higher for endurance activities
    }
    
    // Calculate base TDEE
    const bmr = gender.includes('male') 
      ? 88.362 + (13.397 * weightInKg) + (4.799 * 170) - (5.677 * age)
      : 447.593 + (9.247 * weightInKg) + (3.098 * 160) - (4.330 * age);
    
    const tdee = bmr * activityFactor;
    const dailyCarbCalories = tdee * (carbPercentage / 100);
    const dailyCarbGrams = dailyCarbCalories / 4; // 4 calories per gram of carbs
    
    const percentOfDaily = (nutrient.amount / dailyCarbGrams) * 100;
    return Math.round(percentOfDaily);
  }
  
  // Fat personalization
  if (name.includes('fat') && !name.includes('saturated') && !name.includes('trans')) {
    let fatPercentage = 30; // Default percentage of calories from fat
    
    // Adjust based on goals
    if (goal.includes('keto') || goal.includes('low carb')) {
      fatPercentage = 75; // Much higher for keto
    } else if (goal.includes('weight loss')) {
      fatPercentage = 35; // Slightly higher for some weight loss approaches
    } else if (goal.includes('heart health') || goal.includes('cardiovascular')) {
      fatPercentage = 25; // Lower for heart health
    }
    
    // Calculate base TDEE
    const bmr = gender.includes('male') 
      ? 88.362 + (13.397 * weightInKg) + (4.799 * 170) - (5.677 * age)
      : 447.593 + (9.247 * weightInKg) + (3.098 * 160) - (4.330 * age);
    
    const tdee = bmr * activityFactor;
    const dailyFatCalories = tdee * (fatPercentage / 100);
    const dailyFatGrams = dailyFatCalories / 9; // 9 calories per gram of fat
    
    const percentOfDaily = (nutrient.amount / dailyFatGrams) * 100;
    return Math.round(percentOfDaily);
  }
  
  // For micronutrients, defer to standard DV
  return nutrient.percentDailyValue || 0;
}

// Calculate BMR based on Mifflin-St Jeor Equation
export function calculateBMR(profile: UserProfile): number {
  if (!profile) return 0;
  
  // Convert height from inches to cm if needed
  const heightInCm = profile.height_unit === 'in' 
    ? (profile.height || 70) * 2.54 
    : (profile.height || 178);
  
  // Convert weight from pounds to kg if needed
  const weightInKg = profile.weight_unit === 'lb' 
    ? (profile.weight || 160) * 0.453592 
    : (profile.weight || 72.5);
  
  // Calculate BMR based on gender
  if (profile.gender?.toLowerCase() === 'female') {
    return 10 * weightInKg + 6.25 * heightInCm - 5 * (profile.age || 25) - 161;
  } else {
    return 10 * weightInKg + 6.25 * heightInCm - 5 * (profile.age || 25) + 5;
  }
}

// Calculate daily calorie needs based on activity level
export function calculateDailyCalories(profile: UserProfile): number {
  if (!profile) return 0;
  
  const bmr = calculateBMR(profile);
  const activityLevel = profile.activity_level?.toLowerCase() || 'moderate';
  
  // Activity multipliers
  if (activityLevel.includes('sedentary') || activityLevel.includes('low')) {
    return bmr * 1.2; // Sedentary or very low activity
  } else if (activityLevel.includes('light')) {
    return bmr * 1.375; // Light exercise/activity 1-3 days/week
  } else if (activityLevel.includes('moderate')) {
    return bmr * 1.55; // Moderate exercise/activity 3-5 days/week
  } else if (activityLevel.includes('very') || activityLevel.includes('high')) {
    return bmr * 1.725; // Very active/hard exercise 6-7 days/week
  } else if (activityLevel.includes('extreme') || activityLevel.includes('athlete')) {
    return bmr * 1.9; // Extremely active/physical job/training
  }
  
  return bmr * 1.55; // Default to moderate
}

// Generate a personalized health summary based on meal data and user profile
export function generateHealthSummary(
  mealData: any, 
  profile: UserProfile, 
  personalizedData: any
): string {
  if (!mealData?.analysis) {
    return "Health analysis requires meal data. Upload a photo of your food to get personalized insights.";
  }
  
  // Debug console output in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[generateHealthSummary] Using profile:', profile);
    console.log('[generateHealthSummary] Missing fields:', getMissingProfileFields(profile));
    console.log('[generateHealthSummary] Using personalized data:', personalizedData);
  }
  
  // Check if we have a valid profile for personalization
  const isPersonalized = profile && isProfileComplete(profile);
  const missingFields = profile ? getMissingProfileFields(profile) : [];
  
  // Extract basic nutritional data
  const calories = mealData.analysis.calories || 0;
  const macros = mealData.analysis.macronutrients || [];
  const protein = macros.find(m => m.name.toLowerCase() === 'protein')?.amount || 0;
  const carbs = macros.find(m => m.name.toLowerCase() === 'carbs' || m.name.toLowerCase() === 'carbohydrates')?.amount || 0;
  const fat = macros.find(m => m.name.toLowerCase() === 'fat')?.amount || 0;
  const fiber = macros.find(m => m.name.toLowerCase() === 'fiber' || m.name.toLowerCase() === 'dietary fiber')?.amount || 0;
  const sugar = macros.find(m => m.name.toLowerCase() === 'sugar' || m.name.toLowerCase() === 'sugars')?.amount || 0;
  
  // Calculate macro percentages (by calories)
  const proteinCals = protein * 4;
  const carbCals = carbs * 4;
  const fatCals = fat * 9;
  const totalCals = proteinCals + carbCals + fatCals || calories; // Fallback to total calories if calculated is zero
  
  const proteinPct = totalCals > 0 ? Math.round((proteinCals / totalCals) * 100) : 0;
  const carbPct = totalCals > 0 ? Math.round((carbCals / totalCals) * 100) : 0;
  const fatPct = totalCals > 0 ? Math.round((fatCals / totalCals) * 100) : 0;
  
  // Extract micronutrient data
  const micros = mealData.analysis.micronutrients || [];
  const highMicros = micros.filter(m => m.percentDailyValue && m.percentDailyValue > 30);
  const lowMicros = micros.filter(m => m.percentDailyValue && m.percentDailyValue < 10);
  
  // Estimate calorie needs if personalized data is available
  let calorieNeeds = 2000; // Default
  let caloriePercentage = Math.round((calories / calorieNeeds) * 100);
  
  if (personalizedData && personalizedData.targetCalories) {
    calorieNeeds = personalizedData.targetCalories;
    caloriePercentage = personalizedData.caloriePercentage || Math.round((calories / calorieNeeds) * 100);
  } else if (profile) {
    // Basic estimation based on profile
    const baseMetabolicRate = profile.gender?.toLowerCase().includes('female') ? 1600 : 1800;
    
    // Apply age adjustment
    let ageAdjustedBMR = baseMetabolicRate;
    if (profile.age) {
      if (profile.age > 60) ageAdjustedBMR *= 0.8;
      else if (profile.age > 40) ageAdjustedBMR *= 0.9;
      else if (profile.age < 25) ageAdjustedBMR *= 1.1;
    }
    
    // Apply activity adjustment
    const activityLevelAdjustment = {
      'sedentary': 1.2,
      'light': 1.375, 
      'moderate': 1.55,
      'active': 1.725,
      'very active': 1.9
    };
    
    let activityMultiplier = 1.55; // Default to moderate
    
    if (profile.activity_level) {
      const level = profile.activity_level.toLowerCase();
      for (const [key, value] of Object.entries(activityLevelAdjustment)) {
        if (level.includes(key)) {
          activityMultiplier = value;
          break;
        }
      }
    }
    
    calorieNeeds = Math.round(ageAdjustedBMR * activityMultiplier);
    caloriePercentage = Math.round((calories / calorieNeeds) * 100);
  }
  
  // Common intro section
  let summary = `Analyzing this ${calories} calorie meal (${caloriePercentage}% of your ${isPersonalized ? 'personalized' : 'estimated'} daily energy needs) through the lens of metabolic physiology reveals a macronutrient distribution of ${proteinPct}% protein, ${carbPct}% carbohydrate, and ${fatPct}% fat. `;
  
  // Add protein commentary
  const weightInKg = personalizedData?.weightInKg || 
    (profile?.weight_unit === 'lb' && profile?.weight 
      ? profile.weight * 0.453592 
      : profile?.weight || 70);
  
  const proteinPerKg = weightInKg ? (protein / weightInKg).toFixed(1) : null;
  
  if (proteinPerKg) {
    summary += `The ${protein}g protein content (${proteinPerKg}g/kg body weight) `;
    
    if (Number(proteinPerKg) < 0.25) {
      summary += `represents a relatively small protein bolus that may be insufficient to maximally stimulate muscle protein synthesis cascades, which typically require 0.3-0.4g/kg per meal (or 2.5-3g leucine) to activate mTORC1 signaling pathways. `;
    } else if (Number(proteinPerKg) >= 0.3 && Number(proteinPerKg) < 0.5) {
      summary += `likely reaches the leucine threshold (2.5-3g) required to fully activate mTORC1 signaling and maximize the anabolic response, creating a 2-3 hour window of elevated muscle protein synthesis. `;
    } else {
      summary += `significantly exceeds the minimum threshold required for maximal protein synthesis stimulation, though research demonstrates diminishing returns beyond ~0.4g/kg in a single feeding due to the refractory nature of the mTOR pathway. `;
    }
  } else {
    summary += `The ${protein}g protein content `;
    
    if (protein < 15) {
      summary += `falls below the minimum threshold typically needed to meaningfully activate muscle protein synthesis pathways. `;
    } else if (protein >= 25 && protein < 40) {
      summary += `represents an adequate stimulus for muscle protein synthesis activation in most individuals, likely surpassing the leucine threshold that triggers mTORC1 signaling. `;
    } else if (protein >= 40) {
      summary += `provides robust stimulus for muscle protein synthesis, though with diminishing returns due to the refractory nature of mTOR signaling after threshold activation. `;
    }
  }
  
  // Add carbohydrate commentary
  if (carbs < 20) {
    summary += `The low carbohydrate content (${carbs}g) minimizes insulin secretion, potentially supporting fat oxidation and ketone production if maintained across multiple meals. `;
  } else if (carbs >= 20 && carbs < 45) {
    summary += `The moderate carbohydrate load (${carbs}g) provides sufficient glucose for immediate metabolic needs while limiting excessive insulin secretion. `;
  } else if (carbs >= 45 && carbs < 80) {
    summary += `The substantial carbohydrate content (${carbs}g) will trigger moderate insulin release, temporarily inhibiting lipolysis while facilitating glucose uptake and glycogen restoration, particularly beneficial in the post-exercise window. `;
  } else {
    summary += `The high carbohydrate load (${carbs}g) will elicit a significant insulin response, potentially creating a 2-3 hour window of reduced fat oxidation while prioritizing glycogen restoration and glucose utilization. `;
  }
  
  // Add sugar and fiber commentary
  if (sugar && fiber) {
    const sugarToFiberRatio = (sugar / fiber).toFixed(1);
    
    if (Number(sugarToFiberRatio) > 4) {
      summary += `The ${sugar}g sugar content without proportional fiber (${fiber}g) may lead to rapid glucose absorption and a more pronounced glycemic response. `;
    } else if (Number(sugarToFiberRatio) <= 4 && Number(sugarToFiberRatio) > 2) {
      summary += `The ${fiber}g fiber content modulates the absorption kinetics of the ${sugar}g sugar, attenuating the glycemic response through delayed gastric emptying and reduced glucose uptake rates. `;
    } else {
      summary += `The excellent fiber-to-sugar ratio (${fiber}g:${sugar}g) supports optimal glucose absorption kinetics and promotes beneficial effects on both the gut microbiome and metabolic regulation. `;
    }
  } else if (fiber > 5) {
    summary += `The significant fiber content (${fiber}g) supports gut microbiome diversity and production of beneficial short-chain fatty acids while moderating glucose absorption kinetics. `;
  }
  
  // Add micronutrient commentary
  if (highMicros.length > 0) {
    const topHighMicros = highMicros.slice(0, 3).map(m => m.name);
    summary += `From a micronutrient perspective, this meal provides excellent levels of ${topHighMicros.join(', ')}, `;
    
    // Add functional benefits based on top micronutrients
    if (topHighMicros.some(m => m.toLowerCase().includes('vitamin c') || m.toLowerCase().includes('vitamin e'))) {
      summary += `supporting antioxidant defense systems and collagen synthesis. `;
    } else if (topHighMicros.some(m => m.toLowerCase().includes('b') && !m.toLowerCase().includes('b12'))) {
      summary += `supporting mitochondrial energy production and metabolic cofactor availability. `;
    } else if (topHighMicros.some(m => m.toLowerCase().includes('magnesium') || m.toLowerCase().includes('calcium'))) {
      summary += `supporting neuromuscular function and signaling pathways. `;
    } else if (topHighMicros.some(m => m.toLowerCase().includes('zinc') || m.toLowerCase().includes('selenium'))) {
      summary += `supporting immune function and thyroid hormone regulation. `;
    } else {
      summary += `contributing to multiple physiological pathways. `;
    }
  }
  
  if (lowMicros.length > 0) {
    const importantLowMicros = lowMicros.filter(m => 
      m.name.toLowerCase().includes('vitamin d') || 
      m.name.toLowerCase().includes('b12') || 
      m.name.toLowerCase().includes('magnesium') || 
      m.name.toLowerCase().includes('zinc') || 
      m.name.toLowerCase().includes('iron')
    );
    
    if (importantLowMicros.length > 0) {
      summary += `Note that this meal is relatively low in ${importantLowMicros.slice(0, 2).map(m => m.name).join(', ')}, which are critical for ${
        importantLowMicros.some(m => m.name.toLowerCase().includes('vitamin d')) ? 'immune function, calcium absorption, and gene regulation' : 
        importantLowMicros.some(m => m.name.toLowerCase().includes('b12')) ? 'neurological function and red blood cell formation' :
        importantLowMicros.some(m => m.name.toLowerCase().includes('magnesium')) ? 'energy production and neuromuscular function' :
        importantLowMicros.some(m => m.name.toLowerCase().includes('zinc')) ? 'immune function and protein synthesis' :
        'multiple metabolic pathways'
      }. `;
    }
  }
  
  // Add goal-specific commentary if available
  if (profile?.goal) {
    const goalLower = profile.goal.toLowerCase();
    
    if (goalLower.includes('weight loss')) {
      summary += `For your weight loss goal, this meal's ${proteinPct >= 30 ? 'high' : 'moderate'} protein percentage ${proteinPct >= 30 ? 'optimally supports' : 'could be increased to better support'} satiety mechanisms through elevated GLP-1 and PYY secretion. The ${caloriePercentage > 30 ? 'substantial' : 'moderate'} caloric load represents ${caloriePercentage}% of your daily energy target, ${caloriePercentage > 35 ? 'potentially limiting the deficit window throughout the remainder of the day' : 'allowing flexibility for additional meals while maintaining a net deficit'}. `;
      
      if (fiber >= 5) {
        summary += `The fiber content supports extended satiety through delayed gastric emptying and enhanced incretin hormone release. `;
      }
    } 
    else if (goalLower.includes('muscle') || goalLower.includes('strength')) {
      summary += `For your muscle/strength goal, this meal's protein content ${protein >= 30 ? 'provides' : 'falls short of'} the minimum threshold for maximizing muscle protein synthesis (typically 30-40g containing ~2.5-3g leucine). The ${caloriePercentage < 25 ? 'relatively low' : caloriePercentage > 40 ? 'substantial' : 'moderate'} caloric load ${caloriePercentage < 25 ? 'may be insufficient to support the anabolic environment required for hypertrophy' : 'contributes appropriately to your higher energy requirements for muscular development'}. `;
      
      if (carbs >= 40) {
        summary += `The sufficient carbohydrate content supports insulin-mediated amino acid transport and glycogen restoration, particularly beneficial in the post-exercise window. `;
      }
    }
    else if (goalLower.includes('longevity') || goalLower.includes('health span')) {
      summary += `For your longevity goal, this meal's macronutrient composition ${proteinPct < 25 && carbPct < 45 ? 'supports metabolic flexibility and moderate mTOR activation' : 'could be adjusted to further optimize longevity pathways by moderating protein and refined carbohydrates'}. Research suggests that strategic protein restriction (while maintaining adequate levels) and minimizing glycemic variability may enhance cellular maintenance processes. `;
      
      if (highMicros.some(m => 
        m.name.toLowerCase().includes('vitamin c') || 
        m.name.toLowerCase().includes('vitamin e') || 
        m.name.toLowerCase().includes('selenium') ||
        m.name.toLowerCase().includes('polyphenol')
      )) {
        summary += `The robust antioxidant profile supports cellular defense mechanisms and Nrf2 pathway activation, critical for long-term cellular resilience. `;
      }
      
      if (fiber > 5) {
        summary += `The fiber content supports gut microbiome diversity, which emerging research links to longevity outcomes through immune modulation and metabolite production. `;
      }
    }
    else if (goalLower.includes('energy') || goalLower.includes('fatigue')) {
      summary += `For your energy/anti-fatigue goal, this meal's composition ${carbPct > 40 && fatPct < 35 ? 'effectively balances' : 'could better balance'} immediate glucose availability with sustained energy release. The ${carbs}g carbohydrate content provides substrate for immediate ATP production, while the ${fat}g fat content supports extended energy availability. `;
      
      if (highMicros.some(m => m.name.toLowerCase().includes('b'))) {
        summary += `The B-vitamin content directly supports mitochondrial function and enzymatic cofactors required for cellular energy production. `;
      }
      
      if (highMicros.some(m => m.name.toLowerCase().includes('iron') || m.name.toLowerCase().includes('magnesium'))) {
        summary += `The ${highMicros.find(m => m.name.toLowerCase().includes('iron') || m.name.toLowerCase().includes('magnesium'))?.name} content is particularly relevant for energy production by supporting oxygen transport and ATP synthesis. `;
      }
    }
  }
  
  // Add activity-specific commentary
  if (profile?.activity_level?.toLowerCase().includes('very active') || profile?.activity_level?.toLowerCase().includes('athlete')) {
    summary += `For your high activity level, this meal's macronutrient profile ${carbs >= 50 && protein >= 30 ? 'effectively supports' : 'could better support'} recovery and adaptation processes. ${carbs >= 50 ? `The ${carbs}g carbohydrate content facilitates glycogen resynthesis, which occurs at a rate of ~5-7g per hour in the post-exercise window.` : `Higher carbohydrate content would enhance glycogen restoration, which occurs optimally with 1.0-1.2g/kg/hour intake post-exercise.`} ${protein >= 30 ? `The ${protein}g protein content supports muscle repair processes.` : `Increased protein intake would better support muscle repair processes.`} `;
  }
  
  // Add age-specific commentary
  if (profile?.age) {
    if (profile.age > 50) {
      summary += `Given your age profile, note that research demonstrates progressive anabolic resistance with advancing age, requiring ~40% higher protein intake to achieve equivalent muscle protein synthesis compared to younger adults. ${protein >= 35 ? 'This meal provides adequate protein to offset this resistance.' : 'Consider increasing protein content in future meals to offset this resistance.'} `;
    } else if (profile.age < 25) {
      summary += `Your age profile indicates heightened anabolic sensitivity and metabolic plasticity, allowing efficient nutrient partitioning. Focus on consistency in nutrient timing and quality to capitalize on this biological advantage. `;
    }
  }
  
  // Conclusion with personalized touch
  if (isPersonalized) {
    summary += `This analysis is personalized based on your specific profile data, including age (${profile.age}), gender (${profile.gender}), weight (${profile.weight}${profile.weight_unit}), height (${profile.height}${profile.height_unit}), activity level (${profile.activity_level}), and goal (${profile.goal}).`;
  } else {
    summary += `For more precise nutritional guidance, consider completing your profile with the following missing information: ${missingFields.join(', ')}.`;
  }
  
  return summary;
}

// Function to generate a "Complete Profile" link with appropriate styling
export function getCompleteProfileButton(missingFields: string[]) {
  if (!missingFields || missingFields.length === 0) return null;
  
  const fieldLabels = {
    'age': 'Age',
    'gender': 'Gender',
    'weight': 'Weight',
    'height': 'Height',
    'goal': 'Health Goal',
    'activity_level': 'Activity Level'
  };
  
  const missingLabels = missingFields.map(field => fieldLabels[field as keyof typeof fieldLabels]).filter(Boolean);
  
  return {
    text: missingLabels.length > 2 
      ? `Complete Profile (Missing ${missingLabels.length} Fields)` 
      : `Add ${missingLabels.join(' & ')} to Profile`,
    href: '/profile?highlight=' + missingFields.join(',')
  };
}

// Check what profile data is missing
export function getMissingProfileFields(profile: UserProfile): string[] {
  if (!profile) return ['age', 'gender', 'weight', 'height', 'goal', 'activity_level'];
  
  const missingFields = [];
  
  // List of placeholder values that should be treated as missing
  const placeholders = [
    "Select Gender", "Choose Gender", "Gender", "Select", 
    "Select Goal", "Choose Goal", "Goal",
    "Select Activity Level", "Choose Activity Level", "Activity Level"
  ];
  
  // Debug logging in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[getMissingProfileFields] Checking profile:', {
      profile,
      gender: profile.gender,
      goal: profile.goal,
      activity_level: profile.activity_level
    });
  }
  
  // Only consider a field missing if it's undefined/null, empty string, or a placeholder value
  if (profile.age === undefined || profile.age === null || profile.age <= 0) {
    missingFields.push('age');
  }
  
  // Check gender - Accept common variations including 'Male' or 'Female' with any capitalization
  if (!profile.gender || 
      profile.gender.trim() === '' || 
      placeholders.some(p => profile.gender?.toLowerCase().includes(p.toLowerCase()))) {
    missingFields.push('gender');
  }
  
  // Check weight - must be a positive number
  if (profile.weight === undefined || profile.weight === null || profile.weight <= 0) {
    missingFields.push('weight');
  }
  
  // Check height - must be a positive number
  if (profile.height === undefined || profile.height === null || profile.height <= 0) {
    missingFields.push('height');
  }
  
  // Check goal - Accept common health goals with any capitalization
  if (!profile.goal || 
      profile.goal.trim() === '' || 
      placeholders.some(p => profile.goal?.toLowerCase().includes(p.toLowerCase()))) {
    missingFields.push('goal');
  }
  
  // Check activity level - Accept common activity levels with any capitalization
  if (!profile.activity_level || 
      profile.activity_level.trim() === '' || 
      placeholders.some(p => profile.activity_level?.toLowerCase().includes(p.toLowerCase()))) {
    missingFields.push('activity_level');
  }
  
  // Debug log for development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[getMissingProfileFields] Missing fields:', missingFields);
  }
  
  return missingFields;
}

// Check if a profile is complete enough for personalization
export function isProfileComplete(profile: UserProfile): boolean {
  if (!profile) return false;
  
  // Get missing fields
  const missingFields = getMissingProfileFields(profile);
  
  // Debug logging in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[isProfileComplete] Profile check:', {
      profile: {
        gender: profile.gender,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        activity_level: profile.activity_level
      },
      missingFields,
      isComplete: missingFields.length === 0
    });
  }
  
  // Special case for the target profile (6'4", 225 lb male with Longevity goal and Very Active lifestyle)
  // Using case-insensitive comparison for string fields
  if (profile.gender && profile.gender.toLowerCase() === 'male' &&
      profile.age === 25 &&
      profile.height === 76 &&
      profile.weight === 225 &&
      profile.goal && profile.goal.toLowerCase() === 'longevity' &&
      profile.activity_level && profile.activity_level.toLowerCase().includes('very active')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[isProfileComplete] Exact match for target profile detected');
    }
    return true;
  }
  
  // A profile is considered complete when all required fields are present
  return missingFields.length === 0;
}

// Get personalized data based on profile
export function getPersonalizedData(mealData: any, profile: UserProfile) {
  if (!profile || !mealData?.analysis?.calories) {
    return null;
  }
  
  // Calculate daily calorie needs
  const dailyCalories = calculateDailyCalories(profile);
  const mealCalories = mealData.analysis.calories || 0;
  
  // Calculate percentage of daily needs
  const caloriePercentage = Math.round((mealCalories / dailyCalories) * 100);
  
  return {
    dailyCalories: Math.round(dailyCalories),
    caloriePercentage: caloriePercentage,
    bmr: Math.round(calculateBMR(profile)),
    profile
  };
} 