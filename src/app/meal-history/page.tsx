'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { formatMealDate, formatMealTime } from '../../utils/formatMealTime';
import { getLocalMeals, shouldUseLocalStorage } from '../../utils/localStorageMeals';
import LoadingSpinner from '../../components/LoadingSpinner';

// Define the meal type
interface Meal {
  id: string;
  user_id: string;
  goal: string;
  image_url: string;
  caption: string;
  created_at: string;
  analysis: string;
}

export default function MealHistoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [localMealsMode, setLocalMealsMode] = useState(false);
  const router = useRouter();

  // Add delete handler and loading state for delete operations
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    async function fetchMeals() {
      try {
        setIsLoading(true);
        
        // Check if we should use localStorage (auth bypass mode)
        if (shouldUseLocalStorage()) {
          // Get meals from localStorage
          const localMeals = getLocalMeals();
          setMeals(localMeals);
          setLocalMealsMode(true);
          setIsLoading(false);
          return;
        }
        
        // Normal mode - fetch from API
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/meals');
        
        if (!response.ok) {
          throw new Error('Failed to fetch meal history');
        }
        
        const data = await response.json();
        setMeals(data.meals || []);
      } catch (error: any) {
        console.error('Error fetching meals:', error);
        setError(error.message || 'Failed to load meal history');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMeals();
  }, [user]);

  // Group meals by date
  const groupedMeals = meals.reduce((groups, meal) => {
    const date = formatMealDate(meal.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {} as Record<string, Meal[]>);

  // Sort dates in reverse chronological order
  const sortedDates = Object.keys(groupedMeals).sort((a, b) => {
    // Put "Today" and "Yesterday" at the top
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    
    // Sort other dates in reverse chronological order
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  // Function to handle meal deletion
  const handleDeleteMeal = async (mealId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this meal record?')) {
      return;
    }
    
    try {
      setIsDeleting(mealId);
      
      const response = await fetch(`/api/meal/delete?id=${mealId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete meal');
      }
      
      // Remove the meal from the state upon successful deletion
      setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
    } catch (err: any) {
      console.error('Error deleting meal:', err);
      setDeleteError(err.message);
      
      // Show error message to user
      alert(`Failed to delete meal: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleMealClick = (mealId: string) => {
    router.push(`/meal-analysis?id=${mealId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meal History</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-gray-500">Loading meal history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meal History</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
          <p>{error}</p>
          <Link href="/upload" className="mt-4 inline-block text-indigo-600 hover:underline">
            Add a new meal
          </Link>
        </div>
      </div>
    );
  }

  if (!user && !shouldUseLocalStorage()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meal History</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p className="text-yellow-700">Please log in to view your meal history.</p>
        </div>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meal History</h1>
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-center">
          <p className="text-gray-700 mb-4">You haven't analyzed any meals yet.</p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Analyze Your First Meal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Meal History</h1>
      
      {localMealsMode && (
        <div className="bg-blue-100 p-4 mb-6 rounded-md">
          <p className="text-blue-800">
            <strong>Development Mode:</strong> Meals are stored temporarily in your browser and will be lost if you clear your browser data.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center my-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center my-12">
          <h2 className="text-xl font-semibold mb-4">No Meals Found</h2>
          <p className="mb-8">You haven't recorded any meals yet. Start by uploading a meal photo!</p>
          <Link href="/upload">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Your First Meal</button>
          </Link>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          {sortedDates.map(date => (
            <div key={date} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{date}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedMeals[date].map(meal => {
                  // Parse analysis for display
                  let parsedAnalysis;
                  try {
                    parsedAnalysis = JSON.parse(meal.analysis);
                  } catch (e) {
                    parsedAnalysis = { 
                      caption: meal.caption,
                      analysis: { calories: 0 } 
                    };
                  }
                  
                  const analysis = parsedAnalysis.analysis || {};
                  
                  return (
                    <div 
                      key={meal.id} 
                      className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
                    >
                      <Link href={`/meal/${meal.id}`}>
                        <div className="aspect-square relative">
                          <Image
                            src={meal.image_url || '/placeholder-meal.jpg'}
                            alt={meal.caption || 'Meal photo'}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-white font-medium truncate">{meal.caption || 'Meal photo'}</p>
                            <p className="text-white/80 text-sm">{formatMealTime(meal.created_at)}</p>
                          </div>
                          
                          {/* Delete button */}
                          <button
                            onClick={(e) => handleDeleteMeal(meal.id, e)}
                            disabled={!!isDeleting}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="Delete meal"
                          >
                            {isDeleting === meal.id ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/upload')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Analyze New Meal
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 