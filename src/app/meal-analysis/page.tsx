'use client';

<<<<<<< HEAD
import React from 'react';
import { MealAnalysisForm } from '@/components/MealAnalysisForm';
import { SearchParams } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function MealAnalysisPage({ searchParams }: { searchParams: SearchParams }) {
  // Check if we have analysis data passed as URL parameters
  const hasAnalysisData = 
    searchParams.success === 'true' && 
    searchParams.mealId && 
    searchParams.mealContents;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Meal Analysis</CardTitle>
          <CardDescription>
            {hasAnalysisData 
              ? "Here's your meal analysis results. You can save this to your history."
              : "Upload a photo of your food to get nutritional information and analysis."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealAnalysisForm searchParams={searchParams} />
        </CardContent>
      </Card>
=======
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MealSummaryCard } from '../../components/MealSummaryCard';
import { MacroCard, Nutrient } from '../../components/MacroCard';
import { MicroCard } from '../../components/MicroCard';
import { RecoveryInsightsCard } from '../../components/RecoveryInsightsCard';
import { HydrationCard } from '../../components/HydrationCard';
import { GlycemicLoadCard } from '../../components/GlycemicLoadCard';
import { AnalysisSection } from '../../components/AnalysisSection';
import { groupNutrientsByCategory } from '../../lib/utils';
import { NutritionAnalysis } from '../../lib/gpt/validator';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// This would come from GPT-4o's structured response
interface RecoveryInsight {
  title: string;
  description: string;
}

interface EnhancedAnalysisData {
  caption: string;
  ingredients: string[];
  analysis: NutritionAnalysis & {
    recoveryInsights?: RecoveryInsight[];
    hydration?: {
      level: number;
      waterContent: number;
      unit: string;
      tips: string[];
    };
    glycemicLoad?: {
      value: number;
      index?: number;
      carbs: number;
      unit: string;
      foodTypes: string[];
      impact: string;
    };
  };
  goal?: string;
  imageUrl?: string;
}

export default function MealAnalysisPage() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      let debugData: string[] = [];
      
      try {
        setLoading(true);
        setError(null);
        setImageError(false);

        // Get ID from URL
        const mealId = searchParams.get('id');
        const encodedData = searchParams.get('data');
        
        debugData.push(`Time: ${new Date().toISOString()}`);
        debugData.push(`User: ${user?.id || 'Not logged in'}`);
        debugData.push(`Meal ID: ${mealId || 'Not provided'}`);
        debugData.push(`Encoded data: ${encodedData ? 'Present' : 'Not provided'}`);

        // If we have encoded data, use that directly
        if (encodedData) {
          debugData.push('Using encoded data from URL');
          try {
            const decodedData = JSON.parse(decodeURIComponent(encodedData));
            setAnalysisData(decodedData);
            setLoading(false);
            debugData.push(`Decoded data: ${JSON.stringify(decodedData).substring(0, 150)}...`);
            setDebugInfo(debugData.join('\n'));
            return;
          } catch (err) {
            debugData.push(`Error decoding data: ${err}`);
            console.error('Error decoding analysis data:', err);
          }
        }

        // If we have a meal ID, fetch from the database
        if (mealId) {
          debugData.push(`Fetching meal with ID: ${mealId}`);
          // Fetch the meal data from Supabase
          const { data, error } = await supabase
            .from('meals')
            .select('*')
            .eq('id', mealId)
            .single();

          if (error) {
            debugData.push(`Error fetching meal: ${error.message}`);
            console.error('Error fetching meal:', error);
            setError('Failed to fetch meal data. Please try again later.');
          } else if (data) {
            debugData.push('Successfully fetched meal data');
            debugData.push(`Meal data: ${JSON.stringify(data).substring(0, 150)}...`);
            // Format the data for display
            setAnalysisData({
              caption: data.caption,
              imageUrl: data.image_url,
              analysis: data.analysis,
              goal: data.goal,
              mealId: data.id,
              createdAt: data.created_at
            });
          } else {
            debugData.push('No meal found with that ID');
            setError('No meal found with that ID.');
          }
        } else {
          debugData.push('No meal ID provided');
          setError('No meal ID provided. Please upload a meal to analyze.');
        }
      } catch (err: any) {
        debugData.push(`Unexpected error: ${err.message}`);
        console.error('Error in meal analysis page:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
        setDebugInfo(debugData.join('\n'));
      }
    }

    fetchData();
  }, [searchParams, user]);

  // Dummy description function for nutrients
  const getDummyDescription = (nutrientName: string): string => {
    const descriptions: Record<string, string> = {
      'Protein': 'Essential for muscle repair and growth. Helps with satiety and maintaining lean body mass.',
      'Carbs': 'Primary energy source for your body and brain. Important for replenishing glycogen stores.',
      'Fat': 'Supports hormone production and helps absorb fat-soluble vitamins. Provides long-lasting energy.',
      'Fiber': 'Aids digestion, promotes gut health, and helps maintain steady blood sugar levels.',
      'Calcium': 'Essential for bone health, muscle function, and nerve transmission.',
      'Iron': 'Important for oxygen transport in the blood and energy production.',
      'Vitamin C': 'Powerful antioxidant that supports immune function and collagen production.',
      'Vitamin D': 'Crucial for calcium absorption, bone health, and immune function.',
      'Omega-3': 'Supports heart and brain health with anti-inflammatory properties.',
      'Potassium': 'Helps maintain fluid balance and supports muscle and nerve function.',
      'Magnesium': 'Involved in over 300 biochemical reactions, including energy production and muscle function.',
      'Zinc': 'Important for immune function, wound healing, and protein synthesis.'
    };
    
    for (const key in descriptions) {
      if (nutrientName.toLowerCase().includes(key.toLowerCase())) {
        return descriptions[key];
      }
    }
    
    return 'Supports overall health and wellbeing as part of a balanced diet.';
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button
            onClick={() => router.push('/upload')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Upload a Meal
          </button>
          
          {/* Debug info */}
          <div className="mt-8 border-t pt-4">
            <details className="text-xs">
              <summary className="text-gray-500 cursor-pointer">Debug Info</summary>
              <div className="mt-2 p-4 bg-gray-100 rounded whitespace-pre-wrap font-mono text-xs">
                {debugInfo}
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-40 bg-gray-200 rounded mb-6"></div>
          <div className="h-40 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  const { caption, ingredients, analysis, imageUrl, goal } = analysisData;
  const { macronutrients, micronutrients, recoveryInsights, hydration, glycemicLoad } = analysis || {};
  
  // Ensure ingredients are always an array
  const ingredientsList = Array.isArray(ingredients) ? ingredients : [];
  
  // Group micronutrients for better display
  const groupedMicronutrients = groupNutrientsByCategory(micronutrients || []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Nutrition Analysis</h1>
      
      {/* Meal Summary Card */}
      <MealSummaryCard 
        caption={caption || 'My meal'} 
        ingredients={ingredientsList} 
        imageUrl={imageUrl}
        calories={analysis?.calories || 0}
        goal={goal || 'General Wellness'}
      />
      
      {/* Macronutrients Section */}
      {macronutrients && macronutrients.length > 0 && (
        <AnalysisSection 
          title="Macronutrients" 
          className="mt-10"
          icon={
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {macronutrients.map((macro, index) => (
              <MacroCard key={index} macronutrient={macro as Nutrient} />
            ))}
          </div>
        </AnalysisSection>
      )}
      
      {/* Micronutrients Section */}
      {micronutrients && micronutrients.length > 0 && (
        <AnalysisSection 
          title="Micronutrients" 
          icon={
            <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          }
        >
          {Object.entries(groupedMicronutrients).map(([category, nutrients]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">{category}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {nutrients.map((nutrient, index) => (
                  <MicroCard key={index} micronutrient={nutrient as Nutrient} />
                ))}
              </div>
            </div>
          ))}
        </AnalysisSection>
      )}
      
      {/* Recovery Insights Section */}
      {recoveryInsights && recoveryInsights.length > 0 && (
        <AnalysisSection 
          title="Recovery Insights" 
          icon={
            <div className="flex items-center justify-center w-8 h-8 bg-teal-100 text-teal-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          }
        >
          <RecoveryInsightsCard 
            goal={goal || 'General Wellness'} 
            insights={recoveryInsights} 
          />
        </AnalysisSection>
      )}
      
      {/* Hydration Status Section */}
      {hydration && (
        <AnalysisSection 
          title="Hydration Status" 
          icon={
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7z" clipRule="evenodd" />
              </svg>
            </div>
          }
        >
          <HydrationCard 
            hydrationLevel={hydration.level}
            waterContent={hydration.waterContent}
            unit={hydration.unit}
            tips={hydration.tips}
          />
        </AnalysisSection>
      )}
      
      {/* Glycemic Load Section */}
      {glycemicLoad && (
        <AnalysisSection 
          title="Glycemic Impact" 
          icon={
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
            </div>
          }
        >
          <GlycemicLoadCard 
            glycemicLoad={glycemicLoad.value}
            glycemicIndex={glycemicLoad.index}
            carbs={glycemicLoad.carbs}
            unit={glycemicLoad.unit}
            foodTypes={glycemicLoad.foodTypes}
            impact={glycemicLoad.impact}
          />
        </AnalysisSection>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-center mt-10">
        <Link 
          href="/upload"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm mr-4"
        >
          Analyze Another Meal
        </Link>
        <Link 
          href="/dashboard"
          className="px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
      
      {/* Debug info */}
      <div className="mt-8 border-t pt-4">
        <details className="text-xs">
          <summary className="text-gray-500 cursor-pointer">Debug Info</summary>
          <div className="mt-2 p-4 bg-gray-100 rounded whitespace-pre-wrap font-mono text-xs">
            {debugInfo}
          </div>
        </details>
      </div>
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
    </div>
  );
} 