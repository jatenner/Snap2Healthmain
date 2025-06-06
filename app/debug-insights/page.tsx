'use client';

import { useState, useEffect } from 'react';

export default function DebugInsights() {
  const [mealId, setMealId] = useState('991a54d0-67dc-424e-8e33-3e46c8a1fe9c');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/meals/${mealId}`);
      const result = await response.json();
      setData(result);
      console.log('Debug: Meal data:', result);
    } catch (error) {
      console.error('Error fetching meal data:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Insights Data</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Meal ID:
        </label>
        <input
          type="text"
          value={mealId}
          onChange={(e) => setMealId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-md"
          placeholder="Enter meal ID"
        />
        <button
          onClick={fetchData}
          disabled={loading}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>

      {data && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Raw API Response:</h2>
          <pre className="text-sm overflow-auto bg-white p-3 rounded border">
            {JSON.stringify(data, null, 2)}
          </pre>
          
          <div className="mt-4">
            <h3 className="font-semibold">Insights Status:</h3>
            <p>personalized_insights: {data.personalized_insights ? `${data.personalized_insights.length} chars` : 'null'}</p>
            <p>insights: {data.insights ? `${data.insights.length} chars` : 'null'}</p>
            <p>insights_status: {data.insights_status || 'undefined'}</p>
          </div>
        </div>
      )}
    </div>
  );
} 