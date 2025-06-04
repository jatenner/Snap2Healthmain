'use client';

import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronsLeft, Star, Share2, Download, HelpCircle, Info, User, Activity, UserCheck, History, Printer, CheckCircle, Upload, Camera, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import MealImage from './MealImage';
import { useAuth } from './client/ClientAuthProvider';
import { supabase } from '../lib/supabase/client';
import EnhancedNutrientDisplay from './EnhancedNutrientDisplay';
import AIHealthReview from './AIHealthReview';
import EnhancedMealAnalysisDisplay from './EnhancedMealAnalysisDisplay';
import { 
  UserProfile as ProfileUtilsUserProfile,
  ExtendedUserProfile, 
  getEffectiveProfile, 
  isProfileComplete, 
  NUTRIENT_DESCRIPTIONS, 
  getCompleteProfileButton 
} from '../lib/profile-utils';
import { useDropzone } from 'react-dropzone';
import { useProfile } from '../lib/profile-context';
import { v4 as uuidv4 } from 'uuid';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

// Add TypeScript declarations for our custom window properties
declare global {
  interface Window {
    loadMealAnalysisData?: (mealId: string) => any;
    loadMealImageData?: (mealId: string) => { imageUrl?: string } | null;
    currentMealId?: string;
    forceRedirectToAnalysis?: (mealId: string) => void;
    profileDebug?: {
      checkLocalStorage: () => any;
      validateProfileData: (profile: any) => any;
      fixProfile: () => any;
      clearProfile: () => void;
    };
    _forcedProfileData?: any;
    fixOpenAIModel?: () => void;
    fixOpenAIApiKey?: () => void;
    __OPENAI_API_KEY_AVAILABLE?: boolean;
    __OPENAI_MODEL_NAME?: string;
  }
}

// Use a more flexible UserProfile type for compatibility
type UserProfile = any;

// Define the types for meal data
interface Nutrient {
      name: string;
      amount: number;
      unit: string;
  percentDailyValue: number;
      description?: string;
}

interface Ingredient {
      name: string;
  portion?: string;
  calories?: number;
}

interface Analysis {
  calories?: number;
  totalCalories?: number;
  macronutrients?: Nutrient[];
  micronutrients?: Nutrient[];
}

interface MealData {
  id: string;
  mealName: string;
  goal: string;
  imageUrl: string;
  mealContents?: any;
  mealDescription?: string;
  ingredients?: Ingredient[];
  analysis?: Analysis;
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  insights?: string;
  tags?: string[];
}

// MealContents interface to properly type the mealContents object
interface MealContents {
  foods?: Array<{ name: string; amount: string }>;
  [key: string]: any;
}

interface StandaloneMealAnalysisProps {
  initialMeal?: any;
  embedded?: boolean;
  mealId?: string | null;
}

// Define a helper function to replace getMissingProfileFields
const getMissingFields = (profile: any): string[] => {
  if (!profile) return ['complete profile'];
  
  const requiredFields = ['age', 'gender', 'weight', 'height', 'goal', 'activityLevel'];
  return requiredFields.filter(field => !profile[field]);
};

