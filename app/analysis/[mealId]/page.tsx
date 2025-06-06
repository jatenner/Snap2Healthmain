'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/client/ClientAuthProvider';
import PersonalizedNutritionAnalysis from '@/components/PersonalizedNutritionAnalysis';
import Link from 'next/link';

interface MealAnalysisData {
  id?: string;
  calories?: number;
  macronutrients?: any[];
  micronutrients?: any[];
  phytonutrients?: any[];
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  scientificInsights?: string[];
  goalAlignment?: string;
  glycemicImpact?: string;
  inflammatoryPotential?: string;
  nutrientDensity?: string;
  ingredients?: any[];
  analysis?: any;
  nutrients?: any;
  personalized_insights?: string;
  insights?: string;
  mealName?: string;
  goal?: string;
  imageUrl?: string;
  expertRecommendations?: string[];
  personalizedHealthInsights?: string;
  metabolicInsights?: string;
  nutritionalNarrative?: string;
  timeOfDayOptimization?: string;
  mealStory?: string;
  [key: string]: any;
}

export default function AnalysisPage() {
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<MealAnalysisData | null>(null);
  
  const mealId = params?.mealId as string;

  useEffect(() => {
    if (!mealId) {
      setError('Meal ID not found');
      setLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/meals/${mealId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Meal analysis not found. This meal may have been deleted or the link is incorrect.');
          } else if (response.status === 500) {
            throw new Error('Server error while loading meal analysis. Please try again later.');
          } else {
            throw new Error(`Failed to fetch meal analysis (${response.status})`);
          }
        }
        const data = await response.json();
        
        // Transform the data to match PersonalizedNutritionAnalysis expectations
        const transformedData: MealAnalysisData = {
          ...data,
          // Ensure we have the right structure for the advanced component
          analysis: {
            calories: data.calories,
            totalCalories: data.calories,
            macronutrients: data.macronutrients || [],
            micronutrients: data.micronutrients || [],
            phytonutrients: data.phytonutrients || [],
            personalized_insights: data.personalizedHealthInsights || data.personalized_insights,
            insights: data.personalizedHealthInsights || data.insights,
            glycemicImpact: data.glycemicImpact,
            inflammatoryPotential: data.inflammatoryPotential,
            nutrientDensity: data.nutrientDensity,
            suggestions: data.suggestions || data.expertRecommendations || [],
            scientificInsights: data.scientificInsights || [],
            goalAlignment: data.goalAlignment,
            metabolicInsights: data.metabolicInsights,
            nutritionalNarrative: data.nutritionalNarrative,
            timeOfDayOptimization: data.timeOfDayOptimization,
            mealStory: data.mealStory
          }
        };
        
        setAnalysis(transformedData);
      } catch (err: any) {
        console.error('Error fetching meal analysis:', err);
        setError(err.message || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [mealId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading comprehensive analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Analysis Not Found</h2>
          <p className="text-gray-400 mb-6">
            {error || 'This meal analysis could not be found. It may have been deleted or the link is incorrect.'}
          </p>
          <div className="space-y-3">
            <Link 
              href="/upload" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors w-full justify-center"
            >
              Upload New Meal
            </Link>
            <Link 
              href="/meal-history" 
              className="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors w-full justify-center"
            >
              View Meal History
            </Link>
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors w-full justify-center"
            >
              Back to Home
            </Link>
          </div>
          {mealId && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Meal ID:</p>
              <p className="text-xs text-gray-400 font-mono break-all">{mealId}</p>
              <p className="text-xs text-red-400 mt-2">This ID appears to be invalid or incomplete</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Advanced Meal Analysis</h1>
            <p className="text-gray-400">Comprehensive nutritional insights with personalized recommendations</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/meal-history" 
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              View History
            </Link>
            <Link 
              href="/upload" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Analyze Another Meal
            </Link>
          </div>
        </div>

        {/* Advanced Analysis Component */}
        <PersonalizedNutritionAnalysis 
          analysisData={analysis} 
          userGoal={analysis.goal}
        />
      </div>
    </div>
  );
} 