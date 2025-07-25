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

// Function to attempt to fix malformed meal IDs
function attemptToFixMealId(mealId: string): string[] {
  const candidates = [mealId];
  
  // If the meal ID has double dashes, it might be corrupted
  if (mealId.includes('--')) {
    console.log('[AnalysisPage] Detected malformed meal ID with double dashes:', mealId);
    
    // Try to reconstruct the UUID by adding missing parts
    // Pattern: 399e90b2--8e56-636b4f84aa0d should be 399e90b2-aaf9-4755-8e56-636b4f84aa0d
    const parts = mealId.split('--');
    if (parts.length === 2) {
      // Try some common UUID patterns that might have been lost
      const commonMissingParts = [
        'aaf9-4755',
        'bbf9-4755', 
        'ccf9-4755',
        'ddf9-4755',
        'eef9-4755',
        'fff9-4755'
      ];
      
      for (const missingPart of commonMissingParts) {
        candidates.push(`${parts[0]}-${missingPart}-${parts[1]}`);
      }
    }
  }
  
  // If the meal ID is too short, it might be truncated
  if (mealId.length < 36) {
    console.log('[AnalysisPage] Detected potentially truncated meal ID:', mealId);
  }
  
  return candidates;
}

export default function AnalysisPage() {
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<MealAnalysisData | null>(null);
  const [attemptedIds, setAttemptedIds] = useState<string[]>([]);
  
  const rawMealId = params?.mealId as string;

  useEffect(() => {
    if (!rawMealId) {
      setError('Meal ID not found');
      setLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      console.log('[AnalysisPage] Starting fetch for meal ID:', rawMealId);
      
      // First, try the original meal ID as-is
      try {
        console.log('[AnalysisPage] Trying original meal ID:', rawMealId);
        const response = await fetch(`/api/meals/${rawMealId}`);
        
        if (response.ok) {
          console.log('[AnalysisPage] Successfully found meal with original ID:', rawMealId);
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
          setLoading(false);
          return; // Success with original ID
        } else {
          console.log('[AnalysisPage] Original ID failed with status:', response.status);
        }
      } catch (err) {
        console.log('[AnalysisPage] Error with original ID:', err);
      }
      
      // Only try recovery if the original ID failed AND it looks obviously malformed
      // Valid UUIDs are 36 characters with 4 dashes in specific positions
      const isValidUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawMealId);
      
      if (false) { // Disabled recovery system
        console.log('[AnalysisPage] Original ID failed and contains double dashes, attempting recovery...');
        
        // Get candidate meal IDs to try
        const candidateIds = attemptToFixMealId(rawMealId);
        setAttemptedIds(candidateIds);
        
        console.log('[AnalysisPage] Will try these recovery candidates:', candidateIds.slice(1)); // Skip the original

        // Try each recovery candidate (skip the first one as we already tried it)
        for (const mealId of candidateIds.slice(1)) {
          try {
            console.log('[AnalysisPage] Trying recovery candidate:', mealId);
            const response = await fetch(`/api/meals/${mealId}`);
            
            if (response.ok) {
              console.log('[AnalysisPage] Successfully recovered meal with ID:', mealId);
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
              setLoading(false);
              return; // Success with recovery
            } else {
              console.log('[AnalysisPage] Recovery candidate failed:', mealId, 'Status:', response.status);
            }
          } catch (err) {
            console.log('[AnalysisPage] Error with recovery candidate:', mealId, err);
          }
        }
      }
      
      // If we get here, the original ID failed and recovery didn't work
      // Create an emergency analysis to ensure the page always works
      console.log('[AnalysisPage] All lookup methods failed, creating emergency analysis...');
      
      const emergencyAnalysis: MealAnalysisData = {
        id: 'emergency-analysis',
        mealName: 'Sample Balanced Meal',
        description: 'A nutritionally balanced meal with lean protein, vegetables, and whole grains.',
        imageUrl: '/placeholder-meal.jpg',
        goal: 'General Wellness',
        
        // Nutrition data
        calories: 500,
        protein: 25,
        fat: 20,
        carbs: 45,
        fiber: 8,
        
        macronutrients: [
          { name: 'Protein', amount: 25, unit: 'g', percentDailyValue: null },
          { name: 'Total Carbohydrates', amount: 45, unit: 'g', percentDailyValue: null },
          { name: 'Dietary Fiber', amount: 8, unit: 'g', percentDailyValue: null },
          { name: 'Total Fat', amount: 20, unit: 'g', percentDailyValue: null }
        ],
        
        micronutrients: [
          { name: 'Vitamin C', amount: 25, unit: 'mg', percentDailyValue: null },
          { name: 'Iron', amount: 4, unit: 'mg', percentDailyValue: null },
          { name: 'Calcium', amount: 200, unit: 'mg', percentDailyValue: null }
        ],
        
        ingredients: ['grilled chicken', 'brown rice', 'steamed broccoli', 'olive oil'],
        benefits: [
          'High-quality protein supports muscle maintenance',
          'Complex carbohydrates provide sustained energy',
          'Rich in vitamins and minerals for overall health'
        ],
        concerns: [
          'Note: This is sample data shown when original meal analysis is unavailable'
        ],
        suggestions: [
          'Try uploading a new meal for personalized analysis',
          'Check your meal history for previous analyses',
          'Ensure good lighting when taking meal photos'
        ],
        
        // Advanced analysis fields
        personalizedHealthInsights: 'This balanced meal provides excellent nutrition with lean protein, complex carbohydrates, and essential micronutrients. The combination supports sustained energy and overall health.',
        metabolicInsights: 'The protein content aids in muscle protein synthesis, while the complex carbohydrates provide steady glucose release for sustained energy.',
        nutritionalNarrative: 'This meal exemplifies balanced nutrition with its combination of lean protein, fiber-rich carbohydrates, and nutrient-dense vegetables.',
        timeOfDayOptimization: 'This meal is ideal for lunch or dinner, providing sustained energy and satiety for several hours.',
        mealStory: 'As you consume this meal, the protein will help maintain muscle mass, the carbohydrates will fuel your activities, and the vegetables will provide essential vitamins and antioxidants.',
        expertRecommendations: [
          'Consider adding a small portion of healthy fats like avocado',
          'Include a variety of colorful vegetables for maximum nutrient diversity',
          'Stay hydrated throughout the day'
        ],
        
        // Analysis object for compatibility
        analysis: {
          calories: 500,
          totalCalories: 500,
          macronutrients: [
            { name: 'Protein', amount: 25, unit: 'g', percentDailyValue: null },
            { name: 'Total Carbohydrates', amount: 45, unit: 'g', percentDailyValue: null },
            { name: 'Dietary Fiber', amount: 8, unit: 'g', percentDailyValue: null },
            { name: 'Total Fat', amount: 20, unit: 'g', percentDailyValue: null }
          ],
          micronutrients: [
            { name: 'Vitamin C', amount: 25, unit: 'mg', percentDailyValue: null },
            { name: 'Iron', amount: 4, unit: 'mg', percentDailyValue: null },
            { name: 'Calcium', amount: 200, unit: 'mg', percentDailyValue: null }
          ],
          personalizedHealthInsights: 'This balanced meal provides excellent nutrition with lean protein, complex carbohydrates, and essential micronutrients.',
          metabolicInsights: 'The protein content aids in muscle protein synthesis, while complex carbohydrates provide steady energy.',
          nutritionalNarrative: 'This meal exemplifies balanced nutrition with its combination of lean protein and nutrient-dense vegetables.',
          timeOfDayOptimization: 'Ideal for lunch or dinner, providing sustained energy and satiety.',
          mealStory: 'This meal supports muscle maintenance, sustained energy, and provides essential vitamins and antioxidants.',
          expertRecommendations: ['Consider adding healthy fats', 'Include variety of vegetables', 'Stay hydrated'],
          suggestions: ['Try uploading a new meal for personalized analysis'],
          benefits: ['High-quality protein', 'Sustained energy', 'Rich in nutrients'],
          concerns: ['Sample data - upload your meal for personalized insights'],
          healthRating: 8
        }
      };
      
      setAnalysis(emergencyAnalysis);
      setError(`Note: Original meal (${rawMealId}) not found. Showing sample analysis instead. Upload a new meal for personalized insights.`);
      setLoading(false);
    };

    fetchAnalysis();
  }, [rawMealId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading comprehensive analysis...</p>
          {attemptedIds.length > 1 && (
            <p className="text-gray-400 text-sm mt-2">Trying to recover meal data...</p>
          )}
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
          {rawMealId && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Original Meal ID:</p>
              <p className="text-xs text-gray-400 font-mono break-all">{rawMealId}</p>
              {attemptedIds.length > 1 && (
                <>
                  <p className="text-xs text-gray-500 mb-2 mt-4">Attempted IDs:</p>
                  {attemptedIds.map((id, index) => (
                    <p key={index} className="text-xs text-gray-400 font-mono break-all">
                      {index + 1}. {id}
                    </p>
                  ))}
                </>
              )}
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