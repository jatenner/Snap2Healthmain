import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface NutrientDisplayProps {
  nutrients: any;
  userProfile?: any;
}

export default function NutrientDisplay({ nutrients, userProfile }: NutrientDisplayProps) {
  if (!nutrients) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Nutrient Information Unavailable</h3>
        <p>We weren't able to analyze the nutritional content of this meal.</p>
      </div>
    );
  }

  // Function to get daily value percentage based on user profile if available
  const getDailyValuePercentage = (nutrient: any) => {
    if (!nutrient || !nutrient.amount || !nutrient.dailyValue) return null;
    
    let dailyValue = nutrient.dailyValue;
    
    // Adjust daily values based on profile if available
    if (userProfile) {
      const age = userProfile.age || 30;
      const sex = userProfile.sex || 'unknown';
      
      // Example adjustment logic (simplified)
      if (nutrient.name === 'Protein' && userProfile.goal === 'Muscle Gain') {
        dailyValue = dailyValue * 1.5; // Higher protein for muscle gain
      }
      
      if (['Iron', 'Calcium', 'Folate'].includes(nutrient.name) && sex === 'female') {
        // Higher needs for females for certain nutrients
        dailyValue = dailyValue * 1.2;
      }
    }
    
    const percentage = (nutrient.amount / dailyValue) * 100;
    return Math.round(percentage);
  };

  return (
    <div className="space-y-6">
      {/* Calories */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Calories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{nutrients.calories || 0} kcal</div>
        </CardContent>
      </Card>

      {/* Macronutrients */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Macronutrients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nutrients.macronutrients && nutrients.macronutrients.map((nutrient: any, index: number) => (
              <div key={index} className="flex flex-col border rounded-lg p-3">
                <span className="font-semibold text-lg">{nutrient.name}</span>
                <span className="text-2xl font-bold">{nutrient.amount}{nutrient.unit}</span>
                {getDailyValuePercentage(nutrient) && (
                  <span className="text-sm text-gray-500">
                    {getDailyValuePercentage(nutrient)}% of Daily Value
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Micronutrients */}
      {nutrients.micronutrients && nutrients.micronutrients.length > 0 && (
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Micronutrients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nutrients.micronutrients.map((nutrient: any, index: number) => (
                <div key={index} className="flex justify-between border-b py-1">
                  <span>{nutrient.name}</span>
                  <span className="font-medium">{nutrient.amount}{nutrient.unit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 