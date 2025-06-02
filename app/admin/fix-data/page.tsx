'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase/client';

// Helper function to normalize meal data structure
function normalizeDataStructure(data: any): any {
  if (!data) return data;
  
  // Create a deep copy to avoid modifying the original
  const normalizedData = JSON.parse(JSON.stringify(data));
  
  // Step 1: Handle case where nutrients are in multiple places
  // If we have nutrients in different locations, consolidate them
  
  // For macronutrients
  let macros: any[] = [];
  
  // Collect from all possible locations
  if (normalizedData.macronutrients && Array.isArray(normalizedData.macronutrients)) {
    macros = [...normalizedData.macronutrients];
  }
  
  if (normalizedData.analysis?.macronutrients && Array.isArray(normalizedData.analysis.macronutrients)) {
    // Only add nutrients that aren't already in the array
    normalizedData.analysis.macronutrients.forEach((nutrient: any) => {
      if (!macros.some(m => m.name === nutrient.name)) {
        macros.push(nutrient);
      }
    });
  }
  
  if (normalizedData.nutrients?.macronutrients && Array.isArray(normalizedData.nutrients.macronutrients)) {
    // Only add nutrients that aren't already in the array
    normalizedData.nutrients.macronutrients.forEach((nutrient: any) => {
      if (!macros.some(m => m.name === nutrient.name)) {
        macros.push(nutrient);
      }
    });
  }
  
  // Set the consolidated list at the root level
  normalizedData.macronutrients = macros;
  
  // Remove from other locations to avoid duplicates
  if (normalizedData.analysis) {
    delete normalizedData.analysis.macronutrients;
  }
  
  if (normalizedData.nutrients) {
    delete normalizedData.nutrients.macronutrients;
  }
  
  // Do the same for micronutrients
  let micros: any[] = [];
  
  if (normalizedData.micronutrients && Array.isArray(normalizedData.micronutrients)) {
    micros = [...normalizedData.micronutrients];
  }
  
  if (normalizedData.analysis?.micronutrients && Array.isArray(normalizedData.analysis.micronutrients)) {
    normalizedData.analysis.micronutrients.forEach((nutrient: any) => {
      if (!micros.some(m => m.name === nutrient.name)) {
        micros.push(nutrient);
      }
    });
  }
  
  if (normalizedData.nutrients?.micronutrients && Array.isArray(normalizedData.nutrients.micronutrients)) {
    normalizedData.nutrients.micronutrients.forEach((nutrient: any) => {
      if (!micros.some(m => m.name === nutrient.name)) {
        micros.push(nutrient);
      }
    });
  }
  
  // Set the consolidated list at the root level
  normalizedData.micronutrients = micros;
  
  // Remove from other locations to avoid duplicates
  if (normalizedData.analysis) {
    delete normalizedData.analysis.micronutrients;
  }
  
  if (normalizedData.nutrients) {
    delete normalizedData.nutrients.micronutrients;
  }
  
  // Clean up empty objects
  if (normalizedData.nutrients && Object.keys(normalizedData.nutrients).length === 0) {
    delete normalizedData.nutrients;
  }
  
  return normalizedData;
}

export default function FixDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  async function fixMealData() {
    setIsLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // Use the supabase client directly
      
      // Step 1: Fix meal_analyses table
      console.log('Fixing meal_analyses table...');
      const { data: mealAnalyses, error: fetchError } = await supabase.from('meal_analyses').select('*');
      
      if (fetchError) {
        throw new Error(`Error fetching meal analyses: ${fetchError.message}`);
      }
      
      let analysesFixed = 0;
      let analysesErrors = 0;
      
      // Process each meal analysis
      for (const analysis of mealAnalyses || []) {
        if (!analysis.analysis) continue;
        
        const normalizedData = normalizeDataStructure(analysis.analysis);
        
        const { error: updateError } = await supabase.from('meal_analyses')
          .update({ analysis: normalizedData })
          .eq('id', analysis.id);
          
        if (updateError) {
          console.error(`Error updating meal analysis ${analysis.id}:`, updateError);
          analysesErrors++;
        } else {
          analysesFixed++;
        }
      }
      
      // Step 2: Fix meals table
      console.log('Fixing meals table...');
      const { data: meals, error: mealsError } = await supabase.from('meals').select('*');
      
      if (mealsError) {
        throw new Error(`Error fetching meals: ${mealsError.message}`);
      }
      
      let mealsFixed = 0;
      let mealsErrors = 0;
      
      // Process each meal
      for (const meal of meals || []) {
        if (!meal.analysis) continue;
        
        const normalizedData = normalizeDataStructure(meal.analysis);
        
        const { error: updateError } = await supabase.from('meals')
          .update({ analysis: normalizedData })
          .eq('id', meal.id);
          
        if (updateError) {
          console.error(`Error updating meal ${meal.id}:`, updateError);
          mealsErrors++;
        } else {
          mealsFixed++;
        }
      }
      
      // Set results
      setResults({
        analysesFixed,
        analysesErrors,
        mealsFixed,
        mealsErrors,
        total: analysesFixed + mealsFixed,
        errors: analysesErrors + mealsErrors
      });
      
    } catch (err) {
      console.error('Error fixing data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fix Meal Data</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Nutrient Data Structure Fixer</h2>
        <p className="mb-4 text-gray-300">
          This tool fixes duplicate nutrient data sections in the database. It normalizes the data structure
          by consolidating nutrients into a single location, preventing duplicate displays in the UI.
        </p>
        
        <button 
          onClick={fixMealData} 
          disabled={isLoading}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md"
        >
          {isLoading ? 'Fixing Data...' : 'Fix Meal Data Structure'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-800/30 border border-red-500 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {results && (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-2">Meal Analyses Fixed</h4>
              <p className="text-3xl font-bold text-cyan-500">{results.analysesFixed}</p>
              {results.analysesErrors > 0 && (
                <p className="text-sm text-red-400 mt-1">Errors: {results.analysesErrors}</p>
              )}
            </div>
            
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-2">Meals Fixed</h4>
              <p className="text-3xl font-bold text-cyan-500">{results.mealsFixed}</p>
              {results.mealsErrors > 0 && (
                <p className="text-sm text-red-400 mt-1">Errors: {results.mealsErrors}</p>
              )}
            </div>
          </div>
          
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-2">Total</h4>
            <p className="text-3xl font-bold text-cyan-500">{results.total} records fixed</p>
            {results.errors > 0 && (
              <p className="text-sm text-red-400 mt-1">Total errors: {results.errors}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 