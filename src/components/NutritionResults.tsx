'use client';

import React from 'react';

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface FoodItem {
  name: string;
  quantity: string;
  nutrition: Nutrition;
}

interface ResultsProps {
  results: {
    foods: FoodItem[];
    totalNutrition: Nutrition;
    healthInsights: string[];
  };
  imageUrl: string;
}

export default function NutritionResults({ results, imageUrl }: ResultsProps) {
  const { foods, totalNutrition, healthInsights } = results;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="rounded-lg overflow-hidden border border-gray-200 mb-6">
          <img 
            src={imageUrl} 
            alt="Food image" 
            className="w-full h-auto object-cover"
          />
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Health Insights</h3>
          <ul className="space-y-2">
            {healthInsights.map((insight, index) => (
              <li key={index} className="flex">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nutritional Information</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Calories</p>
              <p className="text-2xl font-bold text-green-600">{totalNutrition.calories}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Protein</p>
              <p className="text-2xl font-bold text-green-600">{totalNutrition.protein}g</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Carbs</p>
              <p className="text-2xl font-bold text-green-600">{totalNutrition.carbs}g</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Fat</p>
              <p className="text-2xl font-bold text-green-600">{totalNutrition.fat}g</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Fiber</p>
              <p className="text-2xl font-bold text-green-600">{totalNutrition.fiber}g</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500">Sugar</p>
              <p className="text-2xl font-bold text-green-600">{totalNutrition.sugar}g</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Detected Food Items</h3>
          <div className="space-y-4">
            {foods.map((food, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{food.name}</h4>
                  <span className="text-sm text-gray-500">{food.quantity}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Calories:</span> {food.nutrition.calories}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Protein:</span> {food.nutrition.protein}g
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Carbs:</span> {food.nutrition.carbs}g
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Fat:</span> {food.nutrition.fat}g
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Fiber:</span> {food.nutrition.fiber}g
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Sugar:</span> {food.nutrition.sugar}g
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 