// Standalone component that doesn't rely on context
// Helper function to normalize data from different sources
const normalizeData = (data: any) => {
  console.log('[normalizeData] Processing data:', data);
  
  if (!data) {
    console.error('[normalizeData] No data provided');
    return null;
  }
  
  // Create normalized structure that matches EnhancedMealAnalysisDisplay expectations
  const normalized: any = {
    id: data.id || data.uuid || data.mealId || `temp-${Date.now()}`,
    mealName: data.mealName || data.name || data.meal_name || data.caption || 'Meal Analysis',
    mealDescription: data.mealDescription || data.description || '',
    imageUrl: data.imageUrl || data.image_url || '',
    goal: data.goal || 'General Health',
    
    // Extract calories, protein, fat, carbs from analysis or root level
    calories: data.calories || (data.analysis?.calories) || 0,
    protein: data.protein || (data.analysis?.protein) || 0,
    fat: data.fat || (data.analysis?.fat) || 0,
    carbs: data.carbs || (data.analysis?.carbs) || 0,
    
    // Extract arrays from analysis or root level
    macronutrients: data.macronutrients || (data.analysis?.macronutrients) || [],
    micronutrients: data.micronutrients || (data.analysis?.micronutrients) || [],
    ingredients: data.ingredients || (data.analysis?.ingredients) || [],
    foods: data.foods || (data.analysis?.foods_identified) || [],
    benefits: data.benefits || (data.analysis?.benefits) || [],
    concerns: data.concerns || (data.analysis?.concerns) || [],
    suggestions: data.suggestions || (data.analysis?.suggestions) || [],
    
    // Extract personalized insights
    personalizedHealthInsights: data.personalizedHealthInsights || 
                               (data.analysis?.personalized_health_insights) || 
                               (data.analysis?.personalizedHealthInsights) || '',
    expertRecommendations: data.expertRecommendations || (data.analysis?.expertRecommendations) || [],
    metabolicInsights: data.metabolicInsights || (data.analysis?.metabolicInsights) || '',
    
    // Keep original structure for backward compatibility
    analysis: data.analysis || {
      calories: data.calories || 0,
      protein: data.protein || 0,
      fat: data.fat || 0,
      carbs: data.carbs || 0,
      macronutrients: data.macronutrients || [],
      micronutrients: data.micronutrients || []
    },
    
    // Additional metadata
    healthRating: data.healthRating || data.health_score || (data.analysis?.health_score) || 0,
    timestamp: data.created_at || data.timestamp || new Date().toISOString(),
    tags: data.tags || []
  };
  
  console.log('[normalizeData] Normalized data:', normalized);
  return normalized;
};

// Helper function to ensure proper data structure
const ensureProperDataStructure = (data: any) => {
  if (!data) return null;
  
  // Create a normalized structure
  const normalized: any = {
    id: data.id || data.mealId || data.uuid || 'unknown-id',
    mealId: data.id || data.mealId || data.uuid || 'unknown-id',
    mealName: data.mealName || data.meal_name || data.name || 'Analyzed Meal',
    imageUrl: data.imageUrl || data.image_url || '',
    goal: data.goal || 'General Health',
    calories: data.calories || 0,
    
    // Ensure these critical arrays exist
    macronutrients: data.macronutrients || (data.analysis?.macronutrients) || [],
    micronutrients: data.micronutrients || (data.analysis?.micronutrients) || [],
    benefits: data.benefits || (data.analysis?.benefits) || [],
    concerns: data.concerns || (data.analysis?.concerns) || [],
    suggestions: data.suggestions || (data.analysis?.suggestions) || [],
    insights: data.insights || (data.analysis?.insights) || '',
    
    // Always include an analysis object with proper structure
    analysis: {
      calories: data.calories || (data.analysis?.calories) || 0,
      totalCalories: data.totalCalories || (data.analysis?.totalCalories) || data.calories || 0,
      macronutrients: data.macronutrients || (data.analysis?.macronutrients) || [],
      micronutrients: data.micronutrients || (data.analysis?.micronutrients) || []
    }
  };
  
  return normalized;
};

