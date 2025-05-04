'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getLocalMealById, shouldUseLocalStorage, LocalMeal } from '@/utils/localStorageMeals';
import { SimpleFoodAnalysis } from '@/components/SimpleFoodAnalysis';

interface MealData {
  id: string;
  user_id?: string;
  caption?: string;
  goal?: string;
  image_url?: string;
  imageUrl?: string; // Support both formats
  created_at: string;
  analysis: any;
  ingredients?: string[];
}

export default function MealPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/meals/${params.id}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Meal not found');
          }
          throw new Error('Failed to fetch meal data');
        }
        
        const data = await res.json();
        setMealData(data);
        
        // Set analysis data from either format
        if (data.analysis) {
          if (typeof data.analysis === 'string') {
            try {
              setAnalysisData(JSON.parse(data.analysis));
            } catch (e) {
              setAnalysisData(data.analysis);
            }
          } else {
            setAnalysisData(data.analysis);
          }
        }
      } catch (err) {
        console.error('Error fetching meal:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchMeal();
    }
  }, [params.id]);

  const handleMealDeleted = () => {
    router.push('/meal-history');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
        <p className="mt-4 text-cyan-accent">Loading meal analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500/20 border border-red-500/40 text-white px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => router.push('/meal-history')}
          className="text-cyan-accent hover:underline"
        >
          Back to Meal History
        </button>
      </div>
    );
  }

  if (!mealData) {
    return null;
  }

  // Get the image URL from either property
  const imageUrl = mealData.imageUrl || mealData.image_url;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={() => router.push('/meal-history')}
          className="text-cyan-accent hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Meal History
        </button>
      </div>
      
      <SimpleFoodAnalysis 
        imageUrl={imageUrl} 
        goal={mealData.goal || "General Wellness"}
      />
    </div>
  );
} 