'use client';

import React from 'react';

type MacroChartProps = {
  macros?: {
    name: string;
    amount: number;
    unit: string;
    percentDailyValue?: number;
  }[];
  calories?: number;
};

const MacroChart: React.FC<MacroChartProps> = ({ macros = [], calories = 0 }) => {
  // Extract the primary macros (protein, carbs, fat)
  const protein = macros.find(m => 
    m.name.toLowerCase() === 'protein' || 
    m.name.toLowerCase().includes('protein')
  );
  
  const carbs = macros.find(m => 
    m.name.toLowerCase() === 'carbohydrates' || 
    m.name.toLowerCase() === 'carbs' ||
    m.name.toLowerCase().includes('carb')
  );
  
  const fat = macros.find(m => 
    m.name.toLowerCase() === 'fat' || 
    m.name.toLowerCase() === 'fats' ||
    m.name.toLowerCase().includes('fat')
  );

  // Calculate the total for percentage
  const proteinAmount = protein?.amount || 0;
  const carbsAmount = carbs?.amount || 0;
  const fatAmount = fat?.amount || 0;
  
  // Calculate calories from macros (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
  const proteinCalories = proteinAmount * 4;
  const carbsCalories = carbsAmount * 4;
  const fatCalories = fatAmount * 9;
  
  const totalCalories = calories || (proteinCalories + carbsCalories + fatCalories) || 100;
  
  // Calculate percentages
  const proteinPercentage = Math.round((proteinCalories / totalCalories) * 100) || 0;
  const carbsPercentage = Math.round((carbsCalories / totalCalories) * 100) || 0;
  const fatPercentage = Math.round((fatCalories / totalCalories) * 100) || 0;
  
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Macronutrient Distribution</h3>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${proteinPercentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-700">Protein: {proteinPercentage}%</span>
        </div>
        <div className="w-4" />
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${carbsPercentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-700">Carbs: {carbsPercentage}%</span>
        </div>
        <div className="w-4" />
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 rounded-full" 
              style={{ width: `${fatPercentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-700">Fat: {fatPercentage}%</span>
        </div>
      </div>
      <div className="text-sm text-gray-600 text-center">
        Total Calories: {totalCalories}
      </div>
    </div>
  );
};

export default MacroChart; 