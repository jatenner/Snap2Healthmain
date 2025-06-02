'use client';

// Force fresh build - Updated: 2025-06-02T21:50:00Z

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MealUploader from '../../src/components/MealUploader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Script from 'next/script';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import DebugInfo from './debug-info';

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  // Check for last analysis ID on mount
  useEffect(() => {
    try {
      const lastId = localStorage.getItem('lastAnalysisId') || localStorage.getItem('last_meal_id');
      if (lastId) {
        setAnalysisId(lastId);
      }
    } catch (e) {
      console.error('Error checking localStorage:', e);
    }
  }, []);

  // Listen for analysis completion events
  useEffect(() => {
    const handleAnalysisComplete = (event: CustomEvent) => {
      const newMealId = event.detail?.mealId;
      if (newMealId) {
        console.log('[upload] Analysis complete event received with mealId:', newMealId);
        setAnalysisId(newMealId);
        setShowSuccess(true);
      }
    };

    window.addEventListener('analysisComplete', handleAnalysisComplete as EventListener);
    
    return () => {
      window.removeEventListener('analysisComplete', handleAnalysisComplete as EventListener);
    };
  }, []);

  const handleUploadStart = () => {
    setIsLoading(true);
    setAnalysisId(null);
    setError(null);
    setShowSuccess(false);
  };

  const handleError = (err: Error) => {
    console.error('Upload error:', err);
    setError(err.message);
    setIsLoading(false);
  };

  const handleAnalysisComplete = (result: any) => {
    setIsLoading(false);
    
    if (result && result.mealId) {
      setAnalysisId(result.mealId);
      setShowSuccess(true);
    }
  };

  const goToAnalysis = () => {
    if (analysisId) {
      router.push(`/analysis/${analysisId}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Analyze Your Meal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show success notification */}
          {showSuccess && analysisId && (
            <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center text-green-700 mb-2">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Analysis complete!</span>
              </div>
              <Button 
                onClick={goToAnalysis}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                View Analysis
              </Button>
            </div>
          )}

          {/* Show error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-md border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Main uploader component */}
          <MealUploader />

          {/* Optional loading state */}
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Processing your meal...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Helper scripts */}
      <Script id="redirect-helper" strategy="afterInteractive">
        {`
          window.redirectToAnalysis = function(mealId) {
            console.log('Redirecting to analysis for meal:', mealId);
            window.location.href = '/analysis/' + mealId;
          };
        `}
      </Script>

      <DebugInfo />
    </div>
  );
} 