import React from 'react';

interface MacroDistributionChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

export default function MacroDistributionChart({ protein, carbs, fat }: MacroDistributionChartProps) {
  // Ensure all values are numeric
  const proteinValue = typeof protein === 'number' ? protein : 0;
  const carbsValue = typeof carbs === 'number' ? carbs : 0;
  const fatValue = typeof fat === 'number' ? fat : 0;
  
  const total = proteinValue + carbsValue + fatValue;
  
  // Calculate percentages with minimum size to avoid invisible bars
  const proteinPercent = total > 0 ? Math.max(5, Math.round((proteinValue / total) * 100)) : 33;
  const carbsPercent = total > 0 ? Math.max(5, Math.round((carbsValue / total) * 100)) : 34;
  const fatPercent = total > 0 ? Math.max(5, Math.round((fatValue / total) * 100)) : 33;
  
  // Format values for display
  const formatValue = (value: number) => {
    if (value === 0) return "0g";
    if (value < 1) return value.toFixed(1) + "g";
    return value.toFixed(1) + "g";
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex w-full h-6 rounded-md overflow-hidden mb-2">
        <div 
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${proteinPercent}%` }}
        />
        <div 
          className="bg-green-500 h-full transition-all duration-300"
          style={{ width: `${carbsPercent}%` }}
        />
        <div 
          className="bg-yellow-500 h-full transition-all duration-300"
          style={{ width: `${fatPercent}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1" />
          <span>Protein: {proteinPercent}% ({formatValue(proteinValue)})</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1" />
          <span>Carbs: {carbsPercent}% ({formatValue(carbsValue)})</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1" />
          <span>Fat: {fatPercent}% ({formatValue(fatValue)})</span>
        </div>
      </div>
    </div>
  );
} 