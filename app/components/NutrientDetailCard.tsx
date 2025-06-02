'use client';

import React, { useState } from 'react';
import { cn } from '../lib/utils';

interface NutrientDetailCardProps {
  nutrient: {
    name: string;
    amount?: number;
    unit?: string;
    percentDailyValue?: number;
    description?: string;
    status?: 'low' | 'adequate' | 'high';
  };
  highlight?: boolean;
  className?: string;
}

export default function NutrientDetailCard({ 
  nutrient, 
  highlight = false,
  className = ''
}: NutrientDetailCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Safety checks for missing fields
  const name = nutrient.name || 'Unknown Nutrient';
  const amount = nutrient.amount || 0;
  const unit = nutrient.unit || '';
  const percentDailyValue = nutrient.percentDailyValue || 0;
  
  // Determine status colors
  const statusColor = nutrient.status === 'low' 
    ? 'text-yellow-400' 
    : nutrient.status === 'high' 
      ? 'text-red-400' 
      : 'text-green-400';
  
  return (
    <div 
      className={cn(
        "p-4 bg-gray-800/70 rounded-lg border border-gray-700/50 transition-all",
        highlight ? "border-blue-500/50 shadow-md shadow-blue-500/10" : "",
        expanded ? "shadow-lg" : "",
        className
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-200">
          {name}
        </h3>
        {percentDailyValue > 0 && (
          <span className={`text-xs font-semibold ${statusColor}`}>
            {percentDailyValue}% DV
          </span>
        )}
      </div>
      
      <div className="mt-1 flex items-baseline">
        <span className="text-lg font-semibold text-white">{amount}</span>
        <span className="ml-1 text-xs text-gray-400">{unit}</span>
      </div>
      
      {expanded && (
        <div className="mt-3 text-xs text-gray-400 border-t border-gray-700/50 pt-2">
          {nutrient.description && (
            <p className="mb-2">{nutrient.description}</p>
          )}
          
          <div className="flex justify-between text-xs">
            <span className={statusColor}>
              {nutrient.status === 'low' 
                ? 'Low - consider increasing' 
                : nutrient.status === 'high' 
                  ? 'High - consider reducing' 
                  : 'Adequate level'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 