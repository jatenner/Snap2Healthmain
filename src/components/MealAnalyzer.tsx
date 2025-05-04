"use client";

import { useState } from 'react';
import { Loader2, Camera, Upload } from 'lucide-react';
import Image from 'next/image';
import NutritionResults from './NutritionResults';

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface FoodItem {
  name: string;
  quantity: string;
  nutrition: Nutrition;
}

type AnalysisResults = {
  foods: FoodItem[];
  totalNutrition: Nutrition;
  healthInsights: string[];
};

export default function MealAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, etc.)');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size exceeds 5MB limit');
        return;
      }
      
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
    }
  };

  const handleCaptureImage = () => {
    // Trigger the file input click programmatically
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Upload the image
      const formData = new FormData();
      formData.append('file', selectedImage);
      
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const { imageUrl } = await uploadResponse.json();
      setIsUploading(false);
      
      // Analyze the meal
      setIsAnalyzing(true);
      const analysisResponse = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });
      
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      const analysisResults = await analysisResponse.json();
      setResults(analysisResults);
      
    } catch (err) {
      console.error('Error analyzing meal:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold">
            {results ? 'Meal Analysis Results' : 'Upload or Take a Photo of Your Meal'}
          </h2>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {!results ? (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {previewUrl ? (
                  <div className="relative h-64 w-full overflow-hidden rounded-md">
                    <Image 
                      src={previewUrl} 
                      alt="Selected meal image" 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Drag and drop an image, or click to select
                    </p>
                  </div>
                )}
                
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={handleCaptureImage} 
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Select Image
                </button>
                
                <button 
                  onClick={analyzeImage} 
                  disabled={!selectedImage || isUploading || isAnalyzing}
                  className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center ${
                    (!selectedImage || isUploading || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {(isUploading || isAnalyzing) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Analyze Meal'}
                </button>
              </div>
            </div>
          ) : (
            <NutritionResults results={results} imageUrl={previewUrl} />
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          {results && (
            <button 
              onClick={resetAnalysis} 
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Analyze Another Meal
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 