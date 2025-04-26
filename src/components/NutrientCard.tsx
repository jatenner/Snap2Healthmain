import React from 'react';
import { MacroNutrient, MicroNutrient } from '../lib/gpt/validator';
import { cn } from '../lib/utils';

interface NutrientCardProps {
  nutrient: MacroNutrient | MicroNutrient;
  className?: string;
}

export function NutrientCard({ nutrient, className }: NutrientCardProps) {
  // Determine color based on % Daily Value if available
  const getPercentColor = (percent: number | null | undefined) => {
    if (percent === null || percent === undefined) return 'bg-gray-100';
    if (percent < 10) return 'bg-red-100';
    if (percent < 30) return 'bg-yellow-100';
    if (percent < 70) return 'bg-green-100';
    return 'bg-green-200';
  };

  return (
    <div className={cn(
      'rounded-lg p-4 shadow-sm',
      getPercentColor(nutrient.percentDailyValue),
      className
    )}>
      <h3 className="font-medium text-gray-900">{nutrient.name}</h3>
      <div className="mt-1 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {nutrient.amount} {nutrient.unit}
        </span>
        {nutrient.percentDailyValue !== null && nutrient.percentDailyValue !== undefined && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white">
            {nutrient.percentDailyValue}% DV
          </span>
        )}
      </div>
    </div>
  );
} 