'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Eye, Database } from 'lucide-react';

interface DebugMeal {
  id: string;
  created_at: string;
  meal_name?: string;
  calories?: number;
  status: 'working' | 'error';
}

export default function DebugMealsPage() {
  const [meals, setMeals] = useState<DebugMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const knownMealIds = [
    'c5d157c7-a6b5-4782-8e4c-bdc7793fa2c6',
    '991a54d0-67dc-424e-8e33-3e46c8a1fe9c',
    '475e21a6-f8fb-4e0a-9fd1-f777b9cf54dc',
    '6161aad0-5b64-4927-8eb0-50dda7744d51'
  ];

  useEffect(() => {
    testMealIds();
  }, []);

  const testMealIds = async () => {
    const results: Record<string, string> = {};
    const workingMeals: DebugMeal[] = [];

    for (const mealId of knownMealIds) {
      try {
        const response = await fetch(`/api/meals/${mealId}`);
        if (response.ok) {
          const data = await response.json();
          results[mealId] = 'working';
          workingMeals.push({
            id: mealId,
            created_at: data.created_at || new Date().toISOString(),
            meal_name: data.mealName || data.meal_name || 'Unnamed Meal',
            calories: data.calories || 0,
            status: 'working'
          });
        } else {
          results[mealId] = `error-${response.status}`;
        }
      } catch (error) {
        results[mealId] = 'network-error';
      }
    }

    setTestResults(results);
    setMeals(workingMeals);
    setLoading(false);
  };

  const testSingleMeal = async (mealId: string) => {
    try {
      const response = await fetch(`/api/meals/${mealId}`);
      const status = response.ok ? 'working' : `error-${response.status}`;
      setTestResults(prev => ({ ...prev, [mealId]: status }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [mealId]: 'network-error' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Testing Meal Analysis...</h1>
          <div className="flex items-center text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            Checking meal IDs...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meal Analysis Debug</h1>
            <p className="text-gray-400">Test working meal analysis links</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              href="/upload"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Upload New Meal
            </Link>
          </div>
        </div>

        {/* Working Meals */}
        {meals.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-green-400" />
              Working Meal Analyses ({meals.length})
            </h2>
            <div className="space-y-3">
              {meals.map((meal) => (
                <div key={meal.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{meal.meal_name}</h3>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(meal.created_at).toLocaleString()}
                    </div>
                    <p className="text-gray-500 text-xs mt-1 font-mono">{meal.id}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-orange-400 text-sm">{meal.calories} cal</span>
                    <Link
                      href={`/analysis/${meal.id}`}
                      className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Analysis
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Meal ID Test Results</h2>
          <div className="space-y-2">
            {Object.entries(testResults).map(([mealId, status]) => (
              <div key={mealId} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <span className="text-gray-300 font-mono text-sm">{mealId}</span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      status === 'working'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {status}
                  </span>
                  <button
                    onClick={() => testSingleMeal(mealId)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                  >
                    Retest
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-3">How to Test</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• Click "View Analysis" on any working meal above</li>
            <li>• Upload a new meal to create a fresh analysis</li>
            <li>• Check meal history for previously analyzed meals</li>
            <li>• Invalid or partial meal IDs will show the improved error page</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 