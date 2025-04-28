'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [formData, setFormData] = useState({
    mealName: '',
    goal: '',
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    
    // Read the file as a data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError('Please upload an image of your meal.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      console.log("Starting meal analysis...");
      console.log("Image file:", {
        name: imageFile.name,
        type: imageFile.type,
        size: `${(imageFile.size / 1024).toFixed(2)} KB`,
      });
      
      const formDataToSend = new FormData();
      formDataToSend.append('image', imageFile);
      formDataToSend.append('mealName', formData.mealName);
      formDataToSend.append('goal', formData.goal);
      
      console.log("Sending data to API...", {
        mealName: formData.mealName || '(None provided)',
        goal: formData.goal || '(None provided)'
      });
      
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: formDataToSend,
      });
      
      console.log("API response status:", response.status);
      
      const data = await response.json();
      console.log("API response data:", data);
      
      setApiResponse(data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze meal');
      }
      
      // Check if we need to use localStorage as a fallback
      if (data.useLocalStorage && data.mealData) {
        console.log("Using localStorage fallback as directed by the API");
        
        // Store the data in localStorage for the client-side component to retrieve
        localStorage.setItem('mealData', JSON.stringify(data.mealData));
        console.log("Meal data saved to localStorage");
      }
      
      // Explicitly log before redirect
      console.log("Analysis successful, redirecting to results page...");
      
      // Add a small delay before redirect to ensure logs are visible
      setTimeout(() => {
        router.push('/meal-analysis');
      }, 500);
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Snap2Health</h1>
          <p className="text-gray-600 mt-2">Take a photo of your meal and get instant nutritional analysis</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload a meal photo
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => document.getElementById('mealImage')?.click()}
            >
              {imageSrc ? (
                <div className="relative w-full aspect-square max-h-64 mx-auto">
                  <Image 
                    src={imageSrc} 
                    alt="Meal preview" 
                    fill
                    className="object-contain" 
                  />
                </div>
              ) : (
                <div className="py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Click to upload a photo of your meal</p>
                </div>
              )}
              <input
                id="mealImage"
                name="mealImage" 
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>
          
          {/* Meal Name */}
          <div>
            <label htmlFor="mealName" className="block text-sm font-medium text-gray-700 mb-1">
              Meal Name (optional)
            </label>
            <input
              type="text"
              id="mealName"
              name="mealName"
              value={formData.mealName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="E.g., Breakfast, Chicken Salad, etc."
            />
          </div>
          
          {/* Dietary Goal */}
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
              Your Dietary Goal (optional)
            </label>
            <select
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a goal (optional)</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Overall Health">Overall Health</option>
            </select>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm">
              <p className="font-bold">Error: {error}</p>
              {apiResponse && (
                <pre className="mt-2 bg-red-50 p-2 text-xs overflow-auto max-h-32 rounded">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              )}
            </div>
          )}
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing your meal...
              </div>
            ) : (
              'Analyze My Meal'
            )}
          </button>
        </form>
      </div>
    </main>
  );
} 