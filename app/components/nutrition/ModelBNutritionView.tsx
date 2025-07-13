'use client';

import React from 'react';
import { bucketAndSort, MealAnalysis } from '../../lib/nutrition-buckets';
import FuelMacroSection from './FuelMacroSection';
import MacroComponentsDrawer from './MacroComponentsDrawer';
import { VitaminsSection, MineralsSection, OtherMicrosSection } from './NutrientGrid';
import InsightsTab from './InsightsTab';

interface ModelBNutritionViewProps {
  rawData: any;
  userProfile?: {
    age?: number;
    height?: number;
    weight?: number;
    gender?: string;
    activity_level?: string;
    goal?: string;
  };
}

const ModelBNutritionView: React.FC<ModelBNutritionViewProps> = ({ rawData, userProfile }) => {
  const analysis: MealAnalysis = bucketAndSort(rawData, userProfile);

  return (
    <div className="bg-slate-900 min-h-screen">
      {/* Photo + Calories Pill */}
      <div className="relative">
        <img 
          src={analysis.photo_url} 
          alt={analysis.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white font-semibold">{analysis.calories} cal</span>
        </div>
      </div>

      {/* Fuel Macros (Sticky) */}
      <FuelMacroSection
        protein={analysis.macros.protein}
        totalCarbs={analysis.macros.totalCarbs}
        totalFat={analysis.macros.totalFat}
        alcohol={analysis.macros.alcohol}
        userProfile={userProfile}
      />

      {/* Macro Components Drawer */}
      <MacroComponentsDrawer components={analysis.macros.components} />

      {/* Micronutrient Buckets */}
      <div className="p-4 space-y-6">
        <VitaminsSection vitamins={analysis.vitamins} />
        <MineralsSection minerals={analysis.minerals} />
        <OtherMicrosSection otherMicros={analysis.otherMicros} />
      </div>

      {/* Insights Grid */}
      <InsightsTab analysis={analysis} />
    </div>
  );
};

export default ModelBNutritionView; 