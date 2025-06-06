'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronsLeft, Star, Share2, Download, HelpCircle, Info, User, Activity, UserCheck, History, Printer, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import LoadingSpinner from '../LoadingSpinner';
import MealImage from '../MealImage';
import { useAuth } from '@/context/auth';
import ProfileAwareComponent from './ProfileAwareComponent';
import { ExtendedUserProfile } from '@/lib/utils/profile-manager';

// Interface for meal data
interface NutrientData {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
}

interface MealAnalysisData {
  mealName: string;
  goal?: string;
  imageUrl?: string;
  mealDescription?: string;
  mealContents: { name: string }[];
  ingredients?: { name: string; portion?: string; calories?: number }[];
  analysis: {
    calories: number;
    totalCalories?: number;
    macronutrients: NutrientData[];
    micronutrients: NutrientData[];
    phytonutrients?: NutrientData[];
    benefits?: string[];
    concerns?: string[];
  };
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
}

// Helper function to calculate personalized daily value
function calculatePersonalizedDV(
  nutrient: NutrientData,
  profile?: ExtendedUserProfile
): number {
  if (!profile || !nutrient || !nutrient.amount) return nutrient.percentDailyValue || 0;
  
  const nutrientName = nutrient.name.toLowerCase();
  const amount = nutrient.amount;
  
  // Basic reference values for standard daily values
  const dvReferences: Record<string, number> = {
    'protein': 50, // g
    'carbohydrates': 275, // g
    'carbs': 275, // g
    'fat': 78, // g
    'fiber': 28, // g
    'calcium': 1000, // mg
    'iron': 18, // mg
    'vitamin c': 90, // mg
    'vitamin d': 20, // mcg
    'vitamin a': 900, // mcg
    'potassium': 3500, // mg
  };
  
  // Calculate personalized DV based on nutrient type
  if (nutrientName === 'protein') {
    // Calculate protein needs based on weight (in kg)
    // Use 1.6g/kg as a default for active individuals
    const dailyNeed = profile.weightInKg ? profile.weightInKg * 1.6 : 50;
    return Math.round((amount / dailyNeed) * 100);
  } 
  else if (nutrientName === 'carbs' || nutrientName === 'carbohydrates') {
    // Calculate carb needs
    const dailyNeed = profile.tdee ? (profile.tdee * 0.5) / 4 : 275; // 50% of calories from carbs, 4 cal/g
    return Math.round((amount / dailyNeed) * 100);
  } 
  else if (nutrientName === 'fat') {
    // Calculate fat needs
    const dailyNeed = profile.tdee ? (profile.tdee * 0.3) / 9 : 78; // 30% of calories from fat, 9 cal/g
    return Math.round((amount / dailyNeed) * 100);
  }
  
  // For other nutrients, use the reference values
  const referenceValue = dvReferences[nutrientName] || 0;
  if (referenceValue > 0) {
    return Math.round((amount / referenceValue) * 100);
  }
  
  // If no reference value is found, return existing percentDailyValue or 0
  return nutrient.percentDailyValue || 0;
}

