'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UserProfile } from '@/lib/profile-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getEffectiveProfile, getDefaultProfile } from '@/lib/profile-utils';

interface AIHealthReviewProps {
  mealId: string;
  userProfile?: UserProfile | null;
}

export default function AIHealthReview({ mealId, userProfile }: AIHealthReviewProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const [fallbackReview, setFallbackReview] = useState<string | null>(null);
  const [mealData, setMealData] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(userProfile || null);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    } else {
      // If no profile was passed, try to load it
      getEffectiveProfile().then(loadedProfile => {
        setProfile(loadedProfile);
      }).catch(err => {
        console.error('Error loading profile in AIHealthReview:', err);
        // Use default profile as fallback
        setProfile(getDefaultProfile());
      });
    }
  }, [userProfile]);
  
  // Function to fetch health review from API
  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    
    if (!mealId) {
      setError('No meal ID provided');
      setLoading(false);
      return;
    }
    
    try {
      // Try to load from the API first
      const response = await fetch(`/api/health-review?mealId=${mealId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Health review data:', data);
        
        if (data.error) {
          console.error('API returned error:', data.error);
          setError(data.error);
        } else {
          // First try to use the dedicated insights field directly from the response
          setReview(data.insights || data.review || data.summary || 
                  (data.mealData && data.mealData.insights) || 
                  "Insights not available for this meal.");
          
          if (data.mealData) {
            setMealData(data.mealData);
          }
        }
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching health review:', err);
      setError('Failed to load health review');
      
      // Try to use fallback data if available
      const fallbackData = loadFallbackData(mealId);
      if (fallbackData) {
        setMealData(fallbackData);
        const generatedReview = generateSimpleReview(fallbackData, profile);
        setReview(generatedReview);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const generateReview = async () => {
      if (!mealId) {
        console.log('No meal ID provided to AIHealthReview');
        setError('No meal ID provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log(`Generating health review for meal: ${mealId}`);
        setLoading(true);
        
        // Create fallback review based on meal ID format
        const defaultReview = `This meal was analyzed with our AI system. The meal appears to be a typical dish with moderate calories. For a more personalized analysis, please complete your profile with your health goals.`;
        setFallbackReview(defaultReview);
        
        // Try to get the meal data from localStorage if available
        let localMeal = null;
        try {
          const storedMeal = localStorage.getItem(`meal_analysis_${mealId}`);
          if (storedMeal) {
            localMeal = JSON.parse(storedMeal);
            if (localMeal && (localMeal.analysis || localMeal.nutrients || localMeal.data)) {
              setMealData(localMeal);
              
              // If the local meal data has insights, use it immediately
              if (localMeal.insights) {
                setReview(localMeal.insights);
                setLoading(false);
                // Still fetch from API to ensure the latest data, but don't wait for it
                fetchReview();
                return;
              }
            }
          }
        } catch (e) {
          console.log('Error retrieving local meal data:', e);
        }
        
        // Try to get the review from the API
        const response = await fetch(`/api/health-review?mealId=${mealId}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.warn('API returned error for health review:', data.error);
          
          // If we have local meal data, generate a simple review from it
          if (localMeal) {
            // Check if the local meal has insights first
            if (localMeal.insights) {
              setReview(localMeal.insights);
              setLoading(false);
              return;
            }
            const simplifiedReview = generateSimpleReview(localMeal, profile);
            setReview(simplifiedReview);
            setLoading(false);
            return;
          }
          
          // If no meal data is available but we have a fallback, use it
          if (fallbackReview) {
            setReview(fallbackReview);
            setLoading(false);
            return;
          }
          
          setError(data.error);
          setLoading(false);
          return;
        }
        
        // If we got a valid response, update the state
        // Check for dedicated insights field first, then fall back to other options
        const reviewText = data.insights || data.review || data.summary || 
                         (data.mealData && data.mealData.insights) ||
                         defaultReview;
        
        setReview(reviewText);
        if (data.mealData) {
          setMealData(data.mealData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error generating health review:', err);
        
        // Use the fallback review if available
        if (fallbackReview) {
          setReview(fallbackReview);
        } else {
          setError('Failed to generate review');
        }
        
        setLoading(false);
      }
    };
    
    generateReview();
  }, [mealId]);
  
  // Generate a simple review if the API one fails
  const generateSimpleReview = (meal: any, userProfile: UserProfile | null) => {
    if (!meal) {
      return "Analysis not available for this meal. Please try again or view a different meal.";
    }
    
    const foodName = meal?.mealName || meal?.detectedFood || meal?.caption || meal?.name || 'food';
    const calories = meal?.analysis?.calories || meal?.nutrients?.calories || meal?.calories || 0;
    
    let review = `This ${foodName} was analyzed and contains approximately ${calories} calories. `;
    
    // Add simple macronutrient information if available
    const macros = meal?.analysis?.macronutrients || meal?.nutrients?.macronutrients || meal?.macronutrients || [];
    if (macros && macros.length > 0) {
      const protein = macros.find((m: any) => m?.name?.toLowerCase().includes('protein'));
      const carbs = macros.find((m: any) => m?.name?.toLowerCase().includes('carb'));
      const fat = macros.find((m: any) => m?.name?.toLowerCase().includes('fat'));
      
      review += 'Macronutrient breakdown: ';
      
      if (protein) review += `${Math.round(protein.amount)}g protein, `;
      if (carbs) review += `${Math.round(carbs.amount)}g carbohydrates, `;
      if (fat) review += `${Math.round(fat.amount)}g fat. `;
    }
    
    // Add health insight based on user profile if available
    if (userProfile && userProfile.goal) {
      if (userProfile.goal === 'Weight Loss' && calories > 600) {
        review += `This meal has a high calorie content for a weight loss diet. Consider portion control or lower-calorie alternatives.`;
      } else if (userProfile.goal === 'Weight Loss' && calories <= 600) {
        review += `This meal fits well within a calorie-controlled diet for weight loss.`;
      } else if (userProfile.goal === 'Muscle Gain' && calories < 700) {
        review += `For muscle gain, you might want to increase protein intake with this meal.`;
      } else if (userProfile.goal === 'Heart Health') {
        review += `For heart health, focus on the sodium and saturated fat content in this meal.`;
      } else {
        review += `This meal can be part of a balanced diet for your ${userProfile.goal || 'health'} goals.`;
      }
    } else {
      review += `Complete your health profile for more personalized nutrition insights.`;
    }
    
    return review;
  };
  
  // Add this function for loading fallback data from localStorage
  const loadFallbackData = (mealId: string) => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Try different potential localStorage keys
      const possibleKeys = [
        `meal_${mealId}`,
        'last_meal_analysis',
        `meal_analysis_${mealId}`,
        'last_analyzed_meal'
      ];
      
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsedData = JSON.parse(data);
            if (parsedData && (parsedData.nutrients || parsedData.analysis)) {
              console.log(`Found fallback meal data in localStorage with key: ${key}`);
              return parsedData;
            }
          } catch (e) {
            console.error(`Error parsing localStorage key ${key}:`, e);
          }
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    
    return null;
  };
  
  // Format the review text for better readability
  const formatReviewText = (text: string) => {
    if (!text) return [];

    // Split into paragraphs for better readability
    const paragraphs = text.split('. ').filter(p => p.trim().length > 0);
    
    // Group into logical sections (roughly 2-3 sentences per visual paragraph)
    const groupedParagraphs = [];
    for (let i = 0; i < paragraphs.length; i += 2) {
      const group = paragraphs.slice(i, i + 2).join('. ') + (i + 2 < paragraphs.length ? '.' : '');
      groupedParagraphs.push(group);
    }
    
    return groupedParagraphs;
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Skeleton className="h-4 w-full my-2" />
        <Skeleton className="h-4 w-full my-2" />
        <Skeleton className="h-4 w-3/4 mx-auto my-2" />
        <p className="text-sm text-muted-foreground mt-2">Generating personalized insights...</p>
      </div>
    );
  }
  
  if (error && !review && !fallbackReview) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800">Health insights unavailable</h3>
        <p className="text-yellow-700">We couldn't generate personalized insights for this meal. Please try again later.</p>
        <p className="text-sm text-yellow-600 mt-2">
          To get the most accurate insights, please ensure your profile is complete with your health goals and preferences.
        </p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.href = '/profile'}
        >
          Update Profile
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personalized Health Insights</h2>
        {loading && <div className="h-4 w-4 border-2 border-gray-800 rounded-full animate-spin"></div>}
      </div>
      
      {loading ? (
        <div className="p-4 bg-gray-800/40 border border-gray-700 rounded-md animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      ) : review ? (
        <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 p-5 rounded-lg border border-gray-700 shadow-inner">
          {formatReviewText(review).map((paragraph, index) => (
            <p key={index} className="mb-3 text-gray-200 leading-relaxed">
              {paragraph}
            </p>
          ))}
          
          {/* Display last updated time if available */}
          {mealData && mealData.updated_at && (
            <div className="mt-4 text-xs text-gray-400 italic border-t border-gray-700 pt-2">
              Last updated: {new Date(mealData.updated_at).toLocaleString()}
            </div>
          )}
          
          {/* "In the style of..." attribution - makes the analysis feel more credible */}
          <div className="mt-2 text-xs text-gray-400 italic border-t border-gray-700 pt-2">
            Analysis provided in the style of expert health practitioners like Peter Attia and Andrew Huberman.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-md">
          {fallbackReview ? (
            <div>
              <h3 className="text-lg font-medium text-yellow-500 mb-2">Simplified Analysis</h3>
              <p className="text-gray-300">{fallbackReview}</p>
            </div>
          ) : (
            <div>
              <p className="text-yellow-500">Loading health insights...</p>
              <p className="text-sm text-yellow-600/70 mt-2">
                This may take a moment as we analyze your meal's nutritional profile.
              </p>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-md mt-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {mealData && (
        <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 mt-2">
          <h3 className="text-lg font-medium mb-2">Nutrient Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Macronutrient summary */}
            <div className="bg-gray-800/70 p-3 rounded-md border border-gray-700/50">
              <p className="text-blue-400 font-medium mb-1">Macronutrients</p>
              <p className="text-sm text-gray-300">
                {mealData?.nutrients?.macronutrients?.slice(0, 3).map((m: any) => 
                  `${m.name}: ${m.amount}${m.unit}`
                ).join(', ') || 'Data not available'}
              </p>
            </div>
            
            {/* Micronutrient highlights */}
            <div className="bg-gray-800/70 p-3 rounded-md border border-gray-700/50">
              <p className="text-purple-400 font-medium mb-1">Key Micronutrients</p>
              <p className="text-sm text-gray-300">
                {mealData?.nutrients?.micronutrients?.slice(0, 3).map((m: any) => 
                  `${m.name}: ${m.percentDailyValue || '~'}% DV`
                ).join(', ') || 'Data not available'}
              </p>
            </div>
            
            {/* Health goal alignment */}
            <div className="bg-gray-800/70 p-3 rounded-md border border-gray-700/50">
              <p className="text-green-400 font-medium mb-1">Goal Alignment</p>
              <p className="text-sm text-gray-300">
                {mealData?.nutrients?.personalized_feedback?.goal_alignment || 
                 `Aligned with your ${profile?.goal || 'health'} goals`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 