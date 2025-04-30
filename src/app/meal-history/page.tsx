'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchMealHistory, MealHistoryEntry, deleteMealFromHistory } from '@/lib/meal-data';
import { formatMealDate, formatMealTime } from '@/utils/formatMealTime';

export default function MealHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealHistoryEntry[]>([]);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);

  // Fetch meal history on component mount
  useEffect(() => {
    const getMealHistory = async () => {
      try {
        setLoading(true);
        const history = await fetchMealHistory();
        setMeals(history);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching meal history:', err);
        setError('Failed to load meal history. Please try again later.');
        setLoading(false);
      }
    };

    getMealHistory();
  }, []);

  // Group meals by date
  const groupedMeals = meals.reduce<Record<string, MealHistoryEntry[]>>((groups, meal) => {
    const date = formatMealDate(meal.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {});

  // Handle deleting a meal
  const handleDelete = async (mealId: string) => {
    if (window.confirm('Are you sure you want to delete this meal analysis?')) {
      try {
        setDeletingMealId(mealId);
        const result = await deleteMealFromHistory(mealId);
        
        if (result.success) {
          // Remove the meal from the state
          setMeals(meals.filter(meal => meal.id !== mealId));
        } else {
          alert('Failed to delete meal. Please try again.');
        }
      } catch (err) {
        console.error('Error deleting meal:', err);
        alert('Error deleting meal. Please try again.');
      } finally {
        setDeletingMealId(null);
      }
    }
  };

  // View meal details
  const viewMealDetails = (meal: MealHistoryEntry) => {
    // Convert the meal entry to URL parameters
    const params = new URLSearchParams();
    params.append('imageUrl', meal.imageUrl);
    params.append('mealName', meal.mealName);
    if (meal.goal) params.append('goal', meal.goal);
    
    // Navigate to the analysis page with parameters
    router.push(`/meal-analysis?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading meal history...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{error}</h2>
            <Link 
              href="/"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <header className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-green-600">Meal History</h1>
            <Link 
              href="/"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Analyze New Meal
            </Link>
          </div>
          <p className="text-gray-600">View and manage your previous meal analyses</p>
        </header>
        
        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          {Object.keys(groupedMeals).length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No meal history found</h2>
              <p className="text-gray-500 mb-6">Start by uploading and analyzing your first meal</p>
              <Link 
                href="/"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Analyze Your First Meal
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMeals).map(([date, dateMeals]) => (
                <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-100 px-6 py-3 border-b">
                    <h3 className="text-lg font-medium text-gray-800">{date}</h3>
                  </div>
                  <div className="divide-y">
                    {dateMeals.map(meal => (
                      <div key={meal.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Meal image */}
                          <div className="sm:w-24 sm:h-24 relative rounded-md overflow-hidden">
                            <Image 
                              src={meal.imageUrl} 
                              alt={meal.mealName || "Food"} 
                              width={96}
                              height={96}
                              style={{ objectFit: 'cover' }}
                              className="w-full h-full"
                            />
                          </div>
                          
                          {/* Meal details */}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="text-lg font-medium text-gray-800">{meal.mealName || "Meal Analysis"}</h4>
                              <span className="text-sm text-gray-500">{formatMealTime(meal.createdAt)}</span>
                            </div>
                            {meal.goal && (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium mt-1">
                                {meal.goal}
                              </span>
                            )}
                            <div className="mt-2 flex space-x-3">
                              <button
                                onClick={() => viewMealDetails(meal)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleDelete(String(meal.id))}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                disabled={deletingMealId === meal.id}
                              >
                                {deletingMealId === meal.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 