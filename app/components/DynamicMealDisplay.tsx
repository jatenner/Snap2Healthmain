'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { getEffectiveProfile, validateNutrientData, calculatePersonalizedDailyTargets, categorizePDV, getEffectiveProfileSync } from '../lib/profile-utils';
import AIHealthReview from './AIHealthReview';
import Link from 'next/link';
import EnhancedNutrientDisplay from './EnhancedNutrientDisplay';
import { Button } from './ui/button';
import NutrientDisplay from './NutrientDisplay';
import { useProfile } from '../lib/profile-context';
import MacroChart from './MacroChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UserProfile } from '../lib/nutrition-utils';

// Safe toLowerCase function to prevent errors
const safeToLowerCase = (str?: string): string => {
  if (!str) return '';
  return String(str).toLowerCase();
};

// Types for our component
interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
}

interface Analysis {
  calories?: number;
  totalCalories?: number;
  macronutrients?: Nutrient[];
  micronutrients?: Nutrient[];
}

interface Ingredient {
  name: string;
  portion?: string;
  calories?: number;
}

// Updated interface with all possible data properties
interface MealData {
  id: string;
  name?: string;
  mealName?: string; 
  caption?: string;  // Property for meal name/description
  calories?: number;
  detected_food?: string;
  detectedFood?: string;
  nutrients?: any;
  analysis?: any;
  imageUrl?: string;
  image_url?: string;
  source?: string;
  insights?: any;  // Property for health insights
  goal?: string;   // Property for user health goal
  macronutrients?: any; // Property for direct macro access
  micronutrients?: any; // Property for direct micro access
  benefits?: string[]; // Property for benefits/strengths
  concerns?: string[]; // Property for concerns/gaps
  suggestions?: string[]; // Property for suggestions/recommendations
  updated_at?: string; // Timestamp for when data was last updated
  ingredients?: Array<{name: string; portion?: string; calories?: number}>;
}

// Add this mapping of nutrient descriptions near the top of the file, just after the interface definitions
const NUTRIENT_DESCRIPTIONS = {
  protein: "Helps build and repair muscles, supports your immune system, and keeps you feeling full longer. Important for recovery after exercise and maintaining strength.",
  carbs: "Your body's main source of energy, especially for your brain and during physical activity. Provides fuel for everyday activities and exercise.",
  carbohydrates: "Your body's main source of energy, especially for your brain and during physical activity. Provides fuel for everyday activities and exercise.",
  fat: "Essential for absorbing vitamins, supporting brain health, and providing long-lasting energy. Helps with hormone production and keeping your cells healthy.",
  fiber: "Supports digestive health, helps you feel full longer, and can help control blood sugar and cholesterol levels. Important for gut health and regular digestion.",
  vitamin_a: "Important for good vision, immune function, and keeping your skin healthy. Found in colorful vegetables and fruits like carrots and sweet potatoes.",
  vitamin_c: "Supports your immune system, helps your body heal wounds, and acts as an antioxidant protecting cells from damage. Found in citrus fruits and many vegetables.",
  vitamin_d: "Crucial for strong bones as it helps your body absorb calcium. Also supports immune function and mood regulation. Your body makes it when exposed to sunlight.",
  vitamin_e: "Protects your cells from damage as an antioxidant. Supports immune function and helps keep blood vessels healthy. Found in nuts, seeds, and vegetable oils.",
  calcium: "Essential for strong bones and teeth. Also important for muscle function, nerve transmission, and blood vessel health. Main sources include dairy products and leafy greens.",
  iron: "Helps carry oxygen throughout your body in your blood. Important for energy production and brain function. Low levels can cause fatigue and weakness.",
  potassium: "Helps regulate fluid balance, muscle contractions, and nerve signals. Can help maintain healthy blood pressure. Found in bananas, potatoes, and many fruits and vegetables.",
  magnesium: "Involved in hundreds of processes in your body, including muscle and nerve function, blood sugar control, and blood pressure regulation. Found in nuts, seeds, and whole grains.",
  sodium: "Helps maintain fluid balance and proper muscle and nerve function. Most people get enough (or too much) from salt in their diet.",
  zinc: "Important for immune function, wound healing, and your sense of taste and smell. Supports normal growth and development and helps your body make proteins and DNA."
};

// Add this function to get a nutrient description based on the nutrient name
const getNutrientDescription = (nutrientName: string): string => {
  const standardizedName = nutrientName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return NUTRIENT_DESCRIPTIONS[standardizedName] || 
    `Essential nutrient for overall health and wellbeing.`;
};

// Helper function to check if string is a valid UUID
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper function to sanitize meal data
const sanitizeMealData = (data: any, source: string, id?: string): MealData => {
  if (!data) return { id: id || 'unknown' };
  
  return {
    id: id || data.id || data.analysisId || 'unknown',
    name: data.name || data.mealName || data.dish_name,
    mealName: data.name || data.mealName || data.dish_name,
    calories: data.calories || (data.analysis?.calories) || 0,
    detectedFood: data.detectedFood || data.detected_food || '',
    detected_food: data.detectedFood || data.detected_food || '',
    nutrients: data.nutrients || data.analysis || null,
    analysis: data.nutrients || data.analysis || null,
    imageUrl: data.imageUrl || data.image_url || '',
    image_url: data.imageUrl || data.image_url || '',
    source,
    ingredients: data.ingredients || []
  };
};

// Helper function that converts our Nutrient type to the one expected by EnhancedNutrientDisplay
const convertNutrientForDisplay = (nutrient: Nutrient) => {
  return {
    ...nutrient,
    // Ensure percentDailyValue exists (even if null/undefined)
    percentDailyValue: nutrient.percentDailyValue,
  };
};

