import React from 'react';

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
}

interface MacroCardProps {
  macronutrient: Nutrient;
}

export const MacroCard: React.FC<MacroCardProps> = ({ macronutrient }) => {
  const { name, amount, unit, percentDailyValue, description } = macronutrient;
  
  // Define colors based on nutrient type
  const getColorScheme = () => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('protein')) {
      return {
        bg: 'bg-blue-50',
        accent: 'text-blue-700',
        progressBg: 'bg-blue-200',
        progress: 'bg-blue-600'
      };
    } else if (lowerName.includes('carb') || lowerName.includes('sugar')) {
      return {
        bg: 'bg-amber-50',
        accent: 'text-amber-700',
        progressBg: 'bg-amber-200',
        progress: 'bg-amber-600'
      };
    } else if (lowerName.includes('fat')) {
      return {
        bg: 'bg-purple-50',
        accent: 'text-purple-700',
        progressBg: 'bg-purple-200',
        progress: 'bg-purple-600'
      };
    } else if (lowerName.includes('fiber')) {
      return {
        bg: 'bg-green-50',
        accent: 'text-green-700',
        progressBg: 'bg-green-200',
        progress: 'bg-green-600'
      };
    } else {
      return {
        bg: 'bg-gray-50',
        accent: 'text-gray-700',
        progressBg: 'bg-gray-200',
        progress: 'bg-gray-600'
      };
    }
  };
  
  const colors = getColorScheme();
  
  // Ensure percentDailyValue is between 0-100 for display purposes
  const displayPercent = percentDailyValue 
    ? Math.min(percentDailyValue, 100) 
    : null;
  
  return (
    <div className={`${colors.bg} rounded-xl p-5 h-full`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
        <div className={`${colors.accent} font-bold text-2xl`}>
          {amount} {unit}
        </div>
      </div>
      
      {displayPercent !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Daily Value</span>
            <span className={`${colors.accent} font-semibold`}>{percentDailyValue}%</span>
          </div>
          <div className={`w-full h-2 ${colors.progressBg} rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${colors.progress} rounded-full`} 
              style={{ width: `${displayPercent}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {description && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Why it matters</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      )}
    </div>
  );
}; 