'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Camera, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Add type declaration for window with custom properties
declare global {
  interface Window {
    currentUserProfile?: {
      id?: string;
      full_name?: string;
      goal?: string;
      activity_level?: string;
      age?: number;
      gender?: string;
      height?: number;
      weight?: number;
      [key: string]: any;
    };
  }
}

export default function UploadClient() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<string>('');
  const [defaultGoal, setDefaultGoal] = useState<string>('General Health');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  
  // Safe wrapper for progress updates to prevent crashes
  const updateProgress = (message: string | null) => {
    try {
      setUploadProgress(message);
    } catch (e) {
      console.error('Failed to update progress:', e);
    }
  };

  // Load profile data to get default goal
  useEffect(() => {
    try {
      // Try to get profile from global variable first (set by our fix scripts)
      if (window.currentUserProfile?.goal) {
        setDefaultGoal(window.currentUserProfile.goal);
        return;
      }
      
      // Try profile_backup in localStorage if global var isn't available
      const profileData = localStorage.getItem('profile_backup');
      if (profileData) {
        const profile = JSON.parse(profileData);
        if (profile && profile.goal) {
          setDefaultGoal(profile.goal);
        }
      }
    } catch (e) {
      console.error('Error loading profile goal:', e);
    }
  }, []);
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  // Process the selected file
  const handleFile = (file: File) => {
    // Only process image files
    if (!file.type.match('image.*')) {
      setError('Please upload an image file');
      return;
    }
    
    setFile(file);
    setError(null);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        setPreviewUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Open file select dialog
  const openFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Open camera
  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };
  
  // Handle goal input change
  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoal(e.target.value);
  };
  
  // Submit the form
  const handleSubmit = async () => {
    // Add a log here to check the file state
    console.log('[UploadClient] handleSubmit called. Current file state:', file);

    if (!file) {
      toast.error("Please select an image first");
      // Also set the local error state to display it in the UI
      setError("Please select an image first. Click or drag to upload."); 
      setIsUploading(false); // Ensure loading state is reset
      updateProgress(null); // Clear any progress message
      return;
    }

    // Create a tracking ID for this upload
    const clientGeneratedMealId = uuidv4();
    console.log(`[UploadClient] Generated clientMealId: ${clientGeneratedMealId}`);
    
    setIsUploading(true);
    updateProgress('Preparing upload...');

    try {
      // Get the Supabase session token for authentication
      const supabase = createClientComponentClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.warn('[UploadClient] No authentication token available, proceeding in anonymous mode for API call, though endpoint might require auth.');
      }

      updateProgress('Preparing upload...');

      // API endpoint definition
      const apiUrl = '/api/analyze-meal';

      // Create FormData
      const formData = new FormData();
      formData.append('file', file); // Append the actual file
      formData.append('goal', goal.trim() || defaultGoal);
      formData.append('mealName', clientGeneratedMealId); // Assuming clientGeneratedMealId is suitable for mealName
      // If you have other metadata to send, append it here, e.g.,
      // formData.append('clientId', clientGeneratedMealId);

      // Create headers. FormData will set Content-Type automatically, but auth header is needed.
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      updateProgress('Uploading image and analyzing meal...');

      // Send to API endpoint with FormData
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers, // FormData sets its own Content-Type, avoid manually setting it to application/json
        body: formData 
      });

      if (!response.ok) {
        console.error('[UploadClient] Server error:', response);
        toast.error('Failed to process server response. Check console for details.');
        setError(`Server returned an error (status ${response.status}). Check console.`);
        setIsUploading(false);
        updateProgress(null);
        return;
      }
      
      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (jsonError: any) {
        console.error('[UploadClient] Failed to parse JSON response:', jsonError);
        const responseText = await response.text(); // Attempt to get raw text for logging
        console.error('[UploadClient] Raw server response:', responseText);
        toast.error('Failed to process server response. Check console for details.');
        setError(`Server returned an unparsable response (status ${response.status}). Check console.`);
        setIsUploading(false);
        updateProgress(null);
        return;
      }

      if (!data.success) {
        console.error('[UploadClient] Analysis failed:', data);
        toast.error(data.error || 'Analysis failed');
        setError(data.error || 'An unexpected error occurred during analysis.');
        setIsUploading(false);
        updateProgress(null);
        return;
      }
      
      // Check if the server indicated a database save failure
      if (data.dbSaved === false) {
        console.warn('[UploadClient] Analysis was successful, but DB save failed on server:', data.dbSaveError);
        toast.error('Analysis complete, but saving failed. Data might be temporary.');
        // Proceed to redirect, as analysis data is available in 'data.data'
      }

      updateProgress('Processing results...');

      // Ensure we use the ID that was sent to the server for navigation
      const navigationId = data.mealId || data.data?.id || clientGeneratedMealId;
      console.log(`[UploadClient] Navigating with ID: ${navigationId}`);
      
      // Store the meal data in localStorage as a fallback or for quick access
      if (data.data) {
        try {
          localStorage.setItem(`meal_${navigationId}`, JSON.stringify(data.data));
          console.log(`[UploadClient] Cached meal data to localStorage for ID: ${navigationId}`);
        } catch (e) {
          console.warn('[UploadClient] Could not cache meal data to localStorage:', e);
        }
      }

      updateProgress('Redirecting to analysis...');
      router.push(`/analysis/${navigationId}`);

    } catch (err: any) {
      console.error('[UploadClient] Error during upload:', err);
      toast.error(err.message || 'Upload failed');
      setError(err.message || 'An unexpected error occurred during upload.');
      setIsUploading(false);
      updateProgress(null);
    }
  };
  
  // View sample analysis
  const viewSample = () => {
    router.push('/meal-analysis?id=demo-meal');
  };
  
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Upload Your Meal</h1>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <p className="text-gray-300 text-center mb-6">
              Upload a photo of your meal to get instant nutritional analysis
            </p>
            
            <div 
              className={`border-2 border-dashed ${dragActive ? 'border-blue-500 bg-blue-900/10' : 'border-gray-600'} rounded-lg p-8 text-center`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="mb-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg" 
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-4">Drag and drop your photo here, or use options below</p>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/*"
                className="hidden"
              />
              
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  className="px-4 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 flex items-center"
                  onClick={openFileSelect}
                  disabled={isUploading}
                  type="button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </button>
                
                <button
                  className="px-4 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 flex items-center"
                  onClick={openCamera}
                  disabled={isUploading}
                  type="button"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </button>
              </div>
              
              {previewUrl && (
                <div className="mt-5">
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Target className="h-4 w-4 text-gray-400 mr-2" />
                      <label htmlFor="goal" className="text-gray-300 text-sm">
                        Analysis Goal (optional)
                      </label>
                    </div>
                    <input
                      type="text"
                      id="goal"
                      value={goal}
                      onChange={handleGoalChange}
                      placeholder={`Default: ${defaultGoal}`}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Leave blank to use your profile's default goal
                    </p>
                  </div>
                  
                  <button
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                    onClick={handleSubmit}
                    disabled={isUploading}
                    type="button"
                  >
                    {isUploading ? 'Analyzing...' : 'Analyze Meal'}
                  </button>
                </div>
              )}
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress status */}
          {uploadProgress && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-3">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-blue-200 text-sm">{uploadProgress}</p>
              </div>
            </div>
          )}
          
          <div className="text-center mb-8">
            <p className="text-gray-400 mb-4">For demonstration purposes, you can view a sample analysis below:</p>
            
            <button 
              className="inline-block px-8 py-3 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition-colors"
              onClick={viewSample}
              type="button"
            >
              View Example Analysis
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Tips for Better Analysis</h2>
            
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span className="text-gray-300">Take photos in good lighting for better food recognition</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span className="text-gray-300">Ensure all items are visible in the frame</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span className="text-gray-300">Use a consistent angle (top-down works best)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span className="text-gray-300">Avoid excessive shadows or reflections</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 