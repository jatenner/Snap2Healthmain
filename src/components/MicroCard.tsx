import React from 'react';
import { Nutrient } from './MacroCard';

interface MicroCardProps {
  micronutrient: Nutrient;
}

export const MicroCard: React.FC<MicroCardProps> = ({ micronutrient }) => {
  const { name, amount, unit, percentDailyValue, description } = micronutrient;
  
  // Define the color scheme based on whether the DV is high or low
  const getColorScheme = () => {
    if (!percentDailyValue) return {
      accent: 'text-gray-700',
      progress: 'bg-gray-600'
    };
    
    if (percentDailyValue >= 50) {
      return {
        accent: 'text-emerald-700',
        progress: 'bg-emerald-600'
      };
    } else if (percentDailyValue >= 25) {
      return {
        accent: 'text-blue-700',
        progress: 'bg-blue-600'
      };
    } else {
      return {
        accent: 'text-amber-700',
        progress: 'bg-amber-600'
      };
    }
  };
  
  const colors = getColorScheme();
  
  // Ensure percentDailyValue is between 0-100 for display purposes
  const displayPercent = percentDailyValue 
    ? Math.min(percentDailyValue, 100) 
    : 0;
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 h-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-gray-800">{name}</h3>
        <div className={`${colors.accent} font-bold text-sm`}>
          {amount} {unit}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Daily Value</span>
          {percentDailyValue && (
            <span className={`${colors.accent} font-medium`}>{percentDailyValue}%</span>
          )}
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors.progress} rounded-full`} 
            style={{ width: `${displayPercent}%` }}
          ></div>
        </div>
      </div>
      
      {description && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
        </div>
      )}
    </div>
  );
}; 