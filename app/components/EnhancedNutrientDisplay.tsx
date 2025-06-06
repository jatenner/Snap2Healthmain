'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../lib/nutrition-utils';
import { cn } from '../lib/utils';
import { categorizePDV, calculateDVPercent, FDA_DAILY_VALUES } from '../lib/profile-utils';

// Define types
interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number | null | undefined;
  dv_percent?: number | null | undefined;
  description?: string;
  status?: 'low' | 'adequate' | 'high';
}

interface EnhancedNutrientDisplayProps {
  nutrient: Nutrient;
  userProfile?: UserProfile | null;
  colorScheme?: 'default' | 'macro' | 'micro' | 'vitamin' | 'mineral';
  showDescription?: boolean;
  highlightLevel?: 'low' | 'normal' | 'high';
  size?: 'small' | 'medium' | 'large';
  getPersonalizedDV?: (nutrient: Nutrient) => PersonalizedDV;
}

interface PersonalizedDV {
  personalizedValue: number;
  standardValue: number;
  category: string;
  tooltipText: string;
}

// Safe toLowerCase function to prevent errors
const safeToLowerCase = (str?: string): string => {
  if (!str) return '';
  return String(str).toLowerCase();
};

// Safe nutrient getter function
const getNutrientAmount = (nutrients: any, name: string): number => {
  if (!nutrients) return 0;
  
  // Handle different nutrient structures
  let macroArray: any[] = [];
  if (nutrients.macronutrients && Array.isArray(nutrients.macronutrients)) {
    macroArray = nutrients.macronutrients;
  } else if (Array.isArray(nutrients)) {
    macroArray = nutrients;
  }
  
  // Safely find matching nutrient
  const found = macroArray.find(
    (n: any) => n && n.name && safeToLowerCase(n.name) === safeToLowerCase(name)
  );
  
  return typeof found?.amount === 'number' ? found.amount : 0;
};

// Add null checks to prevent toLowerCase errors
const NUTRIENT_DESCRIPTIONS: Record<string, string> = {
  'protein': 'Essential for muscle building, tissue repair, and overall growth.',
  'carbohydrates': 'Primary source of energy for the body and brain.',
  'carbs': 'Primary source of energy for the body and brain.',
  'fat': 'Important for cell growth, energy storage, and vitamin absorption.',
  'saturated fat': 'A type of dietary fat that should be consumed in moderation.',
  'trans fat': 'Artificially created fats that should be minimized in the diet.',
  'unsaturated fat': 'Healthier fats found in foods like olive oil, nuts, and avocados.',
  'fiber': 'Aids digestion, helps maintain bowel health, and can reduce cholesterol.',
  'sugar': 'Provides quick energy but should be consumed in moderation.',
  'sodium': 'Helps maintain fluid balance and is needed for muscle and nerve function.',
  'calcium': 'Essential for strong bones, teeth, and proper muscle function.',
  'iron': 'Critical for oxygen transport in the blood and energy production.',
  'potassium': 'Helps regulate fluid balance and muscle contractions.',
  'vitamin a': 'Important for vision, immune function, and cell growth.',
  'vitamin c': 'Supports immune function and acts as an antioxidant.',
  'vitamin d': 'Vital for calcium absorption and bone health.',
  'vitamin e': 'Acts as an antioxidant and supports immune function.',
  'vitamin k': 'Essential for blood clotting and bone health.',
  'thiamin': 'Helps convert food into energy and supports nervous system function.',
  'thiamine': 'Helps convert food into energy and supports nervous system function.',
  'riboflavin': 'Important for growth, development, and function of cells.',
  'niacin': 'Helps convert food into energy and maintains healthy skin and nerves.',
  'vitamin b6': 'Important for brain development and function, and helps the body make hormones.',
  'folate': 'Critical for cell division and DNA formation.',
  'vitamin b12': 'Necessary for nerve function, DNA production, and red blood cell formation.',
  'biotin': 'Helps metabolize fats, carbohydrates, and proteins.',
  'pantothenic acid': 'Helps convert food into energy and synthesize hormones.',
  'phosphorus': 'Works with calcium to form bones and teeth.',
  'iodine': 'Essential for thyroid function and metabolism regulation.',
  'magnesium': 'Supports muscle and nerve function and energy production.',
  'zinc': 'Important for immune function, wound healing, and cell division.',
  'selenium': 'Acts as an antioxidant and supports immune function.',
  'copper': 'Helps form red blood cells and maintains nerve cells and the immune system.',
  'manganese': 'Involved in bone formation and metabolism of carbohydrates and protein.',
  'chromium': 'Helps regulate blood sugar by working with insulin.',
  'molybdenum': 'Helps process proteins and genetic material.'
};

