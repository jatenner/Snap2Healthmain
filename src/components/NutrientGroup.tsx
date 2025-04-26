import React from 'react';
import { Nutrient } from '../lib/gpt/validator';
import { NutrientCard } from './NutrientCard';

interface NutrientGroupProps {
  title: string;
  nutrients: Nutrient[];
  className?: string;
}

const NutrientGroup: React.FC<NutrientGroupProps> = ({ 
  title, 
  nutrients, 
  className = '',
}) => {
  if (!nutrients || nutrients.length === 0) {
    return null;
  }
  
  return (
    <div className={`${className} p-4 rounded-lg`}>
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {nutrients.map((nutrient, index) => (
          <NutrientCard 
            key={`${nutrient.name}-${index}`}
            nutrient={nutrient}
          />
        ))}
      </div>
    </div>
  );
};

export default NutrientGroup; 