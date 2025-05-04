'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { FaFire, FaChartLine, FaSeedling, FaCheck, FaInfoCircle, FaExclamationTriangle, FaSave } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function MealAnalysisClient({ mealImage, mealCaption, analysisData }: {
  mealImage: string;
  mealCaption: string;
  analysisData: any;
}) {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState<string>(mealImage);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // When mealImage changes, update the state
  useEffect(() => {
    console.log("Image source received:", mealImage);
    setImgSrc(mealImage);
  }, [mealImage]);
  
  const handleImageError = () => {
    console.error('Image failed to load, using fallback');
    setImgSrc('/images/meal-sample.jpg');
    setImgError(true);
  };
  
  const handleImageLoad = () => {
    console.log("Image loaded successfully");
    setImageLoaded(true);
  };

  // Function to save the meal to the database
  const saveMealToHistory = async () => {
    if (isSaving) return; // Prevent multiple clicks
    
    try {
      setIsSaving(true);
      setSaveError('');
      setSaveSuccess(false);
      
      // Create the data object to send to the API
      const mealData = {
        imageUrl: mealImage,
        caption: mealCaption,
        analysis: analysisData
      };
      
      // Send the data to the save endpoint
      const response = await fetch('/api/save-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mealData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save meal');
      }
      
      // Show success message and redirect after a short delay
      setSaveSuccess(true);
      
      // Redirect to meal history page after a short delay
      setTimeout(() => {
        router.push('/meal-history');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving meal:', error);
      setSaveError(error.message || 'Failed to save meal');
    } finally {
      setIsSaving(false);
    }
  };

  // Extract data from the analysis
  console.log("Analysis data structure:", JSON.stringify(analysisData).substring(0, 200) + "...");
  
  // Safely extract all needed data with proper type checking
  const macros = Array.isArray(analysisData?.macronutrients) 
    ? analysisData.macronutrients 
    : [];
    
  const micros = Array.isArray(analysisData?.micronutrients) 
    ? analysisData.micronutrients 
    : [];
    
  const benefits = Array.isArray(analysisData?.benefits) 
    ? analysisData.benefits 
    : [];
    
  const concerns = Array.isArray(analysisData?.concerns) 
    ? analysisData.concerns 
    : [];
    
  const suggestions = Array.isArray(analysisData?.suggestions) 
    ? analysisData.suggestions 
    : [];
    
  const calories = analysisData?.calories || 0;

  console.log("Macros count:", macros.length);
  console.log("Benefits count:", benefits.length);
  console.log("Suggestions count:", suggestions.length);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
      {/* Image Section with Gradient Overlay */}
      <div className="relative">
        <div className="w-full h-72 md:h-96 relative bg-gray-100">
          {!imageLoaded && <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading image...</div>
          </div>}
          
          <Image
            src={imgSrc}
            alt={mealCaption || "Food analysis"}
            fill
            priority
            unoptimized={true}
            className={`object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          
          {imgError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
              <div className="text-gray-600 text-sm max-w-xs text-center p-4">
                Unable to load the uploaded image. Showing sample image instead.
              </div>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
          <h1 className="text-white text-2xl md:text-3xl font-bold p-6">
            {mealCaption}
          </h1>
        </div>
      </div>

      {/* Analysis Content */}
      <div className="p-6">
        {/* Overview section */}
        <div className="mb-8 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaInfoCircle className="text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-blue-800">Nutritional Overview</h2>
          </div>
          <p className="text-gray-700 mb-3">
            {analysisData?.overview || `This meal contains approximately ${calories} calories.`}
          </p>
        </div>
        
        {/* Calories - Always shown */}
        <div className="mb-8 p-4 border rounded-lg bg-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaFire className="text-orange-500 mr-2" />
              <h2 className="text-xl font-semibold">Calories</h2>
            </div>
            <span className="text-2xl font-bold">{calories}</span>
          </div>
        </div>
        
        {/* Nutritional content - Macronutrients */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Macronutrients</h2>
          {macros.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {macros.map((macro: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{macro.name}</h3>
                    <span className="text-lg font-semibold">
                      {typeof macro.amount === 'number' 
                        ? macro.amount.toLocaleString(undefined, {maximumFractionDigits: 1})
                        : macro.amount}
                      {macro.unit && ` ${macro.unit}`}
                    </span>
                  </div>
                  {macro.description && (
                    <p className="text-sm text-gray-600 mt-2">{macro.description}</p>
                  )}
                  {macro.percentDailyValue && (
                    <div className="mt-2 text-xs text-gray-500">
                      {macro.percentDailyValue}% of daily value
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-gray-500 text-center">No macronutrient data available</p>
            </div>
          )}
        </div>
        
        {/* Micronutrients */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Micronutrients</h2>
          {micros.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {micros.map((micro: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{micro.name}</h3>
                    <span className="text-lg font-semibold">
                      {typeof micro.amount === 'number' 
                        ? micro.amount.toLocaleString(undefined, {maximumFractionDigits: 1})
                        : micro.amount}
                      {micro.unit && ` ${micro.unit}`}
                    </span>
                  </div>
                  {micro.description && (
                    <p className="text-sm text-gray-600 mt-2">{micro.description}</p>
                  )}
                  {micro.percentDailyValue && (
                    <div className="mt-2 text-xs text-gray-500">
                      {micro.percentDailyValue}% of daily value
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-gray-500 text-center">No micronutrient data available</p>
            </div>
          )}
        </div>
        
        {/* Health Benefits - Only show if benefits array has items */}
        {benefits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Health Benefits</h2>
            <ul className="space-y-3 bg-green-50 p-4 rounded-lg">
              {benefits.map((benefit: string, index: number) => (
                <li key={index} className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-800">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Health Considerations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Health Considerations</h2>
          {concerns.length > 0 ? (
            <ul className="space-y-3 bg-yellow-50 p-4 rounded-lg">
              {concerns.map((concern: string, index: number) => (
                <li key={index} className="flex items-start">
                  <FaExclamationTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-800">{concern}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-gray-500 text-center">No health considerations to note</p>
            </div>
          )}
        </div>
        
        {/* Suggestions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Suggestions</h2>
          {suggestions.length > 0 ? (
            <ul className="space-y-3 bg-blue-50 p-4 rounded-lg">
              {suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start">
                  <FaSeedling className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-800">{suggestion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-gray-500 text-center">No suggestions available</p>
            </div>
          )}
        </div>
        
        {/* Save Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={saveMealToHistory}
            disabled={isSaving}
            className={`inline-flex items-center px-6 py-3 rounded-lg shadow transition-colors
              ${isSaving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : saveSuccess 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <FaCheck className="mr-2" />
                Saved! Redirecting...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Save to Meal History
              </>
            )}
          </button>
        </div>
        
        {/* Error message */}
        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
            {saveError}
          </div>
        )}
      </div>
    </div>
  );
} 