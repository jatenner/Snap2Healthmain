// Utility functions for nutrient analysis and descriptions

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
  category?: string;
}

// Filter out nutrients with zero or near-zero values
export const filterRelevantNutrients = (nutrients: Nutrient[] = []): Nutrient[] => {
  return nutrients.filter(nutrient => {
    return nutrient.amount > 0 && nutrient.amount > 0.01;
  });
};

// Get human-friendly nutrient descriptions
export const getHumanFriendlyDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    'protein': 'Builds and repairs muscles, keeps you full longer, and helps recovery after workouts.',
    'carbohydrates': 'Your main energy source for brain and muscle function.',
    'fat': 'Essential for vitamin absorption, hormone production, and brain health.',
    'fiber': 'Supports digestive health and helps you feel full.',
    'vitamin d': 'The sunshine vitamin that helps absorb calcium and supports immune function.',
    'vitamin c': 'Powerful antioxidant that helps heal wounds and fight infections.',
    'calcium': 'Builds strong bones and teeth, helps muscles contract.',
    'iron': 'Carries oxygen in your blood - low iron causes fatigue.',
    'potassium': 'Helps muscles work properly and may lower blood pressure.',
    'magnesium': 'Involved in 300+ body processes including energy production.',
    'zinc': 'Supports immune system and helps wounds heal.',
    'sodium': 'Helps muscles and nerves work, but too much raises blood pressure.'
  };
  
  const key = name.toLowerCase();
  return descriptions[key] || 'Important nutrient that supports your body\'s functions.';
}; 