// Human-friendly nutrient descriptions that explain what each nutrient does in simple terms

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

// Helper function to get human-friendly descriptions for nutrients
export const getNutrientDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    // Macronutrients - Simple, relatable descriptions
    'protein': 'Builds and repairs your muscles, keeps you feeling full longer, and helps your body recover after workouts. Think of it as your body\'s construction material.',
    'carbohydrates': 'Your body\'s main energy source, like premium fuel for your brain and muscles. Helps you feel energized and mentally sharp.',
    'fat': 'Necessary for absorbing vitamins, producing hormones, and keeping your skin healthy. Quality fats support brain function and reduce inflammation.',
    'fiber': 'Keeps your digestive system healthy, helps you feel full, and feeds the good bacteria in your gut. Great for steady energy levels.',
    'sugar': 'Quick energy that can spike your blood sugar. Natural sugars from fruits are better than added sugars in processed foods.',
    'sodium': 'Helps your muscles and nerves work properly, but too much can raise blood pressure. Most people get more than they need.',
    'saturated fat': 'Found in animal products and some oils. A little is okay, but too much may raise cholesterol levels in some people.',
    'trans fat': 'Artificial fats that are harmful to your heart and should be avoided completely. Check food labels to stay away from these.',
    'unsaturated fat': 'The "good" fats that support heart health and reduce inflammation. Found in olive oil, nuts, and fish.',
    'cholesterol': 'Your body makes what it needs, so dietary cholesterol has less impact than once thought. Focus on overall diet quality.',
    'calories': 'Units of energy your body uses for everything from breathing to exercising. Balance intake with activity for healthy weight.',
    
    // Vitamins - What they actually do for you
    'vitamin a': 'Keeps your eyes healthy, especially night vision, and supports your immune system. Important for healthy skin too.',
    'vitamin c': 'Powerful antioxidant that helps heal wounds, absorb iron, and fight off infections. Your body can\'t store it, so you need it daily.',
    'vitamin d': 'The "sunshine vitamin" that helps your body absorb calcium for strong bones and supports immune function. Many people don\'t get enough.',
    'vitamin e': 'Protects your cells from damage and supports immune function. Acts like a bodyguard for your cell membranes.',
    'vitamin k': 'Essential for blood clotting when you get injured and helps keep your bones strong. Found in leafy greens.',
    'vitamin b1': 'Helps convert food into energy and keeps your nervous system working properly. Important for brain function.',
    'vitamin b2': 'Helps your body produce energy from food and keeps your skin and eyes healthy. Also supports cell growth.',
    'vitamin b3': 'Supports energy production and helps maintain healthy cholesterol levels. Important for brain and skin health.',
    'vitamin b5': 'Helps break down fats and carbohydrates for energy and is important for making hormones and cholesterol.',
    'vitamin b6': 'Helps your body make neurotransmitters that regulate mood and sleep. Also important for immune function.',
    'vitamin b7': 'Helps your body process fats, carbohydrates, and proteins. Important for healthy hair, skin, and nails.',
    'vitamin b9': 'Essential for making DNA and red blood cells. Especially important for pregnant women to prevent birth defects.',
    'vitamin b12': 'Keeps your nerves and blood cells healthy and helps make DNA. Mainly found in animal products.',
    
    // Minerals - What they do in your body
    'calcium': 'Builds and maintains strong bones and teeth. Also helps your muscles contract and your blood clot properly.',
    'iron': 'Carries oxygen throughout your body in your blood. Low iron can make you feel tired and weak.',
    'potassium': 'Helps your muscles work properly, including your heart muscle. May help lower blood pressure.',
    'magnesium': 'Involved in over 300 body processes including energy production, muscle function, and bone health.',
    'zinc': 'Supports your immune system, helps wounds heal, and is important for taste and smell.',
    'phosphorus': 'Works with calcium to build strong bones and teeth. Also helps your body store and use energy.',
    'selenium': 'Acts as an antioxidant to protect your cells from damage and supports thyroid function.',
    'iodine': 'Essential for making thyroid hormones that control your metabolism and energy levels.',
    'copper': 'Helps your body absorb iron and supports healthy connective tissues and immune function.',
    'manganese': 'Helps with bone formation, wound healing, and processing carbohydrates and cholesterol.',
    'chromium': 'May help your body use insulin more effectively to control blood sugar levels.',
    'molybdenum': 'Helps your body process certain amino acids and break down toxins. Needed in very small amounts.'
  };
  
  const exactMatch = descriptions[name.toLowerCase()];
  if (exactMatch) return exactMatch;
  
  // Check for partial matches with simple explanations
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes('vitamin b') || lowercaseName.match(/b\d+/) || lowercaseName.includes('b vitamin')) {
    return 'B vitamins help your body turn food into energy and keep your nervous system healthy. They work together as a team.';
  }
  
  if (lowercaseName.includes('vitamin')) {
    return 'Vitamins are essential nutrients your body needs in small amounts to function properly and stay healthy.';
  }
  
  // Check for mineral partial matches
  const minerals = ['iron', 'calcium', 'zinc', 'magnesium', 'potassium', 'sodium', 'copper', 'manganese', 'selenium'];
  for (const mineral of minerals) {
    if (lowercaseName.includes(mineral)) {
      return descriptions[mineral] || 'Essential mineral that helps your body function properly and maintain good health.';
    }
  }
  
  return 'Important nutrient that supports your body\'s daily functions and overall health.';
};

// Enhanced nutrient descriptions with more context
export const getEnhancedNutrientDescription = (nutrient: Nutrient): string => {
  const baseDescription = getNutrientDescription(nutrient.name);
  const amount = nutrient.amount;
  const unit = nutrient.unit;
  const dv = nutrient.percentDailyValue;
  
  let contextualInfo = '';
  
  // Add context based on the amount and daily value
  if (dv && dv > 0) {
    if (dv >= 50) {
      contextualInfo = ` This meal provides an excellent amount (${dv}% of daily needs).`;
    } else if (dv >= 25) {
      contextualInfo = ` This meal provides a good amount (${dv}% of daily needs).`;
    } else if (dv >= 10) {
      contextualInfo = ` This meal provides a moderate amount (${dv}% of daily needs).`;
    } else {
      contextualInfo = ` This meal provides a small amount (${dv}% of daily needs).`;
    }
  }
  
  return baseDescription + contextualInfo;
}; 