const EnhancedNutrientDisplay: React.FC<EnhancedNutrientDisplayProps> = ({
  nutrient,
  userProfile,
  colorScheme = 'default',
  showDescription = false,
  highlightLevel = 'normal',
  size = 'medium',
  getPersonalizedDV
}) => {
  // Safety check - if no nutrient provided, show placeholder
  if (!nutrient || typeof nutrient !== 'object') {
    return (
      <div className="bg-gray-800/40 rounded-lg p-3">
        <p className="text-gray-400">No nutrient data available</p>
      </div>
    );
  }

  const [expanded, setExpanded] = useState(showDescription);
  const [hasAppeared, setHasAppeared] = useState(false);
  
  // Ensure nutrient values are valid and get DV% from either field
  const safeNutrient = {
    name: nutrient.name || 'Unknown',
    amount: typeof nutrient.amount === 'number' ? nutrient.amount : 0,
    unit: nutrient.unit || 'g',
    percentDailyValue: (() => {
      if (typeof nutrient.percentDailyValue === 'number') {
        return nutrient.percentDailyValue;
      }
      if (nutrient.percentDailyValue === null) {
        return null; // Respect explicit null from primary source
      }
      // At this point, nutrient.percentDailyValue is undefined. Try dv_percent.
      if (typeof nutrient.dv_percent === 'number') {
        return nutrient.dv_percent;
      }
      if (nutrient.dv_percent === null) {
        return null; // Respect explicit null from secondary source
      }
      // Both nutrient.percentDailyValue and nutrient.dv_percent are undefined.
      // Fallback to calculation only if both are undefined.
      return calculateDVPercent(nutrient.name, nutrient.amount, nutrient.unit || 'g');
    })(),
    description: nutrient.description || '',
    status: nutrient.status
  };
  
  // Calculate personalized DV using the provided function or use default values
  let pdvInfo: PersonalizedDV;
  
  try {
    if (getPersonalizedDV) {
      pdvInfo = getPersonalizedDV(safeNutrient);
    } else {
      // Fallback to standard values
      const standardDV = safeNutrient.percentDailyValue || 0;
      pdvInfo = {
        personalizedValue: standardDV,
        standardValue: standardDV,
        category: categorizePDV(standardDV),
        tooltipText: 'Based on standard daily values'
      };
    }
  } catch (error) {
    // Fallback if anything goes wrong
    pdvInfo = {
      personalizedValue: 0,
      standardValue: 0,
      category: 'Unknown',
      tooltipText: 'Could not calculate daily value'
    };
  }
  
  // Get description from our comprehensive database or use existing
  const description = safeNutrient.description || 
    NUTRIENT_DESCRIPTIONS[safeToLowerCase(safeNutrient.name)] || 
    `${safeNutrient.name} is an important nutrient for overall health.`;
  
  // Check if we're using personalized values
  const isPersonalized = !!userProfile;
  
  // Add animation effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAppeared(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Use the personalized value for calculations
  const percentDV = pdvInfo.personalizedValue;
  const standardDV = pdvInfo.standardValue;
  const category = pdvInfo.category;
  
  // Get category color
  const getCategoryColor = () => {
    if (percentDV === null || typeof percentDV === 'undefined') return 'text-gray-400';
    switch(category) {
      case 'Low': return 'text-yellow-400';
      case 'Adequate': return 'text-green-400';
      case 'High': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };
  
  // Check if this is a limit nutrient (one that should be limited)
  const isLimitNutrient = (() => {
    const name = safeToLowerCase(safeNutrient.name);
    const fdaInfo = FDA_DAILY_VALUES[name];
    return fdaInfo?.isLimit || 
      ['sodium', 'sugar', 'added sugar', 'saturated fat', 'trans fat', 'cholesterol'].includes(name);
  })();
  
  // Define colors based on color scheme and if it's a limit nutrient
  const getBarColor = () => {
    if (percentDV === null || typeof percentDV === 'undefined') return 'bg-gray-600';
    if (isLimitNutrient) {
      if (category === 'High') return 'bg-red-500';
      if (category === 'Adequate') return 'bg-yellow-400';
      return 'bg-green-400';
    }
    
    // Regular nutrients (high = good)
    if (colorScheme === 'macro') {
      if (category === 'High') return 'bg-blue-500';
      if (category === 'Adequate') return 'bg-blue-400';
      return 'bg-blue-300';
    } else if (colorScheme === 'micro') {
      if (category === 'High') return 'bg-green-500';
      if (category === 'Adequate') return 'bg-green-400';
      return 'bg-green-300';
    } else if (colorScheme === 'vitamin') {
      if (category === 'High') return 'bg-amber-500';
      if (category === 'Adequate') return 'bg-amber-400';
      return 'bg-amber-300';
    } else if (colorScheme === 'mineral') {
      if (category === 'High') return 'bg-purple-500';
      if (category === 'Adequate') return 'bg-purple-400';
      return 'bg-purple-300';
    } else {
      if (category === 'High') return 'bg-blue-500';
      if (category === 'Adequate') return 'bg-blue-400';
      return 'bg-blue-300';
    }
  };
  
  // Size classes
  const getSizeClasses = () => {
    // Using a simplified structure to avoid previous linter issues with complex/missing class names
    switch (size) {
      case 'small':
        return { textClass: 'text-xs', barHeight: 'h-1.5' };
      case 'large':
        return { textClass: 'text-lg', barHeight: 'h-3' };
      default: // medium
        return { textClass: 'text-base', barHeight: 'h-2' };
    }
  };
  
  const sizeClasses = getSizeClasses();
  
  // Nutrient name and amount
  const nameDisplay = <span className={cn("font-semibold", sizeClasses.textClass)}>{safeNutrient.name}</span>;
  const amountDisplay = <span className={cn("font-bold", sizeClasses.textClass)}>{safeNutrient.amount}{safeNutrient.unit}</span>;

  // DV% display - handle null/undefined
  const dvDisplay = (percentDV === null || typeof percentDV === 'undefined')
    ? <span className={cn("text-xs", getCategoryColor())}> (N/A DV)</span>
    : <span className={cn("text-xs", getCategoryColor())}> ({percentDV.toFixed(0)}% DV)</span>;
  
  return (
    <div 
      className={cn(
        'relative bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors',
        expanded ? 'ring-1 ring-blue-500/40' : '',
        sizeClasses.barHeight,
        hasAppeared ? 'opacity-100' : 'opacity-0',
        'transition-opacity duration-500 cursor-pointer'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Badge for DV category */}
      <div className="absolute top-2 right-2">
        <span 
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            isLimitNutrient ? 
              (category === 'High' ? 'bg-red-900/60 text-red-200' : 
               category === 'Adequate' ? 'bg-yellow-900/60 text-yellow-200' : 
               'bg-green-900/60 text-green-200') :
              (category === 'High' ? 'bg-blue-900/60 text-blue-200' : 
               category === 'Adequate' ? 'bg-green-900/60 text-green-200' : 
               'bg-yellow-900/60 text-yellow-200')
          )}
        >
          {isLimitNutrient ? 
            (category === 'High' ? 'High' : 
             category === 'Adequate' ? 'Moderate' : 
             'Low') : 
            category}
        </span>
      </div>
      
      <div className="mb-2">
        <h3 className={cn('font-medium', sizeClasses.textClass)}>{safeNutrient.name}</h3>
      </div>
      
      <div className="flex justify-between items-center mb-1.5">
        {amountDisplay}
        {dvDisplay}
      </div>
      
      {/* Progress bar */}
      {(percentDV !== null && typeof percentDV !== 'undefined') && (
        <div className={cn("w-full bg-gray-700 rounded-full overflow-hidden", sizeClasses.barHeight)}>
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out", 
              getBarColor(),
              sizeClasses.barHeight
            )}
            style={{
              width: hasAppeared ? `${Math.min(Math.max(percentDV || 0, 0), 100)}%` : '0%'
            }}
          />
        </div>
      )}
      
      {/* Description (visible when expanded) */}
      {expanded && description && (
        <div className="mt-3 text-sm text-gray-400">
          <p>{description}</p>
          {isLimitNutrient && percentDV > 25 && (
            <p className="mt-1 text-yellow-400">
              This is a nutrient to limit in your diet. Consider reducing intake.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedNutrientDisplay; 