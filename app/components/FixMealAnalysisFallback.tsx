'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

interface FixMealAnalysisFallbackProps {
  mealId?: string;
}

export default function FixMealAnalysisFallback({ mealId }: FixMealAnalysisFallbackProps) {
  const [currentMealId, setCurrentMealId] = useState<string | null>(mealId || null);
  const [isFixed, setIsFixed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Try to get the meal ID from URL or localStorage
    if (!currentMealId) {
      // Try to get from URL search params
      const url = new URL(window.location.href);
      const idFromUrl = url.searchParams.get('id');
      
      if (idFromUrl) {
        setCurrentMealId(idFromUrl);
      } else {
        // Fall back to localStorage
        const storedId = localStorage.getItem('current_meal_id');
        if (storedId) {
          setCurrentMealId(storedId);
        }
      }
    }
  }, [currentMealId]);

  const handleFixMealAnalysis = async () => {
    if (!currentMealId) return;
    
    setIsLoading(true);
    
    try {
      // Fetch and execute the fix script
      const response = await fetch('/fix-meal-analysis.js');
      const script = await response.text();
      
      // Set the meal ID for the script to use
      window.currentMealId = currentMealId;
      
      // Execute the script
      eval(script);
      
      setIsFixed(true);
    } catch (error) {
      console.error('Error fixing meal analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl">
        <div className="flex items-center gap-4 mb-4 text-blue-400">
          <AlertCircle size={24} />
          <h2 className="text-xl font-semibold">Meal Analysis Fallback</h2>
        </div>
        
        <p className="text-gray-300 mb-6">
          We detected an issue loading your meal analysis. This fallback
          solution can help fix the problem.
        </p>
        
        {currentMealId && (
          <div className="bg-gray-700/50 px-4 py-3 rounded mb-6">
            <p className="text-sm text-gray-400">Meal ID:</p>
            <p className="text-gray-300 font-mono text-sm">{currentMealId}</p>
          </div>
        )}
        
        {isFixed ? (
          <div className="bg-green-900/30 border border-green-800 text-green-300 p-4 rounded-md mb-6">
            <p className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Meal analysis data fixed successfully!
            </p>
          </div>
        ) : (
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            onClick={handleFixMealAnalysis}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fixing...
              </span>
            ) : (
              'Fix Meal Analysis'
            )}
          </button>
        )}
        
        <div className="flex justify-between mt-6">
          <Link 
            href="/upload" 
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Upload
          </Link>
          
          <Link 
            href={isFixed ? `/meal-analysis?id=${currentMealId}` : '/'}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {isFixed ? 'View Analysis' : (
              <>
                <Home size={16} />
                Home
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
} 