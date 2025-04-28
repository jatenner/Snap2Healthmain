import React from 'react';

interface Nutrient {
  name: string;
  amount: string | number;
}

interface NutrientGroupProps {
  title: string;
  nutrients: Nutrient[];
}

export default function NutrientGroup({ title, nutrients }: NutrientGroupProps) {
  if (!nutrients || nutrients.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {nutrients.map((nutrient, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b">
            <span className="font-medium">{nutrient.name}</span>
            <span>{nutrient.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 