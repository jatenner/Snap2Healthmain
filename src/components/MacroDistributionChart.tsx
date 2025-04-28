import React from 'react';

interface MacroDistributionChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

export default function MacroDistributionChart({ protein, carbs, fat }: MacroDistributionChartProps) {
  const total = protein + carbs + fat;
  
  // Calculate percentages
  const proteinPercent = total > 0 ? Math.round((protein / total) * 100) : 0;
  const carbsPercent = total > 0 ? Math.round((carbs / total) * 100) : 0;
  const fatPercent = total > 0 ? Math.round((fat / total) * 100) : 0;
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex w-full h-6 rounded-md overflow-hidden mb-2">
        <div 
          className="bg-blue-500 h-full"
          style={{ width: `${proteinPercent}%` }}
        />
        <div 
          className="bg-green-500 h-full"
          style={{ width: `${carbsPercent}%` }}
        />
        <div 
          className="bg-yellow-500 h-full"
          style={{ width: `${fatPercent}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1" />
          <span>Protein: {proteinPercent}% ({protein}g)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1" />
          <span>Carbs: {carbsPercent}% ({carbs}g)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1" />
          <span>Fat: {fatPercent}% ({fat}g)</span>
        </div>
      </div>
    </div>
  );
} 