'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Nutrient } from '../../lib/nutrition-buckets';

interface NutrientGridProps {
  nutrients: Nutrient[];
  title: string;
  colorScheme: 'vitamin' | 'mineral' | 'other';
}

const NutrientCard: React.FC<{
  nutrient: Nutrient;
  colorScheme: 'vitamin' | 'mineral' | 'other';
  index: number;
}> = ({ nutrient, colorScheme, index }) => {
  const getColorClass = (dv: number) => {
    if (dv >= 100) return `${colorScheme}-500`;
    if (dv >= 20) return `${colorScheme}-400`;
    return `${colorScheme}-300`;
  };

  const colorClass = getColorClass(nutrient.dv);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-slate-800 rounded-lg p-4 border border-slate-700"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-medium text-${colorClass}`}>{nutrient.name}</h4>
        <div className="text-right">
          <div className="text-white font-semibold">{nutrient.amount}{nutrient.unit}</div>
          <div className="text-xs text-slate-400">{nutrient.dv}% DV</div>
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1 mb-2">
        <motion.div
          className={`h-1 rounded-full bg-${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(nutrient.dv, 100)}%` }}
          transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
          role="meter"
          aria-valuenow={nutrient.dv}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{nutrient.note}</p>
    </motion.div>
  );
};

const NutrientGrid: React.FC<NutrientGridProps> = ({ nutrients, title, colorScheme }) => {
  if (nutrients.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {nutrients.map((nutrient, index) => (
          <NutrientCard
            key={nutrient.name}
            nutrient={nutrient}
            colorScheme={colorScheme}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export const VitaminsSection: React.FC<{ vitamins: Nutrient[] }> = ({ vitamins }) => (
  <NutrientGrid nutrients={vitamins} title="Vitamins" colorScheme="vitamin" />
);

export const MineralsSection: React.FC<{ minerals: Nutrient[] }> = ({ minerals }) => (
  <NutrientGrid nutrients={minerals} title="Minerals" colorScheme="mineral" />
);

export const OtherMicrosSection: React.FC<{ otherMicros: Nutrient[] }> = ({ otherMicros }) => (
  <NutrientGrid nutrients={otherMicros} title="Other Micronutrients" colorScheme="other" />
);

export default NutrientGrid; 