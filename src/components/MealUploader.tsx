'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Camera, ImageIcon } from 'lucide-react';
import { SimpleFoodAnalysis } from './SimpleFoodAnalysis';
import { uploadImageToSupabase } from '@/lib/uploadImageToSupabase';
import { analyzeImage } from '@/lib/analyzeImage';
import type { AnalysisResult } from '@/types/types';
import { useAuth } from '@/context/auth';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { FaCamera, FaUpload, FaRedo } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

export function MealUploader() {
  const { user } = useAuth();
  const userProfile = user?.user_metadata || {};
  const defaultGoal = userProfile.defaultGoal || 'General Wellness';
  
  // Use the authenticated user or redirect if not authenticated
  const router = useRouter();
  
  // If not authenticated, redirect to login
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [mealName, setMealName] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>(defaultGoal);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user profile is complete
  const isProfileComplete = userProfile && 
    userProfile.height && 
    userProfile.weight && 
    userProfile.age && 
    userProfile.gender && 
    userProfile.activityLevel;
  
  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create a preview URL for the image
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Clean up the preview URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    }
  };
  
  // Trigger the file input when the upload button is clicked
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Add this useEffect to ensure we're processing data correctly
  useEffect(() => {
    // If we have analysis results, make sure they're properly formatted for display
    if (analysisResult?.analysis) {
      try {
        console.log('Processing analysis data:', analysisResult.analysis);
        
        // Ensure the data has the right structure for SimpleFoodAnalysis
        const formattedData = {
          name: mealName || analysisResult.analysis.name || 'My Meal',
          calories: analysisResult.analysis.calories || 0,
          protein: analysisResult.analysis.protein || analysisResult.analysis.macronutrients?.find((m: any) => m.name === "Protein")?.amount || 0,
          carbs: analysisResult.analysis.carbs || analysisResult.analysis.macronutrients?.find((m: any) => m.name === "Carbohydrates")?.amount || 0,
          fat: analysisResult.analysis.fat || analysisResult.analysis.macronutrients?.find((m: any) => m.name === "Fat")?.amount || 0,
          protein_percent: analysisResult.analysis.protein_percent || analysisResult.analysis.macroRatios?.protein || 21,
          carbs_percent: analysisResult.analysis.carbs_percent || analysisResult.analysis.macroRatios?.carbs || 47,
          fat_percent: analysisResult.analysis.fat_percent || analysisResult.analysis.macroRatios?.fat || 32
        };
        
        setAnalysisData(formattedData);
      } catch (err) {
        console.error('Error processing analysis data:', err);
        // Use a basic fallback format if we can't process the data
        setAnalysisData({
          name: mealName || 'My Meal',
          calories: 500,
          protein: 25,
          carbs: 50,
          fat: 20,
          protein_percent: 21,
          carbs_percent: 47,
          fat_percent: 32
        });
      }
    }
  }, [analysisResult, mealName]);
  
  // Handle image upload and analysis
  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }
    
    try {
      setLoading(true);
      setIsAnalyzing(true);
      setError(null);
      
      // Ensure we have the latest user profile data
      const currentUserProfile = user?.user_metadata || {
        defaultGoal: selectedGoal || 'General Wellness'
      };
      
      // Add default values if missing
      const completeUserProfile = {
        gender: currentUserProfile.gender || 'neutral',
        age: currentUserProfile.age || 35,
        weight: currentUserProfile.weight || 160,
        height: currentUserProfile.height || 67,
        activityLevel: currentUserProfile.activityLevel || 'moderate',
        defaultGoal: selectedGoal || currentUserProfile.defaultGoal || 'General Wellness'
      };
      
      console.log('Using user profile for analysis:', {
        hasGender: !!completeUserProfile.gender,
        hasAge: !!completeUserProfile.age,
        hasWeight: !!completeUserProfile.weight,
        hasHeight: !!completeUserProfile.height,
        goal: completeUserProfile.defaultGoal
      });
      
      // 1. Upload image to Supabase
      console.log('Uploading image to storage...');
      const imageUrl = await uploadImageToSupabase(selectedImage);
      
      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }
      
      setUploadedUrl(imageUrl);
      console.log('Image uploaded successfully:', imageUrl.substring(0, 30) + '...');
      
      // 2. Analyze the uploaded image with the selected goal and user profile
      console.log('Analyzing image with goal:', selectedGoal || 'None specified');
      
      const result = await analyzeImage(
        imageUrl, 
        selectedGoal || completeUserProfile.defaultGoal,
        completeUserProfile // Pass complete user profile data for personalized analysis
      );
      
      if (!result || !result.success) {
        const errorMsg = result?.error || 'Analysis failed';
        console.error('Analysis failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log("Full API response received");
      
      // Verify that we have the essential data before proceeding
      if (!result.mealAnalysis) {
        console.error('Missing meal analysis data in response');
        throw new Error('Analysis response is missing required data');
      }
      
      // Ensure we at least have a meal name
      const mealNameToUse = mealName || result.mealAnalysis.mealName || 'My Meal';
      
      // Set the analysis result with the complete data structure
      const analysisData = {
        mealName: mealNameToUse,
        analysis: result.mealAnalysis
      };
      
      setAnalysisResult(analysisData);
      setAnalysisData(result.mealAnalysis);
      
      console.log("Analysis complete:", mealNameToUse);
    } catch (err) {
      console.error('Error during analysis:', err);
      
      // Provide more helpful error messages based on the error type
      if (err instanceof Error) {
        if (err.message.includes('upload')) {
          setError('Could not upload your image. Please check your internet connection and try again.');
        } else if (err.message.includes('format') || err.message.includes('size')) {
          setError('Image format not supported or file is too large. Please try a different image.');
        } else if (err.message.includes('timeout') || err.message.includes('network')) {
          setError('Network timeout. Please check your internet connection and try again.');
        } else {
          setError(err.message || 'An unexpected error occurred');
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      
      // Clear any partial analysis data to prevent inconsistent UI state
      setAnalysisResult(null);
      setAnalysisData(null);
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };
  
  // Reset the component state for a new analysis
  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setMealName('');
    setSelectedGoal(defaultGoal);
    setAnalysisResult(null);
    setAnalysisData(null);
    setError(null);
    
    // Also clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // If we have analysis results, show the analysis component
  if (analysisResult && analysisResult.analysis) {
    return (
      <div className="mt-8" data-component="food-analysis">
        <SimpleFoodAnalysis 
          imageUrl={uploadedUrl || previewUrl || undefined}
          goal={selectedGoal}
        />
        <div className="mt-6 flex justify-center">
          <Button onClick={handleReset} variant="outline">
            Analyze Another Meal
          </Button>
        </div>
      </div>
    );
  }
  
  // Show the component UI regardless of auth state
  return (
    <div className="max-w-4xl mx-auto p-4">
      {!analysisResult ? (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-center">Analyze Your Meal</h1>
          
          {!previewUrl ? (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 cursor-pointer transition-all"
                onClick={triggerFileInput}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                  data-testid="image-upload"
                />
                <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">Drag & drop an image here, or click to select</p>
                <p className="text-sm text-gray-500">Supported formats: JPEG, PNG, WebP</p>
              </div>
              
              <div className="text-center">
                <p>Or</p>
                <button
                  onClick={() => {
                    // Would integrate with device camera here
                    alert('Camera functionality would be implemented here');
                  }}
                  className="mt-2 flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
                >
                  <FaCamera className="mr-2" />
                  Take a Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image 
                  src={previewUrl} 
                  alt="Meal preview" 
                  fill 
                  className="object-cover" 
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="mealName" className="block text-sm font-medium text-gray-700">
                    Meal Name
                  </label>
                  <input
                    type="text"
                    id="mealName"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="E.g., Grilled Chicken Salad"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Meal'}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all"
                  >
                    <FaRedo />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Analysis Error: </strong>
              <span className="block sm:inline">{error}</span>
              <p className="mt-2 text-sm">This could be due to network issues or server load. Please try again.</p>
              <button 
                onClick={handleReset} 
                className="mt-3 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
              >
                Try Again
              </button>
            </div>
          )}
          
          {isAnalyzing && (
            <div className="text-center py-12">
              <LoadingSpinner size={48} />
              <p className="mt-4 text-lg">Analyzing your meal...</p>
              <p className="text-sm text-gray-500">This usually takes about 10-15 seconds</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <SimpleFoodAnalysis 
            imageUrl={uploadedUrl || previewUrl || undefined}
            goal={selectedGoal}
          />
          
          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset} className="rounded-md">
              Analyze Another Meal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 