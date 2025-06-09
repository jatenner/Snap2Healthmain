// Personalized, actionable nutrient insights for athletic performance

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

// Helper function to filter out nutrients with zero or near-zero values
export const filterRelevantNutrients = (nutrients: Nutrient[] = []): Nutrient[] => {
  return nutrients.filter(nutrient => {
    // Keep nutrient if it has a meaningful amount
    return nutrient.amount > 0 && nutrient.amount > 0.01; // Filter out trace amounts
  });
};

// Personalized, actionable nutrient insights for athletic performance
export const getNutrientDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    // Macronutrients - Athletic performance focused
    'protein': 'Perfect for muscle recovery and growth after your workouts. At 225 lbs with athletic goals, you need plenty of quality protein to maintain and build lean mass.',
    'carbohydrates': 'Fuel for high-intensity training and brain power. This amount will help replenish muscle glycogen stores and keep your energy steady.',
    'fat': 'Essential for hormone production (including testosterone), joint health, and absorbing fat-soluble vitamins. Quality fats support recovery and reduce exercise-induced inflammation.',
    'fiber': 'Helps with satiety and digestive health. Good fiber intake supports steady energy levels and helps your body efficiently use all the nutrients from this meal.',
    'sugar': 'Quick energy that can be useful around workouts, but watch total daily intake. Natural sugars from whole foods are better than processed sources.',
    'sodium': 'Critical for hydration and muscle function, especially if you sweat a lot during training. This amount helps maintain proper electrolyte balance.',
    'saturated fat': 'Some is necessary for hormone production, but balance with unsaturated fats. From quality sources like grass-fed meat, it supports testosterone levels.',
    'trans fat': 'Avoid completely - these artificial fats increase inflammation and impair recovery. Check labels on processed foods.',
    'unsaturated fat': 'Anti-inflammatory fats that support recovery, heart health, and brain function. Great for athletes who train intensely.',
    'cholesterol': 'Your body needs some for hormone production. Dietary cholesterol has minimal impact on blood cholesterol for most active people.',
    'calories': 'Energy to fuel your training and recovery. At your size and activity level, adequate calories prevent muscle loss and support performance.',
    
    // Vitamins - Performance and recovery focused
    'vitamin a': 'Supports immune function and vision - important when training hard as intense exercise can temporarily suppress immunity.',
    'vitamin c': 'Powerful antioxidant that reduces exercise-induced oxidative stress and supports collagen synthesis for joint health.',
    'vitamin d': 'The hormone vitamin that supports testosterone production, bone health, and muscle function. Many athletes are deficient, especially in winter.',
    'vitamin e': 'Protects cell membranes from exercise-induced damage. Works with other antioxidants to reduce inflammation from intense training.',
    'vitamin k': 'Essential for bone health and blood clotting. Important for athletes at risk of stress fractures or training injuries.',
    'vitamin b1': 'Converts carbs to energy for your workouts. Needs increase with higher carb intake and intense training.',
    'vitamin b2': 'Key for energy production and red blood cell formation. Helps your body efficiently use oxygen during exercise.',
    'vitamin b3': 'Supports energy metabolism and may help with recovery. Can improve blood flow and reduce exercise-induced fatigue.',
    'vitamin b5': 'Essential for converting fats and carbs into usable energy. Supports adrenal function during training stress.',
    'vitamin b6': 'Critical for protein metabolism and neurotransmitter production. Helps with mood regulation and recovery from training stress.',
    'vitamin b7': 'Supports energy metabolism and protein synthesis. Important for athletes with high protein needs.',
    'vitamin b9': 'Essential for red blood cell production and DNA repair. Important for recovery and adaptation to training.',
    'vitamin b12': 'Critical for energy production and nervous system function. Deficiency can significantly impact training performance.',
    
    // Minerals - Athletic performance context
    'calcium': 'Essential for bone health and muscle contractions. Important for preventing stress fractures and optimizing muscle function.',
    'iron': 'Carries oxygen to your muscles. Even mild deficiency can severely impact endurance and training capacity.',
    'potassium': 'Key electrolyte for muscle function and blood pressure regulation. Lost in sweat during intense training.',
    'magnesium': 'Critical for muscle function, energy production, and sleep quality. Many athletes are deficient, leading to cramps and poor recovery.',
    'zinc': 'Supports testosterone production, immune function, and protein synthesis. Lost in sweat and crucial for male athletes.',
    'phosphorus': 'Works with calcium for bone health and energy storage. Important for high-intensity, explosive movements.',
    'selenium': 'Antioxidant that protects against exercise-induced oxidative damage. Supports thyroid function and metabolism.',
    'iodine': 'Essential for thyroid hormones that regulate metabolism and energy levels. Important for maintaining training intensity.',
    'copper': 'Supports iron absorption and collagen formation. Important for joint health and oxygen transport.',
    'manganese': 'Supports bone formation and wound healing. Important for athletes at risk of overuse injuries.',
    'chromium': 'May improve insulin sensitivity and help with body composition goals. Can support better nutrient partitioning.',
    'molybdenum': 'Helps process amino acids from your protein intake. Works behind the scenes to support protein metabolism.'
  };
  
  const exactMatch = descriptions[name.toLowerCase()];
  if (exactMatch) return exactMatch;
  
  // Check for partial matches with athletic context
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes('vitamin b') || lowercaseName.match(/b\d+/) || lowercaseName.includes('b vitamin')) {
    return 'B-complex vitamins work together to convert food into energy and support nervous system function - critical for athletic performance and recovery.';
  }
  
  if (lowercaseName.includes('vitamin')) {
    return 'Essential micronutrient that supports optimal body function and athletic performance. Make sure you\'re getting enough through whole foods.';
  }
  
  // Check for mineral partial matches with athletic context
  const minerals = ['iron', 'calcium', 'zinc', 'magnesium', 'potassium', 'sodium', 'copper', 'manganese', 'selenium'];
  for (const mineral of minerals) {
    if (lowercaseName.includes(mineral)) {
      return descriptions[mineral] || 'Essential mineral that supports athletic performance, recovery, and overall health. Important for active individuals.';
    }
  }
  
  return 'Important nutrient that supports your training goals and overall performance. Consider tracking your intake to optimize results.';
};

// Enhanced nutrient descriptions with personalized insights
export const getEnhancedNutrientDescription = (nutrient: Nutrient, userGoal?: string): string => {
  const baseDescription = getNutrientDescription(nutrient.name);
  const amount = nutrient.amount;
  const dv = nutrient.percentDailyValue;
  
  let insight = '';
  
  // Add personalized insights based on amount and athletic goals
  if (dv && dv > 0) {
    if (dv >= 100) {
      insight = ` Excellent! This meal covers your full daily needs and then some - great for supporting your athletic performance.`;
    } else if (dv >= 50) {
      insight = ` Solid contribution! This meal provides over half your daily needs (${Math.round(dv)}%).`;
    } else if (dv >= 25) {
      insight = ` Good amount here - this meal provides ${Math.round(dv)}% of your daily target.`;
    } else if (dv >= 10) {
      insight = ` This meal contributes ${Math.round(dv)}% toward your daily goal. Consider adding more sources throughout the day.`;
    } else if (dv < 10 && dv > 0) {
      insight = ` Small contribution (${Math.round(dv)}%). Look for other meals to meet your athletic needs.`;
    }
  } else if (amount === 0) {
    insight = ` Missing from this meal. Consider adding foods rich in this nutrient to support your training goals.`;
  }
  
  return baseDescription + insight;
}; 