'use client';

import React from 'react';
import Image from 'next/image';

interface NutrientInfo {
  name: string;
  amount: number | string;
  unit: string;
  percentDailyValue?: number;
}

interface MealAnalysis {
  mealName: string;
  calories: number | string;
  macronutrients?: NutrientInfo[];
  micronutrients?: NutrientInfo[];
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  goalSpecificInsights?: string[];
  macroRatios?: {
    proteinPercentage: number;
    carbPercentage: number;
    fatPercentage: number;
  };
}

interface DetailedFoodAnalysisProps {
  imageUrl?: string;
  mealAnalysis?: MealAnalysis;
  goal?: string;
}

export function DetailedFoodAnalysis({ imageUrl, mealAnalysis, goal = 'General Wellness' }: DetailedFoodAnalysisProps) {
  if (!mealAnalysis) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto my-8">
        <div className="p-5 text-center">
          <p className="text-gray-600 dark:text-gray-300">No analysis data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto my-8">
      <div className="p-5 bg-blue-600 dark:bg-blue-800 text-white">
        <h1 className="text-2xl font-bold">{mealAnalysis.mealName}</h1>
        <p className="text-sm opacity-80">Nutritional Analysis Report</p>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Image Column */}
        <div className="md:w-1/3 p-5">
          {imageUrl ? (
            <div className="relative h-64 w-full rounded-lg overflow-hidden">
              <img 
                src={imageUrl}
                alt={mealAnalysis.mealName}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">No image available</span>
            </div>
          )}
          
          <div className="mt-5 bg-blue-50 dark:bg-slate-700 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white">Calorie Estimate</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mealAnalysis.calories} <span className="text-sm font-normal">kcal</span></p>
          </div>
        </div>
        
        {/* Analysis Column */}
        <div className="md:w-2/3 p-5">
          {/* Macronutrients */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Macronutrients</h2>
            
            {mealAnalysis.macroRatios && (
              <div className="mb-4 flex h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${mealAnalysis.macroRatios.proteinPercentage}%` }}
                  title={`Protein: ${mealAnalysis.macroRatios.proteinPercentage}%`}
                ></div>
                <div 
                  className="bg-green-500" 
                  style={{ width: `${mealAnalysis.macroRatios.carbPercentage}%` }}
                  title={`Carbs: ${mealAnalysis.macroRatios.carbPercentage}%`}
                ></div>
                <div 
                  className="bg-yellow-500" 
                  style={{ width: `${mealAnalysis.macroRatios.fatPercentage}%` }}
                  title={`Fat: ${mealAnalysis.macroRatios.fatPercentage}%`}
                ></div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              {mealAnalysis.macronutrients?.map((nutrient, index) => (
                <div key={index} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-300 text-sm">{nutrient.name}</p>
                  <p className="font-bold text-gray-800 dark:text-white">
                    {nutrient.amount} {nutrient.unit}
                  </p>
                  {nutrient.percentDailyValue && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {nutrient.percentDailyValue}% daily value
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Micronutrients */}
          {mealAnalysis.micronutrients && mealAnalysis.micronutrients.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Micronutrients</h2>
              <div className="grid grid-cols-3 gap-4">
                {mealAnalysis.micronutrients.map((nutrient, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-300 text-sm">{nutrient.name}</p>
                    <p className="font-bold text-gray-800 dark:text-white">
                      {nutrient.amount} {nutrient.unit}
                    </p>
                    {nutrient.percentDailyValue && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {nutrient.percentDailyValue}% daily value
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Goal-specific Insights */}
          {mealAnalysis.goalSpecificInsights && mealAnalysis.goalSpecificInsights.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                Insights for {goal}
              </h2>
              <ul className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                {mealAnalysis.goalSpecificInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Benefits and Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {mealAnalysis.benefits && mealAnalysis.benefits.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Benefits</h3>
                <ul className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg space-y-1">
                  {mealAnalysis.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {mealAnalysis.concerns && mealAnalysis.concerns.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Considerations</h3>
                <ul className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg space-y-1">
                  {mealAnalysis.concerns.map((concern, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="text-yellow-500 mr-2">!</span>
                      <span className="text-gray-700 dark:text-gray-300">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Suggestions */}
          {mealAnalysis.suggestions && mealAnalysis.suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Suggestions</h3>
              <ul className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg space-y-1">
                {mealAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-purple-500 mr-2">→</span>
                    <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailedFoodAnalysis; 