// MealAnalysis component that uses ProfileAwareComponent
export default function MealAnalysis({ analysisId }: { analysisId?: string }) {
  const [mealData, setMealData] = useState<MealAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Load meal analysis data
  useEffect(() => {
    const loadMealData = async () => {
      if (!analysisId) {
        setError('No meal analysis ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from database first
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('id', analysisId)
          .single();
        
        if (error) {
          console.error('[MealAnalysis] Error fetching meal analysis:', error);
          setError('Failed to load meal analysis data');
          setLoading(false);
          return;
        }
        
        if (!data) {
          setError('Meal analysis not found');
          setLoading(false);
          return;
        }
        
        // Process the meal data
        let parsedAnalysisData: MealAnalysisData;
        
        // Try parsing the analysis_data JSON
        if (data.analysis_data && typeof data.analysis_data === 'string') {
          try {
            parsedAnalysisData = JSON.parse(data.analysis_data);
          } catch (e) {
            console.error('[MealAnalysis] Error parsing analysis_data:', e);
            parsedAnalysisData = {
              mealName: data.name || 'Meal Analysis',
              goal: data.goal || 'General Health',
              imageUrl: data.image_url || '',
              mealContents: [{ name: 'Food Items' }],
              analysis: {
                calories: data.calories || 0,
                totalCalories: data.calories || 0,
                macronutrients: [
                  { name: 'Protein', amount: data.protein || 0, unit: 'g' },
                  { name: 'Carbs', amount: data.carbs || 0, unit: 'g' },
                  { name: 'Fat', amount: data.fat || 0, unit: 'g' }
                ],
                micronutrients: []
              }
            };
          }
        } else {
          // Fallback if no analysis_data present
          parsedAnalysisData = {
            mealName: data.name || 'Meal Analysis',
            goal: data.goal || 'General Health',
            imageUrl: data.image_url || '',
            mealContents: [{ name: 'Food Items' }],
            analysis: {
              calories: data.calories || 0,
              totalCalories: data.calories || 0,
              macronutrients: [
                { name: 'Protein', amount: data.protein || 0, unit: 'g' },
                { name: 'Carbs', amount: data.carbs || 0, unit: 'g' },
                { name: 'Fat', amount: data.fat || 0, unit: 'g' }
              ],
              micronutrients: []
            }
          };
        }
        
        // Set meal data state
        setMealData(parsedAnalysisData);
        
      } catch (err) {
        console.error('[MealAnalysis] Failed to load meal data:', err);
        setError('An unexpected error occurred while loading meal data');
      } finally {
        setLoading(false);
      }
    };
    
    loadMealData();
  }, [analysisId, supabase]);
  
  // Save meal to history
  const saveMealToHistory = async () => {
    if (!user || !mealData) return;
    
    try {
      setIsSaving(true);
      
      // Check if already in history
      const { data: existingEntry } = await supabase
        .from('meals')
        .select('id')
        .eq('meal_id', analysisId)
        .eq('user_id', user.id)
        .single();
      
      if (existingEntry) {
        console.log('[MealAnalysis] Meal already in history');
        return;
      }
      
      // Add to history
      await supabase
        .from('meals')
        .insert({
          meal_id: analysisId,
          user_id: user.id,
          meal_name: mealData.mealName,
          calories: mealData.analysis.calories,
          date_added: new Date().toISOString()
        });
      
      console.log('[MealAnalysis] Meal saved to history');
    } catch (e) {
      console.error('[MealAnalysis] Error saving to history:', e);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Apply personalized values based on profile
  const applyPersonalizedValues = useCallback((profile: ExtendedUserProfile | null) => {
    if (!profile || !mealData?.analysis) return mealData;
    
    // Make a deep copy of the meal data to avoid modifying the original
    const updatedMealData = JSON.parse(JSON.stringify(mealData));
    
    // Update macronutrients with personalized DV%
    if (updatedMealData.analysis.macronutrients) {
      updatedMealData.analysis.macronutrients = updatedMealData.analysis.macronutrients.map((macro: NutrientData) => {
        const personalizedDV = calculatePersonalizedDV(macro, profile);
        return {
          ...macro,
          percentDailyValue: personalizedDV
        };
      });
    }
    
    // Update micronutrients with personalized DV%
    if (updatedMealData.analysis.micronutrients) {
      updatedMealData.analysis.micronutrients = updatedMealData.analysis.micronutrients.map((micro: NutrientData) => {
        const personalizedDV = calculatePersonalizedDV(micro, profile);
        return {
          ...micro,
          percentDailyValue: personalizedDV
        };
      });
    }
    
    // Update phytonutrients with personalized DV% if they exist
    if (updatedMealData.analysis.phytonutrients) {
      updatedMealData.analysis.phytonutrients = updatedMealData.analysis.phytonutrients.map((phyto: NutrientData) => {
        const personalizedDV = calculatePersonalizedDV(phyto, profile);
        return {
          ...phyto,
          percentDailyValue: personalizedDV
        };
      });
    }
    
    return updatedMealData;
  }, [mealData]);
  
  // Render the meal analysis with personalized values
  return (
    <ProfileAwareComponent>
      {({ profile, isLoading: profileLoading, isComplete }) => {
        // Processing loading state
        if (loading || profileLoading) {
          return (
            <div className="flex justify-center items-center min-h-[400px]">
              <LoadingSpinner />
            </div>
          );
        }
        
        // Error state
        if (error) {
          return (
            <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="text-red-500" size={48} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Error Loading Analysis</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <Link 
                href="/upload" 
                className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <ArrowLeft className="mr-2" size={16} />
                Upload Another Meal
              </Link>
            </div>
          );
        }
        
        // No meal data state
        if (!mealData) {
          return (
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
              <h3 className="text-xl font-bold text-white mb-2">No Meal Data Available</h3>
              <p className="text-gray-300 mb-4">We couldn't find any analysis data for this meal.</p>
              <Link 
                href="/upload" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Upload a New Meal
              </Link>
            </div>
          );
        }
        
        // Apply personalized values if profile is complete
        const personalizedMealData = isComplete ? applyPersonalizedValues(profile) : mealData;
        
        // Render the meal analysis
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {personalizedMealData.mealName}
                </h1>
                {personalizedMealData.mealDescription && (
                  <p className="text-gray-300 mt-2">{personalizedMealData.mealDescription}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isComplete && (
                  <div className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full flex items-center">
                    <CheckCircle size={12} className="mr-1" />
                    <span>Personalized</span>
                  </div>
                )}
                <button
                  onClick={saveMealToHistory}
                  disabled={isSaving || !user}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md flex items-center disabled:opacity-50"
                >
                  <History size={16} className="mr-1.5" />
                  Save to History
                </button>
              </div>
            </div>
            
            {/* Meal Image */}
            {personalizedMealData.imageUrl && (
              <div className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700 shadow-md">
                <MealImage src={personalizedMealData.imageUrl} alt={personalizedMealData.mealName} />
              </div>
            )}
            
            {/* Nutrition Summary */}
            <div className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700 shadow-md">
              <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Nutrition Summary</h3>
                <p className="text-gray-400 text-sm mt-1">Key nutrition metrics for your meal</p>
              </div>
              
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 flex flex-col items-center justify-center">
                  <span className="text-gray-400 text-sm mb-1">Calories</span>
                  <span className="text-2xl font-bold text-white">
                    {personalizedMealData.analysis.calories}
                  </span>
                  <span className="text-gray-400 text-xs">kcal</span>
                </div>
                
                {personalizedMealData.analysis.macronutrients.map((macro: NutrientData, idx: number) => (
                  <div key={idx} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-sm mb-1">{macro.name}</span>
                    <span className="text-2xl font-bold text-white">{macro.amount}</span>
                    <span className="text-gray-400 text-xs">{macro.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Macronutrients */}
            <div className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700 shadow-md">
              <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Macronutrients</h3>
                <p className="text-gray-400 text-sm mt-1">Primary nutrients your body needs in large amounts</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {personalizedMealData.analysis.macronutrients.map((macro: NutrientData, idx: number) => (
                    <div key={idx} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{macro.name}</span>
                        <div className="flex items-center">
                          <span className="text-white font-bold">{macro.amount} {macro.unit}</span>
                          {macro.percentDailyValue !== undefined && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
                              {Math.round(macro.percentDailyValue)}% DV
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-600/30 rounded-full h-2.5">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(macro.percentDailyValue || 0, 100)}%` }}
                        ></div>
                      </div>
                      {macro.description && (
                        <p className="text-gray-400 text-sm mt-2">{macro.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Micronutrients */}
            {personalizedMealData.analysis.micronutrients && personalizedMealData.analysis.micronutrients.length > 0 && (
              <div className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700 shadow-md">
                <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                  <h3 className="text-xl font-semibold text-white">Micronutrients</h3>
                  <p className="text-gray-400 text-sm mt-1">Vitamins and minerals your body needs in smaller amounts</p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalizedMealData.analysis.micronutrients.map((micro: NutrientData, idx: number) => (
                      <div key={idx} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-medium">{micro.name}</span>
                          <div className="flex items-center">
                            <span className="text-white font-bold">{micro.amount} {micro.unit}</span>
                            {micro.percentDailyValue !== undefined && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
                                {Math.round(micro.percentDailyValue)}% DV
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-600/30 rounded-full h-2.5">
                          <div 
                            className="bg-blue-500 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(micro.percentDailyValue || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Health Benefits & Concerns */}
            {(personalizedMealData.benefits || personalizedMealData.concerns) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {personalizedMealData.benefits && personalizedMealData.benefits.length > 0 && (
                  <div className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700 shadow-md">
                    <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                      <h3 className="text-xl font-semibold text-white">Health Benefits</h3>
                      <p className="text-gray-400 text-sm mt-1">Positive aspects of this meal</p>
                    </div>
                    
                    <div className="p-6">
                      <ul className="space-y-2">
                        {personalizedMealData.benefits.map((benefit: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" size={16} />
                            <span className="text-gray-300">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {personalizedMealData.concerns && personalizedMealData.concerns.length > 0 && (
                  <div className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700 shadow-md">
                    <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                      <h3 className="text-xl font-semibold text-white">Health Considerations</h3>
                      <p className="text-gray-400 text-sm mt-1">Areas to be mindful of</p>
                    </div>
                    
                    <div className="p-6">
                      <ul className="space-y-2">
                        {personalizedMealData.concerns.map((concern: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <Info className="text-amber-500 mr-2 mt-1 flex-shrink-0" size={16} />
                            <span className="text-gray-300">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Suggestions */}
            {personalizedMealData.suggestions && personalizedMealData.suggestions.length > 0 && (
              <div className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700 shadow-md">
                <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                  <h3 className="text-xl font-semibold text-white">Meal Improvement Suggestions</h3>
                  <p className="text-gray-400 text-sm mt-1">How to enhance nutritional value</p>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-3">
                    {personalizedMealData.suggestions.map((suggestion: string, idx: number) => (
                      <li key={idx} className="flex items-start bg-gray-700/30 p-3 rounded-lg border border-gray-600/50">
                        <Star className="text-yellow-500 mr-2 mt-1 flex-shrink-0" size={16} />
                        <span className="text-gray-300">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ProfileAwareComponent>
  );
} 