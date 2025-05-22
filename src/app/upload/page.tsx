'use client';

<<<<<<< HEAD
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function UploadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
      <p className="ml-2 text-gray-600">Redirecting to upload page...</p>
=======
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { uploadMealImage } from '../../lib/uploadImageToSupabase';

// Define error response types
interface ApiErrorResponse {
  error: string;
  errorType?: string;
  details?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [goal, setGoal] = useState<string>('General Wellness');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [useCustomGoal, setUseCustomGoal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Use user's default goal if available
  useEffect(() => {
    if (user?.user_metadata?.defaultGoal) {
      // Check if it's one of the predefined goals
      const predefinedGoals = ['Weight Loss', 'Muscle Gain', 'Heart Health', 'Diabetes Management', 'General Wellness'];
      const userGoal = user.user_metadata.defaultGoal;
      
      if (predefinedGoals.includes(userGoal)) {
        setGoal(userGoal);
        setUseCustomGoal(false);
      } else {
        setCustomGoal(userGoal);
        setUseCustomGoal(true);
      }
    }
  }, [user]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      
      // Clear any previous errors
      setError(null);
      setErrorDetails(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug collection
    const debugData: string[] = [];
    debugData.push(`Submit time: ${new Date().toISOString()}`);
    debugData.push(`User: ${user ? user.id : 'Not logged in'}`);
    
    // Validate input
    if (!file) {
      setError('Please upload an image of your meal');
      debugData.push('Error: No file selected');
      setDebugInfo(debugData.join('\n'));
      return;
    }
    
    debugData.push(`File: ${file.name}, ${file.type}, ${Math.round(file.size/1024)}KB`);
    
    // Validate goal
    const finalGoal = useCustomGoal ? customGoal.trim() : goal;
    if (useCustomGoal && !customGoal.trim()) {
      setError('Please enter your health goal');
      debugData.push('Error: No goal specified');
      setDebugInfo(debugData.join('\n'));
      return;
    }
    
    debugData.push(`Goal: ${finalGoal}`);
    
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Use appropriate goal
      formData.append('goalId', finalGoal);
      
      // Handle file upload and get image URL
      let imageUrl = '';
      if (file && user) {
        console.log('Uploading image for user:', user.id);
        debugData.push(`Starting upload for user: ${user.id}`);
        try {
          // Upload to Supabase storage and get public URL
          imageUrl = await uploadMealImage(file, user.id);
          console.log('Image uploaded successfully:', imageUrl);
          debugData.push(`Image uploaded: ${imageUrl}`);
          formData.append('imageUrl', imageUrl);
        } catch (uploadError: any) {
          debugData.push(`Upload error: ${uploadError.message}`);
          console.error('Error uploading to Supabase:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
      } else {
        console.warn('Missing user or file:', { hasUser: !!user, hasFile: !!file });
        debugData.push(`Missing: user=${!!user}, file=${!!file}`);
        if (!user) {
          setError('You must be logged in to upload images');
          setIsLoading(false);
          setDebugInfo(debugData.join('\n'));
          return;
        }
      }
      
      // Add file for AI processing
      if (file) {
        formData.append('image', file);
      }
      
      // Add user ID if logged in
      if (user) {
        console.log('Adding user ID to form data:', user.id);
        formData.append('userId', user.id);
      }
      
      // Submit to API
      console.log('Submitting to API...');
      debugData.push('Submitting to API...');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      debugData.push(`API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiErrorResponse;
        debugData.push(`API error: ${JSON.stringify(errorData)}`);
        
        // Set main error message
        setError(errorData.error || 'Failed to analyze food');
        
        // Set additional details if available
        if (errorData.details) {
          setErrorDetails(errorData.details);
        }
        
        setDebugInfo(debugData.join('\n'));
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      debugData.push(`API success - savedToDatabase: ${data.savedToDatabase}`);
      debugData.push(`Caption: ${data.caption}`);
      
      // Store successful result
      setAnalysisResult(data);
      
      // Redirect to meal-analysis page with result
      if (data.savedToDatabase && data.mealId) {
        // If saved to database, use the meal ID
        router.push(`/meal-analysis?id=${encodeURIComponent(data.mealId || '')}`);
      } else {
        // If database save failed, encode the data in the URL
        const encodedData = encodeURIComponent(JSON.stringify(data));
        router.push(`/meal-analysis?data=${encodedData}`);
      }
    } catch (error: any) {
      console.error('Error analyzing meal:', error);
      debugData.push(`Error: ${error.message}`);
      setError('Failed to analyze your meal. Please try again.');
      setErrorDetails(error.message);
    } finally {
      setIsLoading(false);
      setDebugInfo(debugData.join('\n'));
    }
  };

  // Function to get a more specific helper message based on the error
  const getErrorHelperMessage = () => {
    if (error?.includes('OpenAI API key is invalid')) {
      return 'This is a configuration issue. Please try again later or contact support at support@snap2health.com.';
    }
    if (error?.includes('limit of AI requests')) {
      return 'Our service is experiencing high demand. Please wait a few minutes and try again.';
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-center mb-6">Analyze Your Food</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Health Goal
          </label>
          
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="radio"
              id="predefined-goal"
              checked={!useCustomGoal}
              onChange={() => setUseCustomGoal(false)}
              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="predefined-goal" className="text-sm text-gray-700">
              Choose from common goals
            </label>
          </div>
          
          {!useCustomGoal && (
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Heart Health">Heart Health</option>
              <option value="Diabetes Management">Diabetes Management</option>
              <option value="General Wellness">General Wellness</option>
            </select>
          )}
          
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="radio"
              id="custom-goal"
              checked={useCustomGoal}
              onChange={() => setUseCustomGoal(true)}
              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="custom-goal" className="text-sm text-gray-700">
              Enter your specific health goal
            </label>
          </div>
          
          {useCustomGoal && (
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="E.g., Managing cholesterol, improving energy levels, reducing inflammation..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          )}
        </div>
        
        {/* Image Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {previewUrl ? (
            <div className="relative h-64 w-full mb-4">
              <Image
                src={previewUrl}
                alt="Food preview"
                fill
                style={{ objectFit: 'contain' }}
                className="rounded-md"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setError(null);
                  setErrorDetails(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <label
                htmlFor="image-upload"
                className="mt-2 block text-sm font-medium text-indigo-600 cursor-pointer"
              >
                Take a photo or upload an image of your meal
              </label>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                {errorDetails && <p className="mt-1 text-xs text-red-700">{errorDetails}</p>}
                {getErrorHelperMessage() && (
                  <p className="mt-2 text-sm text-red-700">{getErrorHelperMessage()}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !file}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="small" className="mr-2" />
              Analyzing...
            </>
          ) : (
            'Analyze My Food'
          )}
        </button>
      </form>

      {debugInfo && (
        <div className="mt-8 border-t pt-4">
          <details className="text-xs">
            <summary className="text-gray-500 cursor-pointer">Debug Info</summary>
            <div className="mt-2 p-4 bg-gray-100 rounded whitespace-pre-wrap font-mono text-xs">
              {debugInfo}
            </div>
          </details>
        </div>
      )}
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
    </div>
  );
} 