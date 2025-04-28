'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { getLocalMealById, shouldUseLocalStorage, LocalMeal } from '../../../utils/localStorageMeals';

interface MealData {
  id: string;
  created_at: string;
  user_id?: string;
  image_url?: string;
  caption?: string;
  analysis?: any;
  ingredients?: string[];
  goal?: string;
}

export default function MealDetailPage() {
  const params = useParams();
  const mealId = params.id as string;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealData, setMealData] = useState<MealData | null>(null);
  
  useEffect(() => {
    async function fetchMeal() {
      if (!mealId) {
        setError('No meal ID provided');
        setLoading(false);
        return;
      }

      try {
        // Check if we should use localStorage in auth bypass mode
        if (shouldUseLocalStorage()) {
          const localMeal = getLocalMealById(mealId);
          if (localMeal) {
            // Parse the analysis JSON if it's stored as a string
            if (typeof localMeal.analysis === 'string') {
              try {
                localMeal.analysis = JSON.parse(localMeal.analysis);
              } catch (e) {
                console.error('Error parsing meal analysis JSON:', e);
              }
            }
            setMealData(localMeal as MealData);
            setLoading(false);
            return;
          } else {
            setError('Meal not found in history');
            setLoading(false);
            return;
          }
        }

        // Normal API fetch for authenticated mode
        const response = await fetch(`/api/meals/${mealId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch meal details');
        }
        
        const data = await response.json();
        setMealData(data);
      } catch (error: any) {
        console.error('Error fetching meal:', error);
        setError(error.message || 'Failed to load meal details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMeal();
  }, [mealId]);

  const handleMealDeleted = () => {
    router.push('/meal-history');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !mealData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-700">{error || 'Failed to load meal details'}</p>
        </div>
      </div>
    );
  }

  const analysisData = mealData.analysis || {};
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{mealData.caption || 'Meal Details'}</h1>
        <div className="flex space-x-2">
          <Link 
            href={`/meal/edit/${mealData.id}`}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Meal Image */}
        <div className="rounded-lg overflow-hidden bg-gray-100 h-64 md:h-80 relative">
          {mealData.image_url ? (
            <Image
              src={mealData.image_url}
              alt={mealData.caption || 'Meal photo'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Meal Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <span className="text-sm text-gray-500">
              {new Date(mealData.created_at).toLocaleString()}
            </span>
          </div>
          
          {mealData.goal && (
            <div className="mb-4">
              <span className="font-medium">Goal:</span> {mealData.goal}
            </div>
          )}
          
          <div className="mt-6 flex space-x-4">
            <Link 
              href={`/meal-analysis?id=${mealData.id}`} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex-1 text-center"
            >
              View Analysis
            </Link>
            <Link 
              href="/meal-history" 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back to History
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Analysis Results */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Nutritional Analysis</h2>
          
          {typeof analysisData === 'string' ? (
            <pre className="whitespace-pre-wrap">{analysisData}</pre>
          ) : (
            <div className="space-y-4">
              {/* Display analysis based on the data structure */}
              {analysisData.nutritionalBreakdown && (
                <div>
                  <h3 className="font-medium mb-2">Nutritional Breakdown</h3>
                  <p>{analysisData.nutritionalBreakdown}</p>
                </div>
              )}
              
              {analysisData.healthRating && (
                <div>
                  <h3 className="font-medium mb-2">Health Rating</h3>
                  <p>{analysisData.healthRating}</p>
                </div>
              )}
              
              {analysisData.recommendations && (
                <div>
                  <h3 className="font-medium mb-2">Recommendations</h3>
                  <p>{analysisData.recommendations}</p>
                </div>
              )}
              
              {/* Fallback if the structure is different */}
              {!analysisData.nutritionalBreakdown && !analysisData.healthRating && (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(analysisData, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Ingredients List */}
        {mealData.ingredients && mealData.ingredients.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
            <ul className="list-disc pl-5 space-y-1">
              {mealData.ingredients.map((ingredient: string, index: number) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 