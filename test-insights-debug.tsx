'use client';

import { useState } from 'react';

export default function TestInsightsPage() {
  const [mealId, setMealId] = useState('fad2b1a3-684f-4899-8a89-69669a7851af');
  const [mealData, setMealData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchMealData = async () => {
    if (!mealId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/meals/${mealId}`);
      if (response.ok) {
        const data = await response.json();
        setMealData(data);
        console.log('Test page - Fetched meal data:', data);
      } else {
        console.error('Failed to fetch meal data');
      }
    } catch (error) {
      console.error('Error fetching meal data:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Test Insights Debug Page</h1>
      
      <div className="mb-6">
        <input
          type="text"
          value={mealId}
          onChange={(e) => setMealId(e.target.value)}
          placeholder="Enter meal ID"
          className="w-full p-3 border rounded text-black"
        />
        <button
          onClick={fetchMealData}
          disabled={loading || !mealId}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Meal Data'}
        </button>
      </div>

      {mealData && (
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-bold mb-2 text-blue-400">Insights Status Check:</h3>
            <p><strong>Has personalized_insights:</strong> {!!mealData.personalized_insights ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Has insights:</strong> {!!mealData.insights ? '✅ Yes' : '❌ No'}</p>
            <p><strong>insights_status:</strong> {mealData.insights_status || 'Not set'}</p>
            <p><strong>Insights length:</strong> {mealData.personalized_insights?.length || mealData.insights?.length || 0}</p>
          </div>

          <div className="bg-green-800 p-4 rounded">
            <h3 className="font-bold mb-2 text-green-400">Display Condition Check:</h3>
            <p><strong>Would show insights:</strong> {
              ((mealData?.personalized_insights || mealData?.insights) && mealData?.insights_status !== 'generating') 
                ? '✅ YES' 
                : '❌ NO'
            }</p>
            <p><strong>Reason:</strong> {
              !(mealData?.personalized_insights || mealData?.insights) 
                ? 'No insights data found'
                : mealData?.insights_status === 'generating'
                ? 'Status is still "generating"'
                : 'Should display correctly'
            }</p>
          </div>

          {(mealData?.personalized_insights || mealData?.insights) && (
            <div className="bg-yellow-800 p-4 rounded">
              <h3 className="font-bold mb-2 text-yellow-400">Insights Preview (first 500 chars):</h3>
              <div className="max-h-60 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {(mealData.personalized_insights || mealData.insights)?.substring(0, 500)}...
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 