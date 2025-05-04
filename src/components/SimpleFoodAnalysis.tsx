'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';

interface SimpleFoodAnalysisProps {
  imageUrl?: string;
  goal?: string;
}

export function SimpleFoodAnalysis({ imageUrl, goal = 'General Wellness' }: SimpleFoodAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<string>('');
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Get user profile data
  useEffect(() => {
    if (user?.user_metadata) {
      // Create a more complete profile with fallbacks for missing values
      const profile = {
        gender: user.user_metadata.gender || 'neutral',
        age: user.user_metadata.age || 35,
        weight: user.user_metadata.weight || 160,
        height: user.user_metadata.height || 67,
        activityLevel: user.user_metadata.activityLevel || 'moderate',
        defaultGoal: user.user_metadata.defaultGoal || goal || 'General Wellness',
      };
      
      console.log('Setting user profile with metadata:', {
        hasGender: !!profile.gender,
        hasAge: !!profile.age,
        hasWeight: !!profile.weight,
        hasHeight: !!profile.height
      });
      
      setUserProfile(profile);
    } else {
      console.log('No user metadata found, using default profile');
      // Set default profile if metadata is missing
      setUserProfile({
        gender: 'neutral',
        age: 35,
        weight: 160,
        height: 67,
        activityLevel: 'moderate',
        defaultGoal: goal || 'General Wellness'
      });
    }
  }, [user, goal]);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch('/api/version');
        const data = await res.json();
        setVersion(data.version || 'unknown');
      } catch (err) {
        console.error('Failed to fetch version:', err);
      }
    };
    
    fetchVersion();
  }, []);

  useEffect(() => {
    if (imageUrl) {
      analyzeImage(imageUrl);
    }
  }, [imageUrl, userProfile, goal]);

  const analyzeImage = async (url: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure we have user profile data
      const profileToUse = userProfile || {
        gender: 'neutral',
        age: 35,
        weight: 160,
        height: 67,
        activityLevel: 'moderate',
        defaultGoal: goal || 'General Wellness'
      };
      
      console.log('Using user profile for analysis:', {
        hasGender: !!profileToUse.gender,
        hasAge: !!profileToUse.age,
        hasWeight: !!profileToUse.weight,
        hasHeight: !!profileToUse.height
      });
      
      // Add a small delay to ensure API is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ 
          imageUrl: url,
          goal: goal || profileToUse.defaultGoal || 'General Wellness',
          userProfile: profileToUse,
          timestamp: Date.now() // Add timestamp for cache busting
        }),
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data || !data.mealAnalysis) {
        throw new Error('Invalid response from analysis API');
      }
      
      setAnalysis(data.mealAnalysis || data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      
      // Implement retry with exponential backoff
      if (retryCount < 2) {
        console.log(`Retrying analysis (${retryCount + 1}/2)...`);
        setRetryCount(retryCount + 1);
        setTimeout(() => {
          analyzeImage(url);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      setError(err.message || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  // Function to retry analysis
  const handleRetry = () => {
    if (imageUrl) {
      setRetryCount(0);
      analyzeImage(imageUrl);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-center">
        <div className="space-y-4">
          <div className="h-6 bg-blue-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-blue-100 rounded w-1/2 mx-auto"></div>
          <div className="h-48 bg-blue-50 rounded"></div>
        </div>
        <p className="mt-4">Analyzing your meal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">Error: {error}</p>
          <p className="mt-2 text-red-600">Please try again or contact support.</p>
          <button 
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Retry Analysis
          </button>
          <div className="mt-3 text-xs text-gray-500">Version: {version}</div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">No image selected for analysis.</p>
          <div className="mt-3 text-xs text-gray-500">Version: {version}</div>
        </div>
      </div>
    );
  }

  // Handle undefined values in analysis to prevent UI errors
  const safeAnalysis = {
    ...analysis,
    calories: analysis.calories || 0,
    macronutrients: analysis.macronutrients || [],
    micronutrients: analysis.micronutrients || [],
    goalSpecificInsights: analysis.goalSpecificInsights || [],
    generalInsights: analysis.generalInsights || [],
    mealName: analysis.mealName || 'Your Meal'
  };

  // Get personalized health goal from user profile
  const userGoal = userProfile?.defaultGoal || goal || 'General Wellness';

  return (
    <div className="max-w-4xl mx-auto p-4" data-timestamp={version}>
      {/* Version tag to confirm deployment */}
      <div className="fixed top-0 right-0 bg-blue-600 text-white px-2 py-1 text-xs z-50">
        Version: {version || 'unknown'} (FIXED)
      </div>
      
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 bg-blue-500 text-white">
          <h2 className="text-xl font-bold">{safeAnalysis.mealName}</h2>
          {userProfile && (
            <p className="text-sm text-blue-100">
              Personalized for {user?.user_metadata?.username || user?.email || 'you'}
              {userProfile.age && <span> ({userProfile.age} years old)</span>}
            </p>
          )}
        </div>
        
        <div className="p-5">
          {imageUrl && (
            <div className="mb-5 text-center">
              <img 
                src={imageUrl} 
                alt="Analyzed food" 
                className="rounded-lg mx-auto max-h-64 object-cover"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Nutrition Estimate</h3>
              <p className="text-xl font-bold">{safeAnalysis.calories || '~350'} calories</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Protein:</span>
                  <p className="font-medium">
                    {safeAnalysis.macronutrients[0]?.amount || 0}
                    {safeAnalysis.macronutrients[0]?.unit || 'g'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Carbs:</span>
                  <p className="font-medium">
                    {safeAnalysis.macronutrients[1]?.amount || 0}
                    {safeAnalysis.macronutrients[1]?.unit || 'g'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Fat:</span>
                  <p className="font-medium">
                    {safeAnalysis.macronutrients[2]?.amount || 0}
                    {safeAnalysis.macronutrients[2]?.unit || 'g'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Goal: {userGoal}</h3>
              <ul className="text-sm space-y-1">
                {safeAnalysis.goalSpecificInsights?.length > 0 ? (
                  safeAnalysis.goalSpecificInsights.map((insight: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{insight}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>This meal provides balanced nutrition for general wellness</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Contains a good balance of macronutrients for sustained energy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Consider incorporating a variety of foods throughout the day</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          {/* Add micronutrients section with personalization */}
          {safeAnalysis.micronutrients && safeAnalysis.micronutrients.length > 0 && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Key Micronutrients</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {safeAnalysis.micronutrients.slice(0, 6).map((nutrient: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 p-3 rounded bg-white">
                    <div className="font-medium">{nutrient.name}</div>
                    <div className="text-sm text-gray-600">
                      {nutrient.amount}{nutrient.unit} 
                      {nutrient.percentDailyValue && ` (${nutrient.percentDailyValue}% DV)`}
                    </div>
                    {userProfile && userProfile.age && (
                      <div className="text-xs text-blue-600 mt-1">
                        {userGoal === 'Weight Loss' ? 
                          `Essential for metabolism and energy balance.` :
                         userGoal === 'Muscle Gain' ?
                          `Supports muscle recovery and growth.` :
                         userGoal === 'Heart Health' ? 
                          `Important for cardiovascular health.` :
                          `Important for your overall health.`
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 