'use client';

import OriginalNutritionAnalysis from '../../src/components/NutritionAnalysis';

// Create a default data structure for when data is undefined
const defaultData = {
  calories: 0,
  macronutrients: [
    { name: "Protein", amount: 0, unit: "g" },
    { name: "Carbohydrates", amount: 0, unit: "g" },
    { name: "Fat", amount: 0, unit: "g" }
  ],
  micronutrients: []
};

export default function NutritionAnalysis({ data }: any) {
  // If data is null or undefined, use default data
  const safeData = data || defaultData;
  return <OriginalNutritionAnalysis data={safeData} />;
} 