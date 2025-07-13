'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Macro } from '../../lib/nutrition-buckets';

interface FuelMacroSectionProps {
  protein: Macro;
  totalCarbs: Macro;
  totalFat: Macro;
  alcohol?: Macro;
  userProfile?: { age?: number; height?: number; goal?: string };
}

const MacroRing: React.FC<{ 
  macro: Macro; 
  label: string; 
  color: string; 
  unit: string;
}> = ({ macro, label, color, unit }) => {
  const percentage = Math.min((macro.grams / macro.target) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r="40"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-700"
          />
          <motion.circle
            cx="44"
            cy="44"
            r="40"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            role="meter"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="text-lg font-bold">{macro.grams}{unit}</span>
          <span className="text-xs text-slate-300">{macro.dv}%</span>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <div className="w-20 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((macro.remaining / macro.target) * 100, 100)}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </div>
        <span className="text-xs text-slate-400">{macro.remaining}g remaining</span>
      </div>
    </div>
  );
};

const FuelMacroSection: React.FC<FuelMacroSectionProps> = ({
  protein,
  totalCarbs,
  totalFat,
  alcohol,
  userProfile
}) => {
  const tooltipText = userProfile 
    ? `Based on your profile (age ${userProfile.age}, goal: ${userProfile.goal})`
    : "Based on general recommendations";

  return (
    <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Fuel Macros</h2>
          <div className="group relative">
            <button className="text-slate-400 hover:text-white text-sm">
              Daily goal ℹ️
            </button>
            <div className="absolute right-0 top-8 w-48 p-2 bg-slate-800 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
              {tooltipText}
            </div>
          </div>
        </div>
        
        <div className="flex justify-around items-center">
          <MacroRing
            macro={protein}
            label="Protein (fuel & recovery)"
            color="text-macro-400"
            unit="g"
          />
          <MacroRing
            macro={totalCarbs}
            label="Carbs (energy & performance)"
            color="text-macro-400"
            unit="g"
          />
          <MacroRing
            macro={totalFat}
            label="Fat (hormones & absorption)"
            color="text-macro-400"
            unit="g"
          />
          {alcohol && (
            <MacroRing
              macro={alcohol}
              label="Alcohol"
              color="text-red-400"
              unit="g"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FuelMacroSection; 