export default function StandaloneMealAnalysis({ 
  initialMeal,
  embedded = false,
  mealId: propMealId = null
}: StandaloneMealAnalysisProps) {
  // Store the mealId in state immediately to ensure it's available for all hooks
  const [mealId, setMealId] = useState<string | null>(propMealId);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [effectiveProfile, setEffectiveProfile] = useState<ExtendedUserProfile | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mealData, setMealData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('Processing your meal...');
  
  // Refs to track component state
  const initialized = useRef(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const mealIdRef = useRef(mealId);

  // Update ref when mealId changes
  useEffect(() => {
    mealIdRef.current = mealId;
    
    // Also set on window for compatibility with other scripts
    if (typeof window !== 'undefined' && mealId) {
      window.currentMealId = mealId;
    }
  }, [mealIdRef.current]);
  
  // State for saving meal to history
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useAuth();
  
  // State for image upload and analysis
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mealName, setMealName] = useState('My Meal');
  const [mealGoal, setMealGoal] = useState('General Health');
  const [attemptCount, setAttemptCount] = useState(0);
  
  const { profile: profileFromContext } = useProfile();
  
  // Initialize and load data
  useEffect(() => {
    // Load meal data if ID is provided
    if (mealId) {
      console.log('[StandaloneMealAnalysis] Initial mealId available, fetching data:', mealId);
      fetchMealData();
    } else if (initialMeal) {
      // Use provided initial meal data if available
      console.log('[StandaloneMealAnalysis] Using provided initialMeal data');
      setMealData(initialMeal);
      setIsLoading(false);
    } else {
      // No meal ID and no initial meal - show upload form
      console.log('[StandaloneMealAnalysis] No mealId or initialMeal - showing upload form');
      setIsLoading(false);
    }
    
    // Clean up on unmount
    return () => {
      if (pollingInterval.current) {
        console.log('[StandaloneMealAnalysis] Cleaning up polling interval on unmount');
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [mealId, initialMeal]);
  
  // Initialize profile data
  useEffect(() => {
    const loadProfile = async () => {
      const profile = profileFromContext || 
                     (typeof window !== 'undefined' && window._forcedProfileData) || 
                     null;
    
      if (profile) {
        setUserProfile(profile);
        
        // Get the enhanced profile with calculations
        const enhanced = await getEffectiveProfile(profile);
        setEffectiveProfile(enhanced);
        
        // Update profile status
        setProfileComplete(isProfileComplete(profile));
        setMissingFields(getMissingFields(profile));
      }
    };
    loadProfile();
    
    // Listen for profile updates
    const handleProfileUpdate = async () => {
      const updatedProfile = profileFromContext || 
                           (typeof window !== 'undefined' && window._forcedProfileData) || 
                           null;
      if (updatedProfile) {
        setUserProfile(updatedProfile);
        const enhanced = await getEffectiveProfile(updatedProfile);
        setEffectiveProfile(enhanced);
        setProfileComplete(isProfileComplete(updatedProfile));
        setMissingFields(getMissingFields(updatedProfile));
      }
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
  }, [profileFromContext]);
  
  // Process the file when selected
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setError('');
      } else {
        setError('Please upload an image file (JPEG, PNG, etc.)');
      }
    }
  }, []);
  
  // Set up dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.heif']
    },
    maxFiles: 1
  });
  
  // Submit the image for analysis
  const analyzeImage = async () => {
    if (!file) {
      setError('Please select an image to analyze');
      return;
    }
    
    // Prevent multiple concurrent requests
    if (isLoading) {
      console.log('[StandaloneMealAnalysis] Analysis already in progress, ignoring request');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setMealData(null); // Clear previous data to prevent flickering
      setAnalysisComplete(false);
      
      // Create form data to send
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mealName', mealName);
      formData.append('goal', mealGoal);
      
      // Add user profile data if available
      if (effectiveProfile) {
        formData.append('userProfile', JSON.stringify(effectiveProfile));
      }
      
      // Send the image for analysis
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze meal');
      }
      
      // Get the analysis result
      const result = await response.json();
      
      if (result.success) {
        // The API returns mealAnalysis and mealId, not mealData
        const mealAnalysisData = result.mealAnalysis || result.mealData;
        const returnedMealId = result.mealId || result.id;
        
        if (!mealAnalysisData) {
          throw new Error('No meal analysis data received from API');
        }
        
        // Add the meal ID to the analysis data
        const dataWithId = {
          ...mealAnalysisData,
          id: returnedMealId || mealAnalysisData.id,
          mealId: returnedMealId || mealAnalysisData.id
        };
        
        // Normalize and save the data
        const normalizedData = normalizeData(dataWithId);
        
        if (!normalizedData) {
          throw new Error('Failed to normalize meal data');
        }
        
        console.log('[analyzeImage] Setting normalized meal data:', normalizedData);
        setMealData(normalizedData);
        setAnalysisComplete(true);
        
        // Store the meal ID for reference
        if (normalizedData.id) {
          setMealId(normalizedData.id);
        }
        
        // Cache the data in localStorage for future reference
        if (typeof window !== 'undefined' && normalizedData.id) {
          try {
            localStorage.setItem(`meal_${normalizedData.id}`, JSON.stringify(normalizedData));
            console.log('[analyzeImage] Cached meal data in localStorage');
          } catch (e) {
            console.warn('[analyzeImage] Failed to cache data:', e);
          }
        }
        
        // Automatically save to meal history if user is logged in
        if (user && normalizedData) {
          console.log('[analyzeImage] Automatically saving meal to history');
          try {
            // Set the meal data first, then save
            setTimeout(async () => {
              await saveMealToHistory();
              console.log('[analyzeImage] Meal automatically saved to history');
            }, 100); // Small delay to ensure state is updated
          } catch (autoSaveError) {
            console.warn('[analyzeImage] Auto-save to history failed:', autoSaveError);
            // Don't throw error - user can still manually save
          }
        }
        
        // Show analysis inline instead of redirecting (better UX)
        console.log('[analyzeImage] Analysis complete - displaying results inline');
      } else {
        throw new Error(result.error || 'Failed to analyze meal');
      }
    } catch (err) {
      console.error('Error analyzing meal:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setAttemptCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setMealName('My Meal');
    setMealGoal('General Health');
    setError('');
    setAnalysisComplete(false);
    setMealData(null);
  };
  
  // Save the analyzed meal to user history
  const saveMealToHistory = async () => {
    if (!mealData || !user) {
      setSaveError('Cannot save meal: Missing meal data or user not logged in');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Generate a UUID if one doesn't exist
      const mealId = mealData.id || uuidv4();
      
      // Prepare the meal data for the meal_history table (not meals table)
      const mealEntry = {
        id: mealId,
        user_id: user.id,
        meal_name: mealData.mealName,
        image_url: mealData.imageUrl,
        goal: mealData.goal || mealGoal,
        analysis: {
          ...mealData.analysis,
          userProfile: {
            goal: effectiveProfile?.goal,
            age: effectiveProfile?.age,
            gender: effectiveProfile?.gender,
            activityLevel: effectiveProfile?.activityLevel
          },
          insights: mealData.insights || '',
          timestamp: new Date().toISOString(),
          // Include additional data for compatibility
          mealName: mealData.mealName,
          mealDescription: mealData.mealDescription,
          benefits: mealData.benefits || [],
          concerns: mealData.concerns || [],
          suggestions: mealData.suggestions || [],
          ingredients: mealData.ingredients || [],
          detectedFood: mealData.mealContents?.foods?.map((f: any) => f.name).join(', ') || ''
        },
        created_at: new Date().toISOString()
      };
      
      console.log('[StandaloneMealAnalysis] Saving meal to meal_history table:', mealId);
      
      // Insert into the meal_history table (not meals table)
      const { error } = await supabase
        .from('meals')
        .upsert(mealEntry);
      
      if (error) {
        console.error('[StandaloneMealAnalysis] Supabase error:', error);
        
        // Try fallback method using RPC if direct insert fails
        try {
          const { error: rpcError } = await supabase.rpc('admin_insert_meal_history', {
            p_id: mealId,
            p_user_id: user.id,
            p_meal_name: mealData.mealName,
            p_image_url: mealData.imageUrl,
            p_analysis: mealEntry.analysis,
            p_goal: mealEntry.goal
          });
          
          if (rpcError) {
            throw new Error(`RPC fallback failed: ${rpcError.message}`);
          } else {
            console.log('[StandaloneMealAnalysis] Saved meal using RPC fallback');
          }
        } catch (rpcErr) {
          console.error('[StandaloneMealAnalysis] RPC fallback error:', rpcErr);
          throw new Error(`Failed to save meal: ${error.message}`);
        }
      } else {
        console.log('[StandaloneMealAnalysis] Meal saved successfully to meal_history');
      }
      
      // Also save to localStorage for redundancy
      try {
        const storageKey = `meal_analysis_${mealId}`;
        localStorage.setItem(storageKey, JSON.stringify({
          ...mealEntry,
          timestamp: Date.now()
        }));
        console.log('[StandaloneMealAnalysis] Meal also saved to localStorage');
      } catch (e) {
        console.warn('[StandaloneMealAnalysis] Could not save to localStorage:', e);
      }
      
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving meal to history:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save meal to history');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Auto-save to meal history when analysis is complete
  useEffect(() => {
    const autoSaveToHistory = async () => {
      // Only auto-save if:
      // 1. User is logged in
      // 2. We have meal data
      // 3. Analysis is complete
      // 4. We haven't already saved this meal (check if it's not already saving)
      if (user && mealData && analysisComplete && !isSaving && !saveSuccess) {
        console.log('[useEffect] Auto-saving meal to history:', mealData.id);
        try {
          await saveMealToHistory();
          console.log('[useEffect] Meal automatically saved to history');
        } catch (error) {
          console.warn('[useEffect] Auto-save failed:', error);
          // Don't show error to user - they can manually save if needed
        }
      }
    };

    autoSaveToHistory();
  }, [user, mealData, analysisComplete, isSaving, saveSuccess]);
  
  // Process nutrient information to add descriptions
  useEffect(() => {
    const processNutrients = async () => {
      if (mealData && mealData.analysis) {
        // Get the effective profile for personalization
        const profile = await getEffectiveProfile(userProfile);
        
        // Make a deep copy of the meal data to avoid modifying the original
        const updatedMealData = JSON.parse(JSON.stringify(mealData));
        
        // Add descriptions to macronutrients if missing
        // NOTE: Do NOT recalculate percentDailyValue here - it's already calculated by the backend
        if (updatedMealData.analysis.macronutrients) {
          updatedMealData.analysis.macronutrients.forEach((macro: Nutrient) => {
            // Add description if missing
            if (!macro.description && macro.name) {
              const lowerName = macro.name.toLowerCase();
              macro.description = NUTRIENT_DESCRIPTIONS[lowerName] || 
                `${macro.name} is an important macronutrient essential for bodily functions.`;
            }
            // percentDailyValue is already calculated by the backend - don't override it
          });
        }
        
        // Add descriptions to micronutrients if missing
        // NOTE: Do NOT recalculate percentDailyValue here - it's already calculated by the backend
        if (updatedMealData.analysis.micronutrients) {
          updatedMealData.analysis.micronutrients.forEach((micro: Nutrient) => {
            if (!micro.description && micro.name) {
              const lowerName = micro.name.toLowerCase();
              micro.description = NUTRIENT_DESCRIPTIONS[lowerName] || 
                `${micro.name} is an important micronutrient that supports various bodily functions.`;
            }
            // percentDailyValue is already calculated by the backend - don't override it
          });
        }
        
        // Update the meal data state
        setMealData(updatedMealData);
      }
    };
    processNutrients();
  }, [userProfile, mealData?.id]);
  
  // Fetch meal data from API or localStorage
  const fetchMealData = async () => {
    if (!mealId) {
      console.error('[StandaloneMealAnalysis] No meal ID provided for fetching');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      console.log(`[StandaloneMealAnalysis] Fetching meal data for ID: ${mealId}`);
      
      // Try localStorage first (fastest)
      if (typeof window !== 'undefined') {
        try {
          const localData = localStorage.getItem(`meal_${mealId}`);
          if (localData) {
            const parsedData = JSON.parse(localData);
            console.log('[StandaloneMealAnalysis] Found meal data in localStorage');
            setMealData(normalizeData(parsedData));
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[StandaloneMealAnalysis] Error reading from localStorage:', e);
        }
      }
      
      // Try full meal data endpoint
      const response = await fetch(`/api/meals/${mealId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[StandaloneMealAnalysis] API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`Failed to fetch meal data. Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Check if the result itself is the meal data (and not an error object)
      // A valid meal object should have an 'id' property.
      if (result && result.id) {
        console.log('[StandaloneMealAnalysis] Successfully fetched meal data from API');
        
        // Process and save the data
        const normalizedData = normalizeData(result); // Use result directly
        setMealData(normalizedData);
        
        // Cache in localStorage for future requests
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`meal_${mealId}`, JSON.stringify(normalizedData));
          } catch (e) {
            console.warn('[StandaloneMealAnalysis] Failed to cache data in localStorage:', e);
          }
        }
      } else {
        // If result is not the expected meal data, or is an error object from the API (even with 200 OK)
        console.error('[StandaloneMealAnalysis] API response was OK, but data format is unexpected or indicates an error:', result);
        throw new Error(result?.error || 'Fetched data is not in the expected format or API returned an error structure.');
      }
    } catch (error) {
      console.error('[StandaloneMealAnalysis] Error fetching meal data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load meal analysis');
      
      // Try to use fallback data if we have any
      if (typeof window !== 'undefined') {
        try {
          if (mealId) {
            const fallbackData = localStorage.getItem(`meal_fallback_${mealId}`);
            if (fallbackData) {
              const parsedData = JSON.parse(fallbackData);
              console.log('[StandaloneMealAnalysis] Using fallback data');
              setMealData(normalizeData(parsedData));
            }
          }
        } catch (e) {
          console.error('[StandaloneMealAnalysis] Error using fallback data:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start polling for meal status updates
  const startPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    // Poll every 3 seconds
    pollingInterval.current = setInterval(async () => {
      try {
        const currentMealId = mealIdRef.current;
        if (!currentMealId) return;
        
        // Check status with the status-only endpoint
        const statusResponse = await fetch(`/api/analyze-meal?id=${currentMealId}&statusOnly=true`);
        
        if (!statusResponse.ok) {
          console.warn(`[StandaloneMealAnalysis] Status polling response not OK: ${statusResponse.status}`);
          return;
        }
        
        const statusResult = await statusResponse.json();
        
        // If not processing anymore, try to get full data
        if (statusResult.status !== 'processing') {
          console.log('[StandaloneMealAnalysis] Processing complete, fetching full data');
          
          // Stop polling and fetch full data
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }
          
          setIsProcessing(false);
          
          // Get the full meal data
          const fullDataResponse = await fetch(`/api/meals/${currentMealId}`, {
            credentials: 'include'
          });
          
          if (fullDataResponse.ok) {
            const result = await fullDataResponse.json();
            
            if (result.success && result.data) {
              const normalizedData = normalizeData(result.data);
              setMealData(normalizedData);
              
              // Cache in localStorage for future requests
              try {
                localStorage.setItem(`meal_${currentMealId}`, JSON.stringify(normalizedData));
              } catch (e) {
                console.warn('[StandaloneMealAnalysis] Failed to cache data in localStorage:', e);
              }
            }
          }
        } else {
          // Still processing, update progress
          setProcessingProgress(statusResult.progress || 0);
          setProcessingMessage(statusResult.message || 'Processing your meal analysis...');
        }
      } catch (pollingError) {
        console.error('[StandaloneMealAnalysis] Polling error:', pollingError);
      }
    }, 3000);
  };
  
  // Render meal image
  const renderMealImage = () => {
    if (!mealData || !mealData.imageUrl) {
      return null;
    }
    
    return (
      <div className="relative rounded-lg overflow-hidden bg-gray-900 shadow-lg mb-6">
        <MealImage 
          src={mealData.imageUrl}
          alt={mealData.mealName || 'Analyzed meal'}
          className="w-full h-auto object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{mealData.mealName || 'Analyzed Meal'}</h1>
          {mealData.goal && (
            <div className="flex items-center mt-2">
              <span className="text-xs bg-indigo-900/50 text-indigo-200 px-2 py-1 rounded-full">
                {mealData.goal}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render nutrient analysis
  const renderNutrientAnalysis = () => {
    if (!mealData) {
      return <div className="p-4 text-gray-400">No meal data available</div>;
    }
    
    // Ensure analysis object exists
    const analysis = mealData.analysis || {
      calories: mealData.calories || 0,
      macronutrients: mealData.macronutrients || [],
      micronutrients: mealData.micronutrients || []
    };
    
    return (
      <div className="space-y-8">
        {/* Meal description */}
        {mealData.mealDescription && (
          <div className="bg-gray-800/60 rounded-lg p-4 mb-6">
            <p className="text-gray-300">{mealData.mealDescription}</p>
          </div>
        )}
            
        {/* Calories */}
        <div className="bg-indigo-900/30 border border-indigo-800/50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-indigo-300">Nutritional Analysis</h2>
            <div className="text-2xl font-bold text-indigo-100">
              {analysis.calories || analysis.totalCalories || mealData.calories || 0} <span className="text-sm text-indigo-300">kcal</span>
            </div>
          </div>
          
          {/* Ingredients if available */}
          {mealData.ingredients && mealData.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-indigo-300 mb-2">Ingredients</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {mealData.ingredients.map((ingredient, i) => (
                  <li key={i} className="flex justify-between text-sm bg-indigo-900/20 p-2 rounded-md">
                    <span className="text-gray-300">{ingredient.name}</span>
                    {ingredient.calories && (
                      <span className="text-indigo-300 ml-2">{ingredient.calories} kcal</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Macronutrients */}
          {(analysis.macronutrients?.length > 0 || mealData.macronutrients?.length > 0) && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-indigo-300 mb-3">Macronutrients</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(analysis.macronutrients || mealData.macronutrients).map((nutrient, index) => (
                  <EnhancedNutrientDisplay
                    key={index}
                    nutrient={nutrient}
                    userProfile={effectiveProfile}
                    showDescription={true}
                    highlightLevel={nutrient.name.toLowerCase() === 'protein' ? 'high' : 'normal'}
                  />
                ))}
              </div>
            </div>
          )}
      
          {/* Micronutrients */}
          {(analysis.micronutrients?.length > 0 || mealData.micronutrients?.length > 0) && (
            <div>
              <h3 className="text-md font-semibold text-indigo-300 mb-3">Micronutrients</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(analysis.micronutrients || mealData.micronutrients).map((nutrient, index) => (
                  <EnhancedNutrientDisplay
                    key={index}
                    nutrient={nutrient}
                    userProfile={effectiveProfile}
                    showDescription={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render health review
  const renderHealthReview = () => {
    if (!mealData) {
      return null;
    }
    
    return (
      <AIHealthReview
        mealId={mealData.id || mealData.mealId}
        userProfile={effectiveProfile || undefined}
      />
    );
  };
  
  // Render upload form
  const renderUploadForm = () => {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-lg border border-indigo-800/50 p-6 shadow-md">
          <h2 className="text-2xl font-bold text-indigo-300 mb-6 text-center">Analyze Your Meal</h2>
          
          {error && (
            <div className="bg-red-900/20 border border-red-800/40 text-red-300 p-3 rounded-md mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Health goal text input */}
            <div>
              <label htmlFor="goal" className="block text-indigo-300 font-medium mb-2">
                Your Health Goal
              </label>
              <input
                type="text"
                id="goal"
                value={mealGoal}
                onChange={(e) => setMealGoal(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Weight loss, muscle gain, better energy, heart health..."
              />
              <p className="text-gray-400 text-sm mt-1">
                Describe your specific health or fitness goal for personalized insights
              </p>
            </div>
            
            {/* Image upload area */}
            <div>
              <label className="block text-indigo-300 font-medium mb-2">
                Meal Image
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700 hover:border-indigo-500 hover:bg-indigo-900/10'
                }`}
              >
                <input {...getInputProps()} />
                
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Selected meal"
                      className="max-h-64 mx-auto rounded-md"
                    />
                    <p className="text-gray-400">
                      Click or drag to change image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="w-12 h-12 text-indigo-500 mx-auto" />
                    <p className="text-gray-300">
                      Drag and drop an image here, or click to select a file
                    </p>
                    <p className="text-gray-400 text-sm">
                      For best results, use a clear, well-lit photo of your meal
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Reset form button */}
            <div className="flex justify-center">
              <button
                onClick={resetForm}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset Form
              </button>
            </div>
            
            {/* Analyze button */}
            <button
              onClick={analyzeImage}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading || !file}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Analyzing...
                </>
              ) : (
                'Analyze Meal'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Hook to capture the mealId from URL if available
  useEffect(() => {
    // Track window object initialization
    if (typeof window !== 'undefined') {
      // Store current meal ID in window for debugging
      try {
        const pathParts = window.location.pathname.split('/');
        const analysisIndex = pathParts.indexOf('analysis');
        if (analysisIndex >= 0 && pathParts.length > analysisIndex + 1) {
          const urlMealId = pathParts[analysisIndex + 1];
          console.log('[StandaloneMealAnalysis] Found meal ID in URL:', urlMealId);
          window.currentMealId = urlMealId;
          
          // If we have a meal ID in the URL but not as a prop, update it
          if (urlMealId && !mealId) {
            console.log('[StandaloneMealAnalysis] Setting mealId from URL:', urlMealId);
            setMealId(urlMealId);
            
            // Check if mealData exists in localStorage
            const localData = localStorage.getItem(`meal_${urlMealId}`);
            if (localData) {
              try {
                const parsedData = JSON.parse(localData);
                console.log('[StandaloneMealAnalysis] Found cached data for meal:', urlMealId);
                setMealData(ensureProperDataStructure(parsedData));
                setIsLoading(false);
              } catch (e) {
                console.error('[StandaloneMealAnalysis] Error parsing cached data:', e);
                // If cached data is corrupted, fetch from API
                fetchMealData();
              }
            } else {
              // No cached data, fetch from API
              fetchMealData();
            }
          }
        } else {
          console.log('[StandaloneMealAnalysis] No meal ID found in URL path');
        }
      } catch (e) {
        console.error('[StandaloneMealAnalysis] Error checking URL for meal ID:', e);
      }
      
      // Add helper function to force redirect
      window.forceRedirectToAnalysis = (mealId) => {
        if (mealId) {
          const url = `/analysis/${mealId}`;
          console.log(`[StandaloneMealAnalysis] Forcing redirect to: ${url}`);
          window.location.href = url;
          return true;
        }
        return false;
      };
    }
  }, [mealId]);
  
  // Main render
  if (embedded) {
    // Minimal view for embedded usage
    return (
      <div className="bg-gray-900 text-gray-200 p-4 rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-red-400 p-4">{error}</div>
        ) : mealData ? (
          <EnhancedMealAnalysisDisplay 
            mealData={mealData}
            userProfile={effectiveProfile || undefined}
            className="text-gray-200"
          />
        ) : (
          renderUploadForm()
        )}
      </div>
    );
  }
  
  // Full page view
  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ChevronsLeft className="w-5 h-5 mr-1" />
            Back to Home
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center p-12">
            <LoadingSpinner />
            <p className="mt-4 text-indigo-300 text-lg">Analyzing your meal...</p>
            <p className="text-gray-400 text-sm mt-2">This may take up to 20 seconds</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800/40 text-red-300 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={resetForm}
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        ) : mealData ? (
          <div className="space-y-6">
            <EnhancedMealAnalysisDisplay 
              mealData={mealData}
              userProfile={effectiveProfile || undefined}
              className="bg-gray-900 text-gray-200"
            />
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center text-gray-200 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Analyze Another Meal
              </button>
              
              {user && (
                <button 
                  onClick={saveMealToHistory}
                  disabled={isSaving || saveSuccess}
                  className={`px-6 py-3 rounded-lg flex items-center transition-colors ${
                    isSaving || saveSuccess
                      ? 'bg-green-800/50 text-green-300 cursor-not-allowed'
                      : 'bg-green-800/30 hover:bg-green-700/50 text-green-300'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Saved to History!
                    </>
                  ) : (
                    <>
                      <History className="w-5 h-5 mr-2" />
                      Save to My History
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Save error message */}
            {saveError && (
              <div className="bg-red-900/20 border border-red-800/40 text-red-300 p-4 rounded-lg text-center">
                <p>{saveError}</p>
              </div>
            )}
          </div>
        ) : (
          renderUploadForm()
        )}
      </div>
    </div>
  );
}