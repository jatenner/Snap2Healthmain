'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface MealData {
  id?: string;
  mealName?: string;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  imageUrl?: string;
  personalizedHealthInsights?: string;
  insights?: string;
  ingredients?: string[];
  [key: string]: any;
}

export default function DebugAnalysisPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<MealData | null>(null);
  
  const mealId = searchParams.get('id') || 'a5d944c5-276a-4859-9237-92895a9380ae';

  useEffect(() => {
    const fetchAnalysis = async () => {
      console.log('[DebugAnalysisPage] Fetching meal ID:', mealId);
      
      try {
        const response = await fetch(`/api/meals/${mealId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[DebugAnalysisPage] ✅ Successfully loaded meal data:', data);
          setAnalysis(data);
          setLoading(false);
        } else {
          console.log('[DebugAnalysisPage] ❌ Failed to load meal:', response.status);
          setError(`Failed to load meal: ${response.status}`);
          setLoading(false);
        }
      } catch (err) {
        console.log('[DebugAnalysisPage] ❌ Error:', err);
        setError('Network error occurred');
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
          <p className="text-white text-lg">Loading meal analysis...</p>
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
          <h2 className="text-white text-xl font-semibold mb-2">Debug: Analysis Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link 
            href="/upload" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Upload New Meal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔧 Debug: Meal Analysis</h1>
          <p className="text-gray-400">Testing meal data loading - ID: {mealId}</p>
        </div>

        {/* Success Message */}
        <div className="bg-green-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-2">✅ SUCCESS: Meal Data Loaded!</h2>
          <p className="text-green-200">
            The meal analysis system is working correctly. Data was successfully fetched from the API.
          </p>
        </div>

        {/* Meal Data Display */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Meal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Basic Nutrition</h3>
              <div className="text-gray-300 space-y-2">
                <p><strong>Name:</strong> {analysis.mealName || analysis.name || 'Unknown'}</p>
                <p><strong>Calories:</strong> {analysis.calories || 0}</p>
                <p><strong>Protein:</strong> {analysis.protein || 0}g</p>
                <p><strong>Carbohydrates:</strong> {analysis.carbs || 0}g</p>
                <p><strong>Fat:</strong> {analysis.fat || 0}g</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Meal Image</h3>
              {analysis.imageUrl ? (
                <img 
                  src={analysis.imageUrl} 
                  alt="Meal" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">No image available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">AI Insights</h3>
          <p className="text-gray-300">
            {analysis.personalizedHealthInsights || analysis.insights || 'No insights available'}
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link 
            href="/upload" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Upload Another Meal
          </Link>
          <Link 
            href={`/analysis/${mealId}`}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            View Full Analysis
          </Link>
        </div>
      </div>
    </div>
  );
} 