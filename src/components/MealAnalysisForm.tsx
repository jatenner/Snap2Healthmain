'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { uploadImageToSupabase } from '@/lib/uploadImageToSupabase';
import { analyzeImage } from '@/lib/analyzeImage';
import { SearchParams } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileImage, Upload, Trash2 } from 'lucide-react';
import FoodAnalysis from './FoodAnalysis';

type FormState = 'idle' | 'uploading' | 'analyzing' | 'results' | 'error';

export function MealAnalysisForm({ searchParams }: { searchParams: SearchParams }) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // If we have analysis data in URL parameters, parse and set it
  React.useEffect(() => {
    if (searchParams.success === 'true' && searchParams.data) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(searchParams.data));
        setAnalysisResult(decodedData);
        setFormState('results');
      } catch (err) {
        console.error('Error parsing analysis data:', err);
        setError('Failed to load analysis data');
      }
    }
  }, [searchParams]);
  
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setError(null);
    
    // Clean up the previous URL
    return () => URL.revokeObjectURL(objectUrl);
  }, []);
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }
    
    try {
      setFormState('uploading');
      setError(null);
      
      // Use the mock analysis directly instead of trying to upload 
      // the image to Supabase and then analyze it
      setFormState('analyzing');
      
      // Simulate a delay to show the analyzing state
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response
      const mockResult = {
        success: true,
        mealId: 'mock-meal-id',
        mealContents: {
          foods: [
            { name: 'Oranges', amount: '4-5 medium' },
            { name: 'Citrus Fruits', amount: 'basket' }
          ]
        },
        mealAnalysis: {
          mealName: 'Fresh Oranges',
          calories: 250,
          macronutrients: [
            { name: 'Protein', amount: 5, unit: 'g', percentDailyValue: 10 },
            { name: 'Carbohydrates', amount: 60, unit: 'g', percentDailyValue: 20 },
            { name: 'Fat', amount: 0.5, unit: 'g', percentDailyValue: 1 },
            { name: 'Fiber', amount: 12, unit: 'g', percentDailyValue: 48 }
          ],
          micronutrients: [
            { name: 'Vitamin C', amount: 280, unit: 'mg', percentDailyValue: 311 },
            { name: 'Folate', amount: 120, unit: 'mcg', percentDailyValue: 30 },
            { name: 'Potassium', amount: 800, unit: 'mg', percentDailyValue: 17 },
            { name: 'Calcium', amount: 120, unit: 'mg', percentDailyValue: 12 }
          ],
          benefits: [
            'Excellent source of vitamin C supporting immune function',
            'Contains antioxidants that help reduce inflammation',
            'Good source of dietary fiber for digestive health',
            'Natural sugars provide quick energy'
          ],
          concerns: [
            'Low protein content - insufficient for muscle recovery alone',
            'Acidic nature may cause digestive discomfort for some people'
          ],
          suggestions: [
            'Pair with a protein source like Greek yogurt or nuts',
            'Include some healthy fats like avocado or nut butter for a more balanced meal',
            'Consider adding other fruits for variety of nutrients',
            'Eat whole oranges rather than just juice to retain fiber content'
          ]
        }
      };
      
      // Set the results
      setAnalysisResult(mockResult);
      setFormState('results');
      
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setFormState('error');
    }
  };
  
  const handleSave = async () => {
    if (!analysisResult) return;
    
    try {
      // In a real app, save the analysis to a database
      // For now, let's just simulate a save
      console.log('Saving analysis:', analysisResult);
      
      // Redirect to history page
      router.push('/history');
    } catch (err) {
      setError('Failed to save analysis');
    }
  };
  
  const handleNewAnalysis = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setFormState('idle');
    setError(null);
    
    // Remove URL parameters by navigating to the clean page
    router.replace('/meal-analysis');
  };
  
  // If we have analysis results, show them
  if (formState === 'results' && analysisResult) {
    return (
      <FoodAnalysis
        imageUrl={previewUrl || '/placeholder-image.jpg'} 
        mealName="Your Meal"
        analysis={analysisResult.mealAnalysis || {}}
        onReset={handleNewAnalysis}
      />
    );
  }
  
  return (
    <div className="max-w-md mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {/* Image Preview/Upload */}
          <div className="mb-6">
            {previewUrl ? (
              <div className="relative w-full aspect-square mb-4">
                <Image
                  src={previewUrl}
                  alt="Food preview"
                  fill
                  className="object-cover rounded-md"
                />
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-4">
                <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 mb-2">Select an image to analyze</p>
                <p className="text-xs text-gray-400">Supported formats: JPG, PNG, WEBP</p>
              </div>
            )}
            
            <div className="flex gap-4">
              <input
                type="file"
                id="food-image"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={formState === 'uploading' || formState === 'analyzing'}
              />
              <label
                htmlFor="food-image"
                className="flex-1"
              >
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  disabled={formState === 'uploading' || formState === 'analyzing'}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {previewUrl ? 'Change Image' : 'Select Image'}
                </Button>
              </label>
              
              <Button
                type="button"
                disabled={!selectedFile || formState === 'uploading' || formState === 'analyzing'}
                className="flex-1"
                onClick={handleUpload}
              >
                {formState === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : formState === 'analyzing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Image'
                )}
              </Button>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-800 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 