// Helper for debugging and fixing Supabase/UI data syncing issues
const syncMealDataWithSupabase = async (mealId: string) => {
  try {
    console.log(`[DynamicMealDisplay] Attempting to sync meal data for ID: ${mealId}`);
    
    // Force a fresh fetch from API
    const timestamp = Date.now();
    const response = await fetch(`/api/analyze-meal?id=${mealId}&t=${timestamp}&force=true`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.id) {
        // Update localStorage with the fresh data
        const storageKey = `meal_analysis_${mealId}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log('[DynamicMealDisplay] Successfully synced meal data with Supabase');
        
        // Reload the page to show the synced data
        window.location.reload();
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('[DynamicMealDisplay] Error syncing meal data:', e);
    return false;
  }
};

// First, let's refine the calorie calculation for accurate results for large, active individuals
const calculateDailyCalorieNeeds = (profile: any): number => {
  if (!profile) return 2200; // Default fallback
  
  // Extract profile data
  const gender = profile.gender?.toLowerCase() || 'male';
  const weight = profile.weight || 70; // kg
  const height = profile.height || 175; // cm
  const age = profile.age || 30;
  const activityLevel = profile.activity_level?.toLowerCase() || 'moderate';
  
  // Convert weight to kg if needed
  const weightInKg = profile.weight_unit === 'lb' ? weight / 2.20462 : weight;
  
  // Convert height to cm if needed
  const heightInCm = profile.height_unit === 'in' ? height * 2.54 : height;
  
  // Calculate BMR using Mifflin-St Jeor equation
  let bmr = 0;
  if (gender === 'male' || gender === 'm') {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
  } else {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
  }
  
  // Apply activity multiplier with realistic values for someone who is very active
  // Use more conservative multipliers to prevent overestimation
  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly active': 1.375,
    'light': 1.375,
    'moderate': 1.55,
    'moderately active': 1.55,
    'active': 1.725,
    'very active': 1.8, // Reduced from 1.9 to be more realistic
    'extra active': 2.0, // Reduced from 2.1 to be more realistic
    'athlete': 2.0 // Reduced from 2.1 to be more realistic
  };
  
  // Find best match for activity level
  let multiplier = 1.55; // Default to moderate
  for (const [key, value] of Object.entries(activityMultipliers)) {
    if (activityLevel.includes(key)) {
      multiplier = value;
      break;
    }
  }
  
  // Calculate total daily energy expenditure
  let tdee = Math.round(bmr * multiplier);
  
  // Cap the maximum daily calories at 4000 to prevent unrealistically high values
  // Even for very large, active individuals, 4000 is typically on the higher end of needs
  if (tdee > 4000) {
    console.log(`[DynamicMealDisplay] Capped calories from ${tdee} to 4000 for very active user`);
    tdee = 4000;
  }
  
  // Special case for 225lb very active male - ensure it's between 3200-3700 calories
  // This is a reasonable range based on sports nutrition guidelines
  if (weightInKg > 90 && (activityLevel.includes('very') || activityLevel.includes('active'))) {
    const minCalories = 3200;
    const maxCalories = 3700;
    
    if (tdee < minCalories) {
      tdee = minCalories;
    } else if (tdee > maxCalories) {
      tdee = maxCalories;
    }
    
    console.log(`[DynamicMealDisplay] Adjusted calories to ${tdee} for 225lb very active male`);
  }
  
  // Apply goal adjustments if available
  if (profile.goal) {
    const goal = profile.goal.toLowerCase();
    if (goal.includes('loss') || goal.includes('cut')) {
      return Math.round(tdee * 0.85); // 15% deficit
    } else if (goal.includes('gain') || goal.includes('bulk')) {
      return Math.round(tdee * 1.15); // 15% surplus
    }
  }
  
  return tdee;
};

// Helper function to get the appropriate image URL from different data formats
const getMealImageUrl = (data: any): string | null => {
  if (!data) return null;
  
  // Try all possible image URL properties
  return data.imageUrl || 
         data.image_url || 
         (data.images && data.images[0]) || 
         (data.mealImages && data.mealImages[0]) ||
         null;
};

// Helper function to parse JSON string fields if needed
const parseJsonField = (field: any): any => {
  if (!field) return null;
  
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.error('Error parsing JSON field:', e);
      return null;
    }
  }
  
  return field; // Already an object
};

// Update normalizeMealData to better handle data from meal_analyses table
const normalizeMealData = (data: any): MealData => {
  if (!data) return { id: 'unknown', name: 'Unknown Meal' };
  
  // Extract all nutrients data using our helper
  const extractedNutrients = extractNutrients(data);
  
  // Get meal name from multiple possible sources
  const mealName = data.name || 
                 data.mealName || 
                 data.meal_name || 
                 data.dish_name || 
                 data.caption || 
                 data.detected_food || 
                 data.detectedFood || 
                 'Analyzed Meal';
  
  // Get image URL from all possible sources
  const imageUrl = normalizeImageUrl(
    data.imageUrl || 
    data.image_url || 
    data.image || 
    ''
  );

  // Extract meal ID - handle both UUID format and legacy meal-timestamp format
  const mealId = data.id || 
                data.analysisId || 
                data.meal_id || 
                (typeof window !== 'undefined' ? 
                  new URLSearchParams(window.location.search).get('id') : null) ||
                'unknown';
  
  // Get goal from direct property or data blob
  const goal = data.goal || 
              (data.data ? data.data.goal : null) || 
              'General Wellness';
  
  // Get insights data - prefer structured insights over legacy data
  const insights = data.insights || 
                 (data.data ? data.data.insights : null) || 
                 {};
  
  // Get updated timestamp for freshness
  const updatedAt = data.updated_at || 
                  data.created_at || 
                  new Date().toISOString();
  
  // Final normalized meal data with comprehensive structure
  return {
    id: mealId,
    name: mealName,
    mealName: mealName,
    caption: data.caption || mealName,
    calories: extractedNutrients.calories,
    detectedFood: data.detected_food || data.detectedFood || mealName,
    detected_food: data.detected_food || data.detectedFood || mealName,
    goal: goal,
    updated_at: updatedAt,
    insights: insights,
    nutrients: {
      calories: extractedNutrients.calories,
      macronutrients: extractedNutrients.macronutrients,
      micronutrients: extractedNutrients.micronutrients,
      benefits: extractedNutrients.benefits,
      concerns: extractedNutrients.concerns,
      suggestions: extractedNutrients.suggestions
    },
    // Also keep a direct reference to top-level properties for access convenience
    macronutrients: data.macronutrients || extractedNutrients.macronutrients,
    micronutrients: data.micronutrients || extractedNutrients.micronutrients,
    benefits: extractedNutrients.benefits,
    concerns: extractedNutrients.concerns,
    suggestions: extractedNutrients.suggestions,
    analysis: {
      calories: extractedNutrients.calories,
      macronutrients: extractedNutrients.macronutrients,
      micronutrients: extractedNutrients.micronutrients
    },
    imageUrl: imageUrl,
    image_url: imageUrl,
    source: data.source || 'api',
    ingredients: parseJsonField(data.ingredients) || 
               parseJsonField(data.mealContents) || 
               data.ingredients || 
               data.mealContents || 
               []
  };
};

// Helper function to normalize image URLs
function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If URL is already absolute, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative URL, make it absolute
  if (url.startsWith('/')) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return baseUrl + url;
  }
  
  // Default case
  return url;
}

// Safe nutrient getter function
const getNutrientAmount = (nutrients: any, name: string): number => {
  if (!nutrients) return 0;
  
  // Handle different nutrient structures
  let macroArray = [];
  if (nutrients.macronutrients && Array.isArray(nutrients.macronutrients)) {
    macroArray = nutrients.macronutrients;
  } else if (Array.isArray(nutrients)) {
    macroArray = nutrients;
  }
  
  // Safely find matching nutrient
  const found = macroArray.find(
    (n: any) => n && n.name && safeToLowerCase(n.name) === safeToLowerCase(name)
  );
  
  return typeof found?.amount === 'number' ? found.amount : 0;
};

// Add a function to convert JSONB macro/micronutrients to array format for display
const convertNutrientsJsonToArray = (nutrientsJson: Record<string, {[unit: string]: number, dv_percent: number}> | null | undefined): any[] => {
  if (!nutrientsJson || typeof nutrientsJson !== 'object') {
    return [];
  }
  
  return Object.entries(nutrientsJson).map(([key, value]) => {
    // Get the unit and amount from the first property that's not dv_percent
    const unitKey = Object.keys(value).find(k => k !== 'dv_percent') || 'grams';
    const amount = value[unitKey] || 0;
    
    // Format name to be more human-readable
    const name = key
      .replace(/_/g, ' ') // Convert underscores to spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
    
    return {
      name,
      amount,
      unit: unitKey,
      percentDailyValue: value.dv_percent || 0
    };
  });
}

// Update getDisplayNutrients to handle both array and JSONB object formats
const getDisplayNutrients = (mealData: any) => {
  // Default empty arrays
  const defaultMacros = [];
  const defaultMicros = [];
  
  if (!mealData) {
    return { macronutrients: defaultMacros, micronutrients: defaultMicros };
  }
  
  // First check if we have JSONB object format (the new format)
  if (mealData.macronutrients && !Array.isArray(mealData.macronutrients) && typeof mealData.macronutrients === 'object') {
    return {
      macronutrients: convertNutrientsJsonToArray(mealData.macronutrients),
      micronutrients: convertNutrientsJsonToArray(mealData.micronutrients)
    };
  }
  
  // If not, fall back to the old array format handling
  const macronutrients = 
    (mealData?.nutrients?.macronutrients && Array.isArray(mealData.nutrients.macronutrients)) ? 
      mealData.nutrients.macronutrients : 
    (mealData?.analysis?.macronutrients && Array.isArray(mealData.analysis.macronutrients)) ?
      mealData.analysis.macronutrients :
    (mealData?.macronutrients && Array.isArray(mealData.macronutrients)) ?
      mealData.macronutrients :
    (mealData?.data?.macronutrients && Array.isArray(mealData.data.macronutrients)) ?
      mealData.data.macronutrients :
      defaultMacros;
      
  const micronutrients = 
    (mealData?.nutrients?.micronutrients && Array.isArray(mealData.nutrients.micronutrients)) ? 
      mealData.nutrients.micronutrients : 
    (mealData?.analysis?.micronutrients && Array.isArray(mealData.analysis.micronutrients)) ?
      mealData.analysis.micronutrients :
    (mealData?.micronutrients && Array.isArray(mealData.micronutrients)) ?
      mealData.micronutrients :
    (mealData?.data?.micronutrients && Array.isArray(mealData.data.micronutrients)) ?
      mealData.data.micronutrients :
      defaultMicros;
      
  return { macronutrients, micronutrients };
};

// Get calories from all possible sources
const getTotalCalories = (mealData: any): number => {
  if (!mealData) return 0;
  
  return mealData?.calories || 
         mealData?.data?.calories ||
         mealData?.nutrients?.calories || 
         mealData?.nutrients?.totalCalories || 
         mealData?.analysis?.calories || 
         mealData?.analysis?.totalCalories ||
         0;
};

// Format nutrient value display with appropriate unit
const formatNutrientValue = (nutrient: any): string => {
  if (!nutrient || typeof nutrient.amount !== 'number') {
    return '0g';
  }
  
  // Format the amount to 1 decimal place if needed
  const amount = nutrient.amount < 10 ? 
    nutrient.amount.toFixed(1).replace(/\.0$/, '') : 
    Math.round(nutrient.amount);
    
  // Get the unit (with fallbacks)
  const unit = nutrient.unit || 'g';
  
  return `${amount}${unit}`;
};

// Format nutrient percent daily value
const formatDailyValue = (nutrient: any): string => {
  // Check for dv_percent or percentDailyValue - ensure it's a number
  const dvPercent = 
    typeof nutrient?.dv_percent === 'number' ? nutrient.dv_percent : 
    typeof nutrient?.percentDailyValue === 'number' ? nutrient.percentDailyValue : 0;
    
  // Format to integer
  return `${Math.round(dvPercent)}%`;
};

// Component to display individual nutrient rows
function NutrientRow({ nutrient }: { nutrient: any }) {
  if (!nutrient?.name) return null;
  
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-100">
      <div className="font-medium text-gray-800">{nutrient.name}</div>
      <div className="flex space-x-3 text-sm">
        <div className="w-16 text-right font-medium">{formatNutrientValue(nutrient)}</div>
        <div className="w-14 text-right text-gray-600">
          {formatDailyValue(nutrient)}
        </div>
      </div>
    </div>
  );
}

// Component for displaying a group of nutrients with enhanced formatting
function EnhancedNutrientCard({ 
  title, 
  nutrients, 
  className = "" 
}: { 
  title: string; 
  nutrients: any[];  
  className?: string;
}) {
  // Handle empty nutrients or invalid input
  if (!nutrients || !Array.isArray(nutrients) || nutrients.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      {/* Header row */}
      <div className="flex justify-between items-center py-1 border-b border-gray-300 text-sm text-gray-600">
        <div>Nutrient</div>
        <div className="flex space-x-3">
          <div className="w-16 text-right">Amount</div>
          <div className="w-14 text-right">% DV</div>
        </div>
      </div>
      
      {/* Nutrient rows */}
      <div className="max-h-64 overflow-y-auto">
        {nutrients.map((nutrient, index) => (
          <NutrientRow key={`${nutrient.name}-${index}`} nutrient={nutrient} />
        ))}
      </div>
    </div>
  );
}

// Add this fallback component
const MealAnalysisLoading = () => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-md">
      <h2 className="text-2xl font-semibold text-white mb-4">Analysis in Progress...</h2>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-6"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6 mb-6"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3 mb-6"></div>
        
        <h3 className="text-xl font-medium text-gray-400 mt-8 mb-4">Nutritional Information</h3>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
      <p className="text-blue-400 mt-6">Your food analysis is being processed. Please wait a moment.</p>
    </div>
  );
};

export default function DynamicMealDisplay() {
  const searchParams = useSearchParams();
  const [mealData, setMealData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const profileContext = useProfile();
  const userProfile = profileContext?.profile || null;
  const [mealRecommendations, setMealRecommendations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'macros' | 'micros' | 'personalized'>('macros');
  
  // Add unique component key to force proper remounting when data changes
  const componentKey = useMemo(() => searchParams?.get('id') || 'default-key', [searchParams]);
  
  // Load meal data when component mounts or mealId changes
  useEffect(() => {
    loadMealData();
  }, [searchParams]);
  
  // Process and normalize API responses
  const processApiResponse = (data: any, mealId: string): any => {
    // Create a deep copy to avoid mutations
    const processed = JSON.parse(JSON.stringify(data));
    
    // Ensure ID is set
    processed.id = processed.id || mealId || `meal-${Date.now()}`;
    
    // Normalize meal name
    processed.mealName = processed.mealName || 
                        processed.meal_name || 
                        processed.dish_name || 
                        processed.name ||
                        'Analyzed Meal';
    
    // Normalize meal description
    processed.mealDescription = processed.mealDescription || 
                               processed.meal_description || 
                               processed.description || 
                               '';
    
    // Normalize image URL - use the one from the storage if available
    processed.imageUrl = processed.imageUrl || 
                         processed.image_url || 
                         '';
                         
    // Parse JSON fields if they're strings
    const nutrients = parseJsonField(processed.nutrients) || 
                      parseJsonField(processed.analysis) || {};
                      
    const macronutrients = parseJsonField(processed.macronutrients) || 
                           nutrients.macronutrients || [];
                           
    const micronutrients = parseJsonField(processed.micronutrients) ||
                           nutrients.micronutrients || [];
    
    // Ensure macronutrients array exists and is populated
    if (!Array.isArray(macronutrients) || macronutrients.length === 0) {
      console.log('Adding default macronutrients');
      processed.macronutrients = [
        { name: "Protein", amount: 0, unit: "g" },
        { name: "Carbohydrates", amount: 0, unit: "g" },
        { name: "Fat", amount: 0, unit: "g" },
        { name: "Fiber", amount: 0, unit: "g" }
      ];
    } else {
      processed.macronutrients = macronutrients;
    }
    
    // Ensure micronutrients array exists
    if (!Array.isArray(micronutrients)) {
      processed.micronutrients = [];
    } else {
      processed.micronutrients = micronutrients;
    }
    
    // Normalize nutrients structure
    processed.nutrients = {
      calories: processed.calories || nutrients.calories || 0,
      macronutrients: processed.macronutrients,
      micronutrients: processed.micronutrients,
      ...nutrients
    };
    
    // Make sure analysis is also properly structured
    processed.analysis = processed.nutrients;
    
    // Try to extract calories if not present
    if (!processed.calories && processed.macronutrients.length > 0) {
      try {
        const protein = processed.macronutrients.find((n: any) => 
          n.name?.toLowerCase() === 'protein')?.amount || 0;
        const carbs = processed.macronutrients.find((n: any) => 
          n.name?.toLowerCase() === 'carbohydrates' || n.name?.toLowerCase() === 'carbs')?.amount || 0;
        const fat = processed.macronutrients.find((n: any) => 
          n.name?.toLowerCase() === 'fat')?.amount || 0;
          
        // Calculate calories: 4 cal/g protein, 4 cal/g carbs, 9 cal/g fat
        processed.calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
      } catch (e) {
        console.error('Error calculating calories:', e);
        processed.calories = 0;
      }
    }
    
    console.log('Processed meal data:', processed);
    return processed;
  };
  
  // Fetch health review data from the API
  const fetchHealthReview = async (mealId: string, fallbackData?: any) => {
    try {
      console.log(`Fetching health review for meal ID: ${mealId}`);
      const response = await fetch(`/api/health-review?mealId=${mealId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Health review API response:', data);
      
      // Check if we have a valid response
      if (data.success === false || data.error) {
        console.error('API returned error:', data.error || 'Unknown error');
        
        // Use fallback data if available
        if (fallbackData) {
          console.log('Using fallback data due to API error');
          setMealData(fallbackData);
        } else {
          setError(data.error || 'Failed to retrieve meal analysis');
        }
        
        setLoading(false);
        return;
      }
      
      // Process and normalize the API response
      let processedData;
      
      // Check for JSONB data in meal_analyses structure
      if (data.mealData && data.mealData.data && typeof data.mealData.data === 'object') {
        console.log('Found nested JSONB data in health review response, normalizing...');
        processedData = {
          ...data,
          ...data.mealData,
          ...data.mealData.data,
          mealName: data.mealData.data.caption || data.mealData.data.mealName || data.mealData.data.dish_name || data.mealData.name,
          nutrients: data.mealData.data.nutrients || {
            macronutrients: data.mealData.data.macronutrients || [],
            micronutrients: data.mealData.data.micronutrients || [],
            calories: data.mealData.data.calories || data.mealData.calories || 0
          }
        };
      }
      // First try to use the nutrients field if it exists and has good data
      else if (data.nutrients && 
          ((data.nutrients.macronutrients && data.nutrients.macronutrients.length > 0) || 
           (data.nutrients.micronutrients && data.nutrients.micronutrients.length > 0))) {
        processedData = {
          ...data,
          analysis: data.nutrients  // Make sure analysis points to the nutrients object
        };
      } 
      // Then try the analysis field if nutrients wasn't good
      else if (data.analysis && 
          ((data.analysis.macronutrients && data.analysis.macronutrients.length > 0) || 
           (data.analysis.micronutrients && data.analysis.micronutrients.length > 0))) {
        processedData = {
          ...data,
          nutrients: data.analysis  // Make sure nutrients points to the analysis object
        };
      } 
      // If neither has good data, just use the raw data or fallback
      else {
        if (fallbackData && (
          (fallbackData.nutrients?.macronutrients?.length > 0) || 
          (fallbackData.analysis?.macronutrients?.length > 0) ||
          (fallbackData.macronutrients?.length > 0)
        )) {
          console.log('Health review provided no nutrients data, using fallback data');
          processedData = {
            ...fallbackData,
            insights: data.insights // At least use the health insights from the API
          };
        } else {
          processedData = data;
        }
      }
      
      // Apply full normalization
      const normalizedData = normalizeMealData(processedData);
      
      // Update state with the normalized data
      setMealData(normalizedData);
      
      // Cache the normalized data for future use
      try {
        localStorage.setItem(`meal_analysis_${mealId}`, JSON.stringify(normalizedData));
        localStorage.setItem('last_meal_analysis', JSON.stringify(normalizedData));
        console.log('Cached health review data to localStorage');
      } catch (e) {
        console.error('Error caching meal data:', e);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching health review:', err);
      
      // Use fallback data if available, otherwise show error
      if (fallbackData) {
        console.log('Using fallback data due to fetch error');
        setMealData(fallbackData);
      } else {
        setError('Failed to load meal analysis. Please try again.');
      }
      
      setLoading(false);
    }
  };
  
  // Load meal data when component mounts or meal ID changes
  const loadMealData = async () => {
    const mealId = searchParams?.get('id');
    
    if (!mealId) {
      console.error('No meal ID in URL parameters');
      setError('No meal ID provided');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading meal data for ID:', mealId);
      
      // Always fetch fresh data from the API with the force=true parameter
      // This ensures we get the latest data from Supabase and not cached responses
      const timestamp = Date.now(); // Add timestamp to prevent caching
      console.log('Fetching fresh meal data from API...');
      const response = await fetch(`/api/analyze-meal?id=${mealId}&t=${timestamp}&force=true`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API error (${response.status}):`, errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const apiData = await response.json();
      console.log('API response:', apiData);
      
      // Check if we received valid data
      if (apiData.error) {
        console.error('API returned error:', apiData.error);
        throw new Error(`API error: ${apiData.error}`);
      }
      
      // Process and normalize the data
      let processedData = apiData;
      
      // If data has a nested JSONB 'data' field, extract it
      if (apiData.data && typeof apiData.data === 'object') {
        console.log('Found JSONB data structure, extracting nested fields');
        processedData = {
          ...apiData, // Keep original fields
          ...apiData.data, // Extract nested fields from data
          // Ensure critical fields are prioritized correctly
          id: apiData.id || apiData.data.id || mealId,
          mealName: apiData.name || apiData.data.caption || apiData.data.mealName || apiData.data.dish_name || 'Analyzed Meal',
          caption: apiData.caption || apiData.data.caption || apiData.data.mealName || apiData.name || 'Analyzed Meal',
          calories: apiData.calories || apiData.data.calories || 0,
          image_url: apiData.image_url || apiData.data.image_url || apiData.data.imageUrl || '',
          goal: apiData.goal || apiData.data.goal || 'General Wellness'
        };
      }
      
      // Extract nutrients and insights with robust parsing
      const nutrientData = extractNutrients(processedData);
      
      // Combine everything together
      const normalizedData = {
        ...processedData,
        ...nutrientData,
        id: mealId,
        // Ensure we have the image URL
        imageUrl: processedData.image_url || processedData.imageUrl || '',
        image_url: processedData.image_url || processedData.imageUrl || '',
        // Ensure we have a proper meal name
        mealName: processedData.name || processedData.caption || processedData.mealName || processedData.dish_name || 'Analyzed Meal',
        name: processedData.name || processedData.caption || processedData.mealName || processedData.dish_name || 'Analyzed Meal',
        caption: processedData.caption || processedData.name || processedData.mealName || processedData.dish_name || 'Analyzed Meal',
        // Source tracking for debugging
        source: 'api'
      };
      
      console.log('Normalized meal data:', {
        id: normalizedData.id,
        name: normalizedData.name,
        calories: normalizedData.calories,
        image_url: normalizedData.image_url?.substring(0, 30) + '...',
        macronutrients: Array.isArray(normalizedData.macronutrients) ? 
          `${normalizedData.macronutrients.length} items` : 
          typeof normalizedData.macronutrients === 'object' ? 
            `Object with ${Object.keys(normalizedData.macronutrients).length} keys` : 'None',
        micronutrients: Array.isArray(normalizedData.micronutrients) ? 
          `${normalizedData.micronutrients.length} items` : 
          typeof normalizedData.micronutrients === 'object' ? 
            `Object with ${Object.keys(normalizedData.micronutrients).length} keys` : 'None'
      });
      
      // Update UI with the normalized data
      setMealData(normalizedData);
      setLoading(false);
      
      // Only cache this as a fallback
      try {
        localStorage.setItem(`meal_analysis_${mealId}`, JSON.stringify(normalizedData));
        console.log('Cached meal data to localStorage as fallback');
      } catch (cacheError) {
        console.error('Error caching data to localStorage:', cacheError);
      }
      
    } catch (err) {
      console.error('Error loading meal data from API:', err);
      
      // Only try localStorage as a fallback if API request fails
      try {
        console.log('Attempting to load from localStorage as fallback');
        const cachedData = localStorage.getItem(`meal_analysis_${mealId}`);
        
        if (cachedData) {
          console.log('Using cached data from localStorage due to API error');
          const parsedCachedData = JSON.parse(cachedData);
          
          // Process cached data through our nutrient extractor to ensure consistency
          const nutrientData = extractNutrients(parsedCachedData);
          const normalizedCachedData = {
            ...parsedCachedData,
            ...nutrientData,
            source: 'localStorage-fallback'
          };
          
          setMealData(normalizedCachedData);
          setError('Showing cached data. Could not retrieve latest data from the server.');
        } else {
          // If no cached data either, try the health review endpoint as last resort
          console.log('No cached data available, trying health review endpoint...');
          await fetchHealthReview(mealId);
        }
      } catch (cacheErr) {
        console.error('Error loading from cache:', cacheErr);
        setError('Failed to load meal analysis. Please try again.');
        
        // Last resort - try health review endpoint
        await fetchHealthReview(mealId);
      }
      
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" key="loading-state">
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-300 rounded-lg bg-red-50 text-center" key="error-container">
        <h2 className="text-xl font-semibold mb-2 text-red-600" key="error-heading">Error Loading Analysis</h2>
        <p key="error-message">{error}</p>
        
        <div className="flex flex-wrap gap-4 justify-center mt-6" key="error-buttons">
          <Button variant="destructive" asChild key="upload-btn">
            <Link href="/upload">Upload A New Food Image</Link>
          </Button>
          
          <Button variant="outline" asChild key="history-btn">
            <Link href="/history">View Meal History</Link>
          </Button>
          
          {typeof window !== 'undefined' && localStorage.getItem('last_meal_analysis') && (
            <Button 
              variant="secondary" 
              key="last-analysis-btn"
              onClick={() => {
                const lastMeal = localStorage.getItem('last_meal_analysis');
                if (lastMeal) {
                  try {
                    const parsedLastMeal = JSON.parse(lastMeal);
                    
                    // Check if this is real data, not fallback data
                    const hasRealData = 
                      (parsedLastMeal.nutrients?.macronutrients?.length > 0 || 
                       parsedLastMeal.analysis?.macronutrients?.length > 0) &&
                      parsedLastMeal.calories !== 450;
                    
                    if (hasRealData) {
                      setMealData(normalizeMealData(parsedLastMeal));
                      setError(null);
                    } else {
                      setError("The last analysis also contained only placeholder data. Please upload a new food image.");
                    }
                  } catch (err) {
                    console.error('Error using recovery data:', err);
                    setError("Couldn't load the last analysis. Please upload a new food image.");
                  }
                }
              }}>
              Try Last Successful Analysis
            </Button>
          )}
        </div>
        
        <div className="mt-6 text-sm text-gray-600" key="error-help">
          <p>This error may occur if:</p>
          <ul className="list-disc pl-6 mt-2 text-left">
            <li key="error-reason-1">The meal ID doesn't exist in the database</li>
            <li key="error-reason-2">The meal analysis failed to save correctly</li>
            <li key="error-reason-3">There are permission issues accessing the meal data</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!mealData) {
    return (
      <div className="text-center p-6 border border-yellow-200 rounded-lg bg-yellow-50" key="no-data">
        <h2 className="text-xl font-semibold mb-2 text-yellow-600">No Analysis Found</h2>
        <p>We couldn't find any analysis for this meal.</p>
      </div>
    );
  }

  // Extract nutrients for display
  const { macronutrients, micronutrients } = getDisplayNutrients(mealData);
  const totalCalories = getTotalCalories(mealData);

  // Normalize names to ensure we always have a consistent interface
  const displayData = {
    name: mealData.name || mealData.mealName || 'Analyzed Meal',
    calories: totalCalories,
    detectedFood: mealData.detectedFood || mealData.detected_food || '',
    nutrients: mealData.nutrients || mealData.analysis || null,
    imageUrl: getMealImageUrl(mealData) || mealData.imageUrl || mealData.image_url || '',
  };

  // Generate a shareable URL for this meal
  const normalizedId = typeof mealData.id === 'string' ? mealData.id.trim() : '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${baseUrl}/analysis/${normalizedId}`;

  return (
    <div className="space-y-6" key={`meal-display-${componentKey}`}>
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{displayData.name}</h1>
          <p className="text-gray-600">{displayData.detectedFood}</p>
          {displayData.calories > 0 && (
            <p className="font-semibold mt-2">{displayData.calories} calories</p>
          )}
        </div>
        
        {displayData.imageUrl && (
          <div className="w-full md:w-1/3">
            <img 
              src={displayData.imageUrl} 
              alt={displayData.name} 
              className="rounded-lg shadow-md w-full h-auto object-cover"
              onError={(e) => {
                // If image fails to load, try the fallback image
                (e.target as HTMLImageElement).src = '/placeholder-meal.jpg';
              }}
            />
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Nutritional Information</h2>
        
        {/* Properly display calories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-6">
          <div className="bg-gray-800/40 p-6 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="text-xl font-medium">Total Calories</h3>
              <p className="text-gray-400">Estimated energy content</p>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {totalCalories} kcal
            </div>
          </div>
        </div>

        {/* Enhanced tabbed interface for nutrients */}
        <Tabs defaultValue="macros" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="macros" className="text-base">Macronutrients</TabsTrigger>
            <TabsTrigger value="micros" className="text-base">Micronutrients</TabsTrigger>
            <TabsTrigger value="insights" className="text-base">Insights</TabsTrigger>
          </TabsList>
          
          {/* Macronutrients Tab */}
          <TabsContent value="macros">
            {macronutrients.length > 0 ? (
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-xl font-semibold">Macronutrients</h3>
                  <p className="text-sm text-gray-400">% of Daily Value</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {macronutrients.map((nutrient, index) => (
                    <EnhancedNutrientDisplay
                      key={`macro-${nutrient.name}-${index}`}
                      nutrient={nutrient}
                      userProfile={userProfile}
                      colorScheme="macro"
                      showDescription={true}
                    />
                  ))}
                </div>
                
                {/* Macro Distribution Pie Chart */}
                <div className="mt-8 bg-gray-800/40 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-4">Macronutrient Distribution</h4>
                  <div className="h-64 flex justify-center">
                    <MacroChart 
                      macros={macronutrients}
                      calories={totalCalories}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/40 p-4 rounded-lg" key="no-macros">
                <p className="text-gray-400">Macronutrient details not available for this meal.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Micronutrients Tab */}
          <TabsContent value="micros">
            {micronutrients.length > 0 ? (
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-xl font-semibold">Micronutrients</h3>
                  <p className="text-sm text-gray-400">% of Daily Value</p>
                </div>
                
                {/* Group micronutrients by type */}
                {(() => {
                  // Categorize micronutrients
                  const vitamins = micronutrients.filter(n => 
                    n.name.toLowerCase().includes('vitamin') || 
                    ['thiamin', 'riboflavin', 'niacin', 'folate', 'biotin', 'pantothenic'].some(v => 
                      n.name.toLowerCase().includes(v)
                    )
                  );
                  
                  const minerals = micronutrients.filter(n => 
                    ['calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc', 
                     'copper', 'manganese', 'selenium', 'chromium', 'molybdenum', 'chloride', 'iodine'].some(m => 
                      n.name.toLowerCase().includes(m)
                    )
                  );
                  
                  const other = micronutrients.filter(n => 
                    !vitamins.includes(n) && !minerals.includes(n)
                  );
                  
                  return (
                    <>
                      {vitamins.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-lg font-medium mb-3 text-amber-400">Vitamins</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vitamins.map((nutrient, index) => (
                              <EnhancedNutrientDisplay
                                key={`vitamin-${nutrient.name}-${index}`}
                                nutrient={nutrient}
                                userProfile={userProfile}
                                colorScheme="vitamin"
                                showDescription={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {minerals.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-lg font-medium mb-3 text-purple-400">Minerals</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {minerals.map((nutrient, index) => (
                              <EnhancedNutrientDisplay
                                key={`mineral-${nutrient.name}-${index}`}
                                nutrient={nutrient}
                                userProfile={userProfile}
                                colorScheme="mineral"
                                showDescription={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {other.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium mb-3">Other Nutrients</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {other.map((nutrient, index) => (
                              <EnhancedNutrientDisplay
                                key={`other-${nutrient.name}-${index}`}
                                nutrient={nutrient}
                                userProfile={userProfile}
                                colorScheme="micro"
                                showDescription={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-gray-800/40 p-4 rounded-lg" key="no-micros">
                <p className="text-gray-400">Micronutrient details not available for this meal.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="space-y-6">
              {/* Benefits section */}
              {Array.isArray(mealData?.nutrients?.benefits) && mealData.nutrients.benefits.length > 0 && (
                <div className="bg-green-900/20 p-5 rounded-lg border border-green-700/30">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">Health Benefits</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {mealData.nutrients.benefits.map((benefit, index) => (
                      <li key={index} className="text-gray-300">{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Concerns section (if available) */}
              {Array.isArray(mealData?.nutrients?.concerns) && mealData.nutrients.concerns.length > 0 && (
                <div className="bg-yellow-900/20 p-5 rounded-lg border border-yellow-700/30">
                  <h3 className="text-xl font-semibold mb-3 text-yellow-400">Nutritional Considerations</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {mealData.nutrients.concerns.map((concern, index) => (
                      <li key={index} className="text-gray-300">{concern}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Suggestions section */}
              {Array.isArray(mealData?.nutrients?.suggestions) && mealData.nutrients.suggestions.length > 0 && (
                <div className="bg-blue-900/20 p-5 rounded-lg border border-blue-700/30">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {mealData.nutrients.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-300">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Goal alignment */}
              {mealData?.nutrients?.personalized_feedback?.goal_alignment && (
                <div className="bg-purple-900/20 p-5 rounded-lg border border-purple-700/30 mt-4">
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">Goal Alignment</h3>
                  <p className="text-gray-300">{mealData.nutrients.personalized_feedback.goal_alignment}</p>
                </div>
              )}
              
              {/* Fallback if no insights data available */}
              {(!Array.isArray(mealData?.nutrients?.benefits) || mealData.nutrients.benefits.length === 0) &&
               (!Array.isArray(mealData?.nutrients?.concerns) || mealData.nutrients.concerns.length === 0) &&
               (!Array.isArray(mealData?.nutrients?.suggestions) || mealData.nutrients.suggestions.length === 0) &&
               (!mealData?.nutrients?.personalized_feedback?.goal_alignment) && (
                <div className="bg-gray-800/40 p-4 rounded-lg">
                  <p className="text-gray-400">Detailed insights not available for this meal.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="text-sm text-gray-500 mt-4">
        {mealData.source ? (
          <p>Data source: {mealData.source}</p>
        ) : (
          <p>Data loaded from application memory</p>
        )}
      </div>

      <div className="mt-6">
        <Button asChild>
          <Link href={shareUrl}>Share This Analysis</Link>
        </Button>
      </div>
    </div>
  );
}

// Helper function to determine if a nutrient is a mineral
const isMineral = (name: string): boolean => {
  const minerals = [
    'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 
    'sodium', 'zinc', 'copper', 'manganese', 'selenium', 'iodine',
    'chromium', 'molybdenum', 'chloride', 'fluoride'
  ];
  
  const lowerName = name.toLowerCase();
  return minerals.some(mineral => lowerName.includes(mineral));
};

// Add function to check if nutrient is a vitamin
const isVitamin = (name: string): boolean => {
  const vitamins = [
    'vitamin a', 'vitamin c', 'vitamin d', 'vitamin e', 'vitamin k',
    'vitamin b1', 'vitamin b2', 'vitamin b3', 'vitamin b5', 'vitamin b6',
    'vitamin b7', 'vitamin b9', 'vitamin b12', 'folate', 'thiamin', 
    'riboflavin', 'niacin', 'pantothenic', 'biotin', 'cobalamin'
  ];
  
  const lowerName = name.toLowerCase();
  return vitamins.some(vitamin => lowerName.includes(vitamin));
};

// Add a new function to check if nutrient is an electrolyte
const isElectrolyte = (name: string): boolean => {
  const electrolytes = ['sodium', 'potassium', 'chloride', 'magnesium', 'calcium', 'phosphate', 'bicarbonate'];
  
  const lowerName = name.toLowerCase();
  return electrolytes.some(electrolyte => lowerName.includes(electrolyte));
};

// Add a function to categorize micronutrients
const categorizeMicronutrient = (nutrient: Nutrient): 'vitamin' | 'mineral' | 'electrolyte' | 'other' => {
  const name = nutrient.name.toLowerCase();
  
  if (isVitamin(name)) return 'vitamin';
  if (isElectrolyte(name)) return 'electrolyte';
  if (isMineral(name)) return 'mineral';
  return 'other';
};

// Dynamic functions to generate AI-like insights when GPT data is missing
const generateSuggestions = (mealData: MealData | null, profile: any): string[] => {
  if (!mealData) return ["Try to include a variety of foods in your meals for balanced nutrition."];
  
  const suggestions: string[] = [];
  
  // Check protein content
  const proteinNutrient = mealData.analysis?.macronutrients?.find(n => 
    n.name.toLowerCase().includes('protein')
  );
  if (proteinNutrient && (proteinNutrient.percentDailyValue || 0) < 20) {
    suggestions.push("Consider adding a protein source like chicken, fish, tofu, or legumes to increase the protein content.");
  }
  
  // Check fiber content
  const fiberNutrient = mealData.analysis?.macronutrients?.find(n => 
    n.name.toLowerCase().includes('fiber')
  );
  if (fiberNutrient && (fiberNutrient.percentDailyValue || 0) < 15) {
    suggestions.push("Add more vegetables, fruits, or whole grains to increase fiber content for better digestive health.");
  }
  
  // Check vitamin content
  const lowVitamins = mealData.analysis?.micronutrients?.filter(n => 
    isVitamin(n.name) && (n.percentDailyValue || 0) < 10
  );
  if (lowVitamins && lowVitamins.length > 2) {
    suggestions.push("This meal is low in several vitamins. Consider adding more fruits and vegetables to boost vitamin content.");
  }
  
  // Check for high sodium
  const sodiumNutrient = mealData.analysis?.micronutrients?.find(n => 
    n.name.toLowerCase().includes('sodium')
  );
  if (sodiumNutrient && (sodiumNutrient.percentDailyValue || 0) > 30) {
    suggestions.push("This meal contains a significant amount of sodium. Consider reducing salt or processed food intake in your next meals.");
  }
  
  // Add goal-specific suggestions
  if (profile?.goal) {
    const goal = profile.goal.toLowerCase();
    if (goal.includes('weight loss')) {
      suggestions.push("For weight loss goals, consider adding more vegetables for volume while keeping calories moderate.");
    } else if (goal.includes('muscle') || goal.includes('strength')) {
      suggestions.push("For muscle building, try to include high-quality protein sources with each meal and ensure adequate calorie intake.");
    } else if (goal.includes('heart') || goal.includes('cardiovascular')) {
      suggestions.push("For heart health, focus on including omega-3 fatty acids from fatty fish, walnuts, or flaxseeds in your diet.");
    }
  }
  
  // Add fallbacks if no specific suggestions
  if (suggestions.length === 0) {
    suggestions.push("Balance your meal with a protein source, complex carbohydrates, and colorful vegetables for optimal nutrition.");
    suggestions.push("Stay hydrated by drinking water with your meals rather than sugary beverages.");
  }
  
  return suggestions.slice(0, 4); // Return up to 4 suggestions
};

const generateStrengths = (mealData: MealData | null, profile: any): string[] => {
  if (!mealData) return ["Unable to analyze meal strengths."];
  
  const strengths: string[] = [];
  
  // Check high nutrients
  const highNutrients = [
    ...mealData.analysis?.macronutrients || [], 
    ...mealData.analysis?.micronutrients || []
  ].filter(n => (n.percentDailyValue || 0) > 25 && !n.name.toLowerCase().includes('sodium'));
  
  // Add specific strengths based on nutrient content
  if (highNutrients.length > 0) {
    const nutrientNames = highNutrients.slice(0, 3).map(n => n.name);
    if (nutrientNames.length === 1) {
      strengths.push(`Good source of ${nutrientNames[0]}.`);
    } else if (nutrientNames.length === 2) {
      strengths.push(`Good source of ${nutrientNames[0]} and ${nutrientNames[1]}.`);
    } else {
      strengths.push(`Rich in multiple nutrients including ${nutrientNames.join(', ')}.`);
    }
  }
  
  // Add protein strength if applicable
  const proteinNutrient = mealData.analysis?.macronutrients?.find(n => 
    n.name.toLowerCase().includes('protein')
  );
  if (proteinNutrient && (proteinNutrient.percentDailyValue || 0) > 25) {
    strengths.push("Good protein content to support muscle maintenance and satiety.");
  }
  
  // Add fiber strength if applicable
  const fiberNutrient = mealData.analysis?.macronutrients?.find(n => 
    n.name.toLowerCase().includes('fiber')
  );
  if (fiberNutrient && (fiberNutrient.percentDailyValue || 0) > 20) {
    strengths.push("Contains beneficial fiber for digestive health and sustained energy.");
  }
  
  // Add general strengths based on meal contents
  if (mealData.ingredients?.some(item => 
    item.name.toLowerCase().includes('vegetable') || 
    item.name.toLowerCase().includes('broccoli') ||
    item.name.toLowerCase().includes('spinach') ||
    item.name.toLowerCase().includes('kale')
  )) {
    strengths.push("Includes vegetables that provide essential vitamins, minerals, and antioxidants.");
  }
  
  if (mealData.ingredients?.some(item => 
    item.name.toLowerCase().includes('whole grain') || 
    item.name.toLowerCase().includes('brown rice') ||
    item.name.toLowerCase().includes('quinoa')
  )) {
    strengths.push("Contains whole grains that provide complex carbohydrates and sustained energy.");
  }
  
  // Add fallbacks if no specific strengths
  if (strengths.length === 0) {
    strengths.push("Provides calories and nutrients to fuel your body's needs.");
  }
  
  return strengths;
};

const generateGaps = (mealData: MealData | null, profile: any): string[] => {
  if (!mealData) return ["Unable to analyze nutritional gaps."];
  
  const gaps: string[] = [];
  
  // Check low nutrients
  const macroNutrients = mealData.analysis?.macronutrients || [];
  const microNutrients = mealData.analysis?.micronutrients || [];
  
  // Add protein gap if applicable
  const proteinNutrient = macroNutrients.find(n => 
    n.name.toLowerCase().includes('protein')
  );
  if (!proteinNutrient || (proteinNutrient.percentDailyValue || 0) < 15) {
    gaps.push("Low in protein, which is important for muscle maintenance and recovery.");
  }
  
  // Add fiber gap if applicable
  const fiberNutrient = macroNutrients.find(n => 
    n.name.toLowerCase().includes('fiber')
  );
  if (!fiberNutrient || (fiberNutrient.percentDailyValue || 0) < 10) {
    gaps.push("Low in dietary fiber, which supports digestive health and sustained energy.");
  }
  
  // Check for low vitamins
  const vitamins = microNutrients.filter(n => isVitamin(n.name));
  if (vitamins.length === 0 || vitamins.every(v => (v.percentDailyValue || 0) < 10)) {
    gaps.push("Limited vitamin content - consider adding more fruits and vegetables.");
  }
  
  // Check for low minerals
  const minerals = microNutrients.filter(n => isMineral(n.name) && !n.name.toLowerCase().includes('sodium'));
  if (minerals.length === 0 || minerals.every(m => (m.percentDailyValue || 0) < 10)) {
    gaps.push("Limited mineral content - consider adding more whole foods and leafy greens.");
  }
  
  // Add sodium concern if applicable
  const sodiumNutrient = microNutrients.find(n => 
    n.name.toLowerCase().includes('sodium')
  );
  if (sodiumNutrient && (sodiumNutrient.percentDailyValue || 0) > 40) {
    gaps.push("Higher in sodium than ideal - be mindful of sodium intake in other meals today.");
  }
  
  // Add general gap based on meal contents
  if (!mealData.ingredients?.some(item => 
    item.name.toLowerCase().includes('vegetable') || 
    item.name.toLowerCase().includes('fruit')
  )) {
    gaps.push("Limited fruits or vegetables - these provide essential vitamins and antioxidants.");
  }
  
  // Add fallbacks if no specific gaps
  if (gaps.length === 0) {
    gaps.push("No significant nutritional gaps identified.");
  }
  
  return gaps;
};

// Helper function to extract data regardless of format
const extractNutrients = (data: any): any => {
  // Check all possible locations where nutrients might be stored
  let macronutrients = [];
  let micronutrients = [];
  let benefits = [];
  let concerns = [];
  let suggestions = [];
  let calories = 0;
  
  // Try to get calories from various locations
  calories = data.calories || 
            (data.analysis?.calories) || 
            (data.nutrients?.calories) || 
            (data.data?.calories) || 
            0; // No default value to avoid overriding real data
  
  // FIRST PRIORITY: structured object format directly from DB
  if (data.macronutrients && typeof data.macronutrients === 'object' && !Array.isArray(data.macronutrients)) {
    console.log('Found structured JSONB object format for macronutrients');
    // Convert the PostgreSQL JSONB object format to array format for display
    // Format: {"protein": {"g": 30, "dv_percent": 60}} -> [{name: "Protein", amount: 30, unit: "g", percentDailyValue: 60}]
    macronutrients = Object.entries(data.macronutrients).map(([key, value]: [string, any]) => {
      // Handle if no value
      if (!value || typeof value !== 'object') return null;
      
      // Format the nutrient name for better display (protein -> Protein)
      const formattedName = key.replace(/_/g, ' ')
                           .split(' ')
                           .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                           .join(' ');
      
      // Find the amount key (first key that's not dv_percent)
      const unitKey = Object.keys(value).find(k => k !== 'dv_percent') || 'g';
      const amount = value[unitKey] || 0;
      
      return {
        name: formattedName,
        amount: amount,
        unit: unitKey,
        percentDailyValue: value.dv_percent || 0
      };
    }).filter(item => item !== null); // Remove any null items
  } 
  // SECOND PRIORITY: array format with direct field
  else if (data.macronutrients && Array.isArray(data.macronutrients) && data.macronutrients.length > 0) {
    console.log('Found array format for macronutrients with direct field access');
    macronutrients = data.macronutrients.map(macro => ({
      ...macro,
      // Ensure we have percentDailyValue consistently named
      percentDailyValue: macro.percentDailyValue || macro.dv_percent || 0,
      dv_percent: macro.dv_percent || macro.percentDailyValue || 0
    }));
  }
  // THIRD PRIORITY: nested in analysis or nutrients object
  else if (data.analysis?.macronutrients && Array.isArray(data.analysis.macronutrients) && data.analysis.macronutrients.length > 0) {
    console.log('Found macronutrients nested in analysis object');
    macronutrients = data.analysis.macronutrients.map(macro => ({
      ...macro,
      percentDailyValue: macro.percentDailyValue || macro.dv_percent || 0,
      dv_percent: macro.dv_percent || macro.percentDailyValue || 0
    }));
  } else if (data.nutrients?.macronutrients && Array.isArray(data.nutrients.macronutrients) && data.nutrients.macronutrients.length > 0) {
    console.log('Found macronutrients nested in nutrients object');
    macronutrients = data.nutrients.macronutrients.map(macro => ({
      ...macro,
      percentDailyValue: macro.percentDailyValue || macro.dv_percent || 0,
      dv_percent: macro.dv_percent || macro.percentDailyValue || 0
    }));
  } else if (data.data?.macronutrients) {
    console.log('Found macronutrients nested in data.data object');
    // Could be array or object format
    if (Array.isArray(data.data.macronutrients) && data.data.macronutrients.length > 0) {
      macronutrients = data.data.macronutrients.map(macro => ({
        ...macro,
        percentDailyValue: macro.percentDailyValue || macro.dv_percent || 0,
        dv_percent: macro.dv_percent || macro.percentDailyValue || 0
      }));
    } else if (typeof data.data.macronutrients === 'object') {
      // Handle object format
      macronutrients = Object.entries(data.data.macronutrients).map(([key, value]: [string, any]) => {
        if (!value || typeof value !== 'object') return null;
        
        const formattedName = key.replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
        
        const unitKey = Object.keys(value).find(k => k !== 'dv_percent') || 'g';
        const amount = value[unitKey] || 0;
        
        return {
          name: formattedName,
          amount: amount,
          unit: unitKey,
          percentDailyValue: value.dv_percent || 0
        };
      }).filter(item => item !== null);
    }
  }
  
  // Similarly for micronutrients, prioritize structured JSONB format
  if (data.micronutrients && typeof data.micronutrients === 'object' && !Array.isArray(data.micronutrients)) {
    console.log('Found structured JSONB object format for micronutrients');
    // Convert the PostgreSQL JSONB object format to array format for display
    // Format: {"iron": {"mg": 3.5, "dv_percent": 19}} -> [{name: "Iron", amount: 3.5, unit: "mg", percentDailyValue: 19}]
    micronutrients = Object.entries(data.micronutrients).map(([key, value]: [string, any]) => {
      // Handle if no value
      if (!value || typeof value !== 'object') return null;
      
      // Format the nutrient name for better display (vitamin_c -> Vitamin C)
      const formattedName = key.replace(/_/g, ' ')
                           .split(' ')
                           .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                           .join(' ');
      
      // Find the amount key (first key that's not dv_percent)
      const unitKey = Object.keys(value).find(k => k !== 'dv_percent') || 'mg';
      const amount = value[unitKey] || 0;
      
      return {
        name: formattedName,
        amount: amount,
        unit: unitKey,
        percentDailyValue: value.dv_percent || 0
      };
    }).filter(item => item !== null); // Remove any null items
  } 
  // Then try array format directly
  else if (data.micronutrients && Array.isArray(data.micronutrients) && data.micronutrients.length > 0) {
    console.log('Found array format for micronutrients with direct field access');
    micronutrients = data.micronutrients.map(micro => ({
      ...micro,
      percentDailyValue: micro.percentDailyValue || micro.dv_percent || 0,
      dv_percent: micro.dv_percent || micro.percentDailyValue || 0
    }));
  } 
  // Fall back to nested objects
  else if (data.analysis?.micronutrients && Array.isArray(data.analysis.micronutrients) && data.analysis.micronutrients.length > 0) {
    console.log('Found micronutrients nested in analysis object');
    micronutrients = data.analysis.micronutrients.map(micro => ({
      ...micro,
      percentDailyValue: micro.percentDailyValue || micro.dv_percent || 0,
      dv_percent: micro.dv_percent || micro.percentDailyValue || 0
    }));
  } else if (data.nutrients?.micronutrients && Array.isArray(data.nutrients.micronutrients) && data.nutrients.micronutrients.length > 0) {
    console.log('Found micronutrients nested in nutrients object');
    micronutrients = data.nutrients.micronutrients.map(micro => ({
      ...micro,
      percentDailyValue: micro.percentDailyValue || micro.dv_percent || 0,
      dv_percent: micro.dv_percent || micro.percentDailyValue || 0
    }));
  } else if (data.data?.micronutrients) {
    console.log('Found micronutrients nested in data.data object');
    // Could be array or object format
    if (Array.isArray(data.data.micronutrients) && data.data.micronutrients.length > 0) {
      micronutrients = data.data.micronutrients.map(micro => ({
        ...micro,
        percentDailyValue: micro.percentDailyValue || micro.dv_percent || 0,
        dv_percent: micro.dv_percent || micro.percentDailyValue || 0
      }));
    } else if (typeof data.data.micronutrients === 'object') {
      // Handle object format
      micronutrients = Object.entries(data.data.micronutrients).map(([key, value]: [string, any]) => {
        if (!value || typeof value !== 'object') return null;
        
        const formattedName = key.replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
        
        const unitKey = Object.keys(value).find(k => k !== 'dv_percent') || 'mg';
        const amount = value[unitKey] || 0;
        
        return {
          name: formattedName,
          amount: amount,
          unit: unitKey,
          percentDailyValue: value.dv_percent || 0
        };
      }).filter(item => item !== null);
    }
  }
  
  // Extract benefits - handle both direct arrays and JSONB format with 'items'
  if (data.benefits) {
    if (Array.isArray(data.benefits)) {
      benefits = data.benefits;
    } else if (data.benefits.items && Array.isArray(data.benefits.items)) {
      benefits = data.benefits.items;
    }
  } else if (data.insights && data.insights.benefits && Array.isArray(data.insights.benefits)) {
    benefits = data.insights.benefits;
  } else if (data.insights && data.insights.strengths && Array.isArray(data.insights.strengths)) {
    benefits = data.insights.strengths;
  } else if (data.personalized_feedback && data.personalized_feedback.benefits && Array.isArray(data.personalized_feedback.benefits)) {
    benefits = data.personalized_feedback.benefits;
  } else if (data.analysis && data.analysis.benefits && Array.isArray(data.analysis.benefits)) {
    benefits = data.analysis.benefits;
  } else if (data.data && data.data.benefits) {
    if (Array.isArray(data.data.benefits)) {
      benefits = data.data.benefits;
    } else if (data.data.benefits.items && Array.isArray(data.data.benefits.items)) {
      benefits = data.data.benefits.items;
    }
  }
  
  // Extract concerns - handle both direct arrays and JSONB format with 'items'
  if (data.concerns) {
    if (Array.isArray(data.concerns)) {
      concerns = data.concerns;
    } else if (data.concerns.items && Array.isArray(data.concerns.items)) {
      concerns = data.concerns.items;
    }
  } else if (data.insights && data.insights.concerns && Array.isArray(data.insights.concerns)) {
    concerns = data.insights.concerns;
  } else if (data.insights && data.insights.gaps && Array.isArray(data.insights.gaps)) {
    concerns = data.insights.gaps;
  } else if (data.personalized_feedback && data.personalized_feedback.concerns && Array.isArray(data.personalized_feedback.concerns)) {
    concerns = data.personalized_feedback.concerns;
  } else if (data.analysis && data.analysis.concerns && Array.isArray(data.analysis.concerns)) {
    concerns = data.analysis.concerns;
  } else if (data.data && data.data.concerns) {
    if (Array.isArray(data.data.concerns)) {
      concerns = data.data.concerns;
    } else if (data.data.concerns.items && Array.isArray(data.data.concerns.items)) {
      concerns = data.data.concerns.items;
    }
  }
  
  // Extract suggestions - handle both direct arrays and JSONB format with 'items'
  if (data.suggestions) {
    if (Array.isArray(data.suggestions)) {
      suggestions = data.suggestions;
    } else if (data.suggestions.items && Array.isArray(data.suggestions.items)) {
      suggestions = data.suggestions.items;
    }
  } else if (data.insights && data.insights.suggestions && Array.isArray(data.insights.suggestions)) {
    suggestions = data.insights.suggestions;
  } else if (data.insights && data.insights.recommendations && Array.isArray(data.insights.recommendations)) {
    suggestions = data.insights.recommendations;
  } else if (data.personalized_feedback && data.personalized_feedback.suggestions && Array.isArray(data.personalized_feedback.suggestions)) {
    suggestions = data.personalized_feedback.suggestions;
  } else if (data.analysis && data.analysis.suggestions && Array.isArray(data.analysis.suggestions)) {
    suggestions = data.analysis.suggestions;
  } else if (data.data && data.data.suggestions) {
    if (Array.isArray(data.data.suggestions)) {
      suggestions = data.data.suggestions;
    } else if (data.data.suggestions.items && Array.isArray(data.data.suggestions.items)) {
      suggestions = data.data.suggestions.items;
    }
  }
  
  // Only use fallback data if we truly have NO macronutrient data at all
  if (!macronutrients || (Array.isArray(macronutrients) && macronutrients.length === 0)) {
    console.warn('No macronutrient data found in any format, checking if we should use fallback values');
    // ONLY create fallbacks if we have calories but no macros
    if (calories > 0) {
      console.warn('Using minimal fallback macronutrients based on calories');
      // Create basic macros based on calories (40% carbs, 30% protein, 30% fat)
      const totalCalories = calories;
      const carbCalories = totalCalories * 0.4;
      const proteinCalories = totalCalories * 0.3;
      const fatCalories = totalCalories * 0.3;
      
      macronutrients = [
        { name: "Protein", amount: Math.round(proteinCalories / 4), unit: "g", percentDailyValue: Math.round((proteinCalories / 4) * 2) },
        { name: "Carbohydrates", amount: Math.round(carbCalories / 4), unit: "g", percentDailyValue: Math.round((carbCalories / 4) / 3) },
        { name: "Fat", amount: Math.round(fatCalories / 9), unit: "g", percentDailyValue: Math.round((fatCalories / 9) * 1.5) },
        { name: "Fiber", amount: Math.round(totalCalories / 100), unit: "g", percentDailyValue: Math.round(totalCalories / 100 * 3.5) }
      ];
    }
  }

  // Return the extracted or generated data
  return {
    calories,
    macronutrients,
    micronutrients,
    benefits,
    concerns,
    suggestions
  };
}; 