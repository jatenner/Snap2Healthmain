'use client';

import { useState } from 'react';
import MealUploader from '../../src/components/MealUploader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SimplePage() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = (result: any) => {
    console.log('Analysis complete:', result);
    setAnalysisResult(result);
    setError(null);
  };

  const handleError = (err: Error) => {
    console.error('Analysis error:', err);
    setError(err.message);
    setAnalysisResult(null);
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Simple Meal Analysis</h1>
      
      {!analysisResult ? (
        <div className="container mx-auto p-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Simplified Meal Uploader</CardTitle>
            </CardHeader>
            <CardContent>
              <MealUploader />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {analysisResult.data?.imageUrl && (
                    <img 
                      src={analysisResult.data.imageUrl} 
                      alt="Analyzed meal" 
                      className="w-full max-h-80 object-cover rounded-lg"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {analysisResult.data?.meal_name || 'Analyzed Meal'}
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Calories</p>
                    <p className="text-2xl font-bold">{analysisResult.data?.calories || 0} kcal</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Protein</p>
                      <p className="font-semibold">{analysisResult.data?.protein || 0}g</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Carbs</p>
                      <p className="font-semibold">{analysisResult.data?.carbs || 0}g</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fat</p>
                      <p className="font-semibold">{analysisResult.data?.fat || 0}g</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Analyze Another Meal
                </button>
              </div>
            </CardContent>
          </Card>
          
          {/* Full debug output */}
          <details className="border rounded-lg p-4 mt-8">
            <summary className="text-sm text-gray-500 cursor-pointer">Debug Information</summary>
            <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
          <h3 className="font-semibold">Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 