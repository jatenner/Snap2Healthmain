'use client';
import { useState } from 'react';
import Image from 'next/image';

interface FoodAnalysisProps {
  imageUrl: string;
  mealName: string;
  analysis: any;
  onReset?: () => void;
}

export default function FoodAnalysis({
  imageUrl,
  mealName,
  analysis,
  onReset
}: FoodAnalysisProps) {
  const [activeSection, setActiveSection] = useState('nutrition');

  // Extract basic nutritional info
  const calories = analysis?.calories || 0;
  const protein = analysis?.macronutrients?.find((m: any) => m.name === "Protein")?.amount || 0;
  const carbs = analysis?.macronutrients?.find((m: any) => m.name === "Carbohydrates")?.amount || 0;
  const fat = analysis?.macronutrients?.find((m: any) => m.name === "Fat")?.amount || 0;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header with image and basic info */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Image */}
        <div className="w-full md:w-1/3">
          <div className="relative rounded-lg overflow-hidden w-full aspect-square">
            {imageUrl && (
              <div className="h-64 relative">
                <Image
                  src={imageUrl}
                  alt={mealName}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={true}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Basic Info */}
        <div className="w-full md:w-2/3">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{mealName || "Food Analysis"}</h1>
            {onReset && (
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={onReset}
              >
                New Analysis
              </button>
            )}
          </div>
          
          {/* Overview information */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-white border rounded shadow-sm text-center">
              <p className="text-xs text-gray-500">Calories</p>
              <p className="text-xl font-bold">{calories}</p>
            </div>
            <div className="p-4 bg-white border rounded shadow-sm text-center">
              <p className="text-xs text-gray-500">Protein</p>
              <p className="text-xl font-bold">{protein}g</p>
            </div>
            <div className="p-4 bg-white border rounded shadow-sm text-center">
              <p className="text-xs text-gray-500">Carbs</p>
              <p className="text-xl font-bold">{carbs}g</p>
            </div>
            <div className="p-4 bg-white border rounded shadow-sm text-center">
              <p className="text-xs text-gray-500">Fat</p>
              <p className="text-xl font-bold">{fat}g</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'nutrition' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('nutrition')}
        >
          Nutrition
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'insights' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('insights')}
        >
          Insights
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'suggestions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('suggestions')}
        >
          Suggestions
        </button>
      </div>
      
      {/* Content sections */}
      <div className="mt-4">
        {/* Nutrition section */}
        {activeSection === 'nutrition' && (
          <div className="space-y-4">
            <div className="bg-white border rounded p-4 shadow-sm">
              <div className="mb-2">
                <h2 className="text-lg font-semibold">Macronutrients</h2>
                <p className="text-sm text-gray-500">Breakdown of macronutrients in this meal</p>
              </div>
              <div className="space-y-4">
                {analysis?.macronutrients?.map((macro: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{macro.name}</span>
                      <span className="text-sm">{macro.amount}{macro.unit} ({macro.percentDailyValue}% DV)</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.min(macro.percentDailyValue, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white border rounded p-4 shadow-sm">
              <div className="mb-2">
                <h2 className="text-lg font-semibold">Micronutrients</h2>
                <p className="text-sm text-gray-500">Key vitamins and minerals in this meal</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis?.micronutrients?.map((micro: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm">{micro.name}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{micro.amount}{micro.unit}</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${micro.percentDailyValue > 50 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {micro.percentDailyValue}% DV
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Insights section */}
        {activeSection === 'insights' && (
          <div className="space-y-4">
            <div className="bg-white border rounded p-4 shadow-sm">
              <div className="mb-2">
                <h2 className="text-lg font-semibold">Health Benefits</h2>
                <p className="text-sm text-gray-500">Potential health benefits of this meal</p>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                {analysis?.benefits?.map((benefit: string, index: number) => (
                  <li key={index} className="text-gray-800">{benefit}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white border rounded p-4 shadow-sm">
              <div className="mb-2">
                <h2 className="text-lg font-semibold">Potential Concerns</h2>
                <p className="text-sm text-gray-500">Areas to be mindful of</p>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                {analysis?.concerns?.map((concern: string, index: number) => (
                  <li key={index} className="text-gray-800">{concern}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Suggestions section */}
        {activeSection === 'suggestions' && (
          <div className="bg-white border rounded p-4 shadow-sm">
            <div className="mb-2">
              <h2 className="text-lg font-semibold">Recommendations</h2>
              <p className="text-sm text-gray-500">Ways to improve this meal</p>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              {analysis?.suggestions?.map((suggestion: string, index: number) => (
                <li key={index} className="text-gray-800">{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 