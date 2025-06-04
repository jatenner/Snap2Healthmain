'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Camera, Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from './LoadingSpinner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/client/ClientAuthProvider';
import { useRouter } from 'next/navigation';

// Browser-compatible function to generate UUID-like random IDs
function generateRandomId() {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function() {
    return Math.floor(Math.random() * 16).toString(16);
  });
}

interface FoodUploadProps {
  onUpload: (file: File, goal: string) => void;
  isLoading?: boolean;
  preferredGoal?: string;
}

const FoodUpload: React.FC<FoodUploadProps> = ({ onUpload, isLoading = false, preferredGoal }) => {
  const [healthGoal, setHealthGoal] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(preferredGoal || 'General Wellness');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  // Suggested health goals that users can quickly select
  const suggestedHealthGoals = [
    'General Wellness',
    'Weight Loss',
    'Muscle Gain',
    'Heart Health',
    'Diabetes Management',
    'Energy Boost',
    'Kidney Health',
    'Immune Support'
  ];
  
  // Load default goal from user profile if available
  useEffect(() => {
    if (user?.user_metadata?.defaultGoal) {
      setHealthGoal(user.user_metadata.defaultGoal);
    } else {
      setHealthGoal('General Wellness');
    }
  }, [user]);
  
  // Handle file change
  const handleFileChange = useCallback((files: File[]) => {
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setUploadError(null);
      console.log(`File selected: ${selectedFile.name} (${selectedFile.size} bytes, ${selectedFile.type})`);
      
      // Call the onUpload prop if needed for backward compatibility
      if (onUpload) {
        onUpload(selectedFile, selectedGoal);
      }
    }
  }, [onUpload, selectedGoal]);
  
  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles.length);
    
    if (acceptedFiles.length > 0) {
      console.log(`Dropped file: ${acceptedFiles[0].name}, type: ${acceptedFiles[0].type}, size: ${acceptedFiles[0].size} bytes`);
      handleFileChange(acceptedFiles);
    } else {
      console.log("No valid files found in drop");
      setUploadError("No valid image files detected. Please try again with JPG, PNG, or WebP images.");
    }
  }, [handleFileChange]);
  
  // DragActive state handlers
  const onDragEnter = useCallback(() => {
    console.log("Drag enter detected");
    setDragActive(true);
  }, []);
  
  const onDragLeave = useCallback(() => {
    console.log("Drag leave detected");
    setDragActive(false);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false,
    disabled: isLoading,
    noClick: false, // Allow clicks to trigger file browser
    noKeyboard: false
  });
  
  // Sync external and internal drag state
  useEffect(() => {
    setDragActive(isDragActive);
  }, [isDragActive]);
  
  // Add direct click handler for the entire dropzone area
  const handleAreaClick = (e: React.MouseEvent) => {
    if (isLoading) return;
    
    // Don't interfere with button clicks
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    
    console.log("Upload area clicked");
    openFileDialog(e);
  };
  
  // Open file dialog directly via input element
  const openFileDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Browse Files button clicked");
    
    if (isLoading) {
      console.log("Upload button disabled - loading state active");
      return;
    }
    
    if (!fileInputRef.current) {
      console.error("File input reference is not available");
      return;
    }
    
    try {
      // Remove capture attribute to ensure it opens file browser
      fileInputRef.current.removeAttribute('capture');
      // Set accept attribute explicitly to ensure it works across browsers
      fileInputRef.current.accept = "image/*";
      // Ensure input is enabled
      fileInputRef.current.disabled = false;
      console.log("Opening file dialog...");
      fileInputRef.current.click();
    } catch (error) {
      console.error("Error opening file dialog:", error);
      setUploadError("Failed to open file browser. Please try again or use drag and drop.");
    }
  };
  
  // Open camera directly via input element with capture attribute
  const openCamera = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Take Photo button clicked");
    
    if (isLoading) {
      console.log("Upload button disabled - loading state active");
      return;
    }
    
    if (!fileInputRef.current) {
      console.error("File input reference is not available");
      return;
    }
    
    try {
      // Set accept attribute
      fileInputRef.current.accept = "image/*";
      // Add capture attribute to open camera
      fileInputRef.current.setAttribute('capture', 'environment');
      // Ensure input is enabled
      fileInputRef.current.disabled = false;
      console.log("Opening camera...");
      fileInputRef.current.click();
    } catch (error) {
      console.error("Error opening camera:", error);
      setUploadError("Failed to open camera. Please try again or use file upload instead.");
    }
  };
  
  // Direct file input handler for maximum compatibility
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    console.log("File input change detected");
    
    if (!event.target.files || event.target.files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    console.log(`Files selected: ${event.target.files.length}`);
    console.log(`First file: ${event.target.files[0].name}, type: ${event.target.files[0].type}, size: ${event.target.files[0].size} bytes`);
    
    handleFileChange(Array.from(event.target.files));
  };
  
  // When we receive analysis data
  const handleAnalysisResponse = (data) => {
    try {
      console.log('Analysis complete, received data:', {
        hasAnalysisResult: !!data?.analysisResult,
        hasAnalysisId: !!data?.analysisId,
        hasImageUrl: !!data?.imageUrl,
        hasAnalysisResultImageUrl: !!data?.analysisResult?.imageUrl
      });
      
      if (!data) {
        console.error('Invalid analysis response: no data received');
        setUploadError('Analysis failed: No response data received');
        return;
      }
      
      // Make sure we have a valid analysisId
      const analysisId = data.analysisId || generateRandomId();
      
      // Ensure analysisResult exists
      if (!data.analysisResult) {
        console.warn('Missing analysisResult in response, creating fallback');
        data.analysisResult = {
          imageUrl: data.imageUrl || null,
          mealName: "Meal Analysis",
          goal: selectedGoal,
          mealContents: [{ name: "Food item" }],
          analysis: {
            calories: 0,
            totalCalories: 0,
            macronutrients: [],
            micronutrients: []
          }
        };
      }

      // Extract image URL safely with fallbacks
      let imageUrl = null;
      
      // Try all possible image URL locations in order of preference
      if (data.imageUrl && typeof data.imageUrl === 'string') {
        imageUrl = data.imageUrl;
        console.log('Using top-level imageUrl');
      } else if (data.analysisResult?.imageUrl && typeof data.analysisResult.imageUrl === 'string') {
        imageUrl = data.analysisResult.imageUrl;
        console.log('Using analysisResult.imageUrl');
      } else if (file) {
        // Create a data URL from the file as fallback
        console.log('No imageUrl in response, creating from file');
        try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const fileImageUrl = e.target?.result as string;
            // Store image separately
            const imageData = {
              imageUrl: fileImageUrl
            };
            localStorage.setItem(`meal_image_${analysisId}`, JSON.stringify(imageData));
            sessionStorage.setItem(`meal_image_${analysisId}`, JSON.stringify(imageData));
            
            // Also store in the analysis result
            data.analysisResult.imageUrl = fileImageUrl;
            
            // Save the analysis result data
            const resultString = JSON.stringify(data.analysisResult);
            localStorage.setItem(`meal_analysis_${analysisId}`, resultString);
            sessionStorage.setItem(`meal_analysis_${analysisId}`, resultString);
            
            // Redirect
            router.push(`/meal-analysis?id=${analysisId}`);
          };
          return; // Exit early to wait for async FileReader
        } catch (fileReadError) {
          console.error('Error creating data URL from file:', fileReadError);
        }
      }
      
      // If we still don't have an imageUrl, use a transparent fallback image
      if (!imageUrl) {
        console.warn('⚠️ WARNING: No image URL found in the response after all fallbacks');
        
        // Create an absolutely minimal fallback
        imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMBAQCDWQGXAAAASUVORK5CYII=";
      }
      
      // Store the image URL separately
      const imageData = {
        imageUrl: imageUrl
      };
      localStorage.setItem(`meal_image_${analysisId}`, JSON.stringify(imageData));
      sessionStorage.setItem(`meal_image_${analysisId}`, JSON.stringify(imageData));
      console.log(`Stored image URL in storage: ${imageUrl.substring(0, 50)}...`);
      
      // Make sure imageUrl is included in the analysis result
      const analysisResult = {...data.analysisResult};
      if (!analysisResult.imageUrl) {
        analysisResult.imageUrl = imageUrl;
      }
      
      // Save the analysis result data in localStorage and sessionStorage
      const resultString = JSON.stringify(analysisResult);
      
      // Store in both generic and ID-specific keys for redundancy
      localStorage.setItem('meal_analysis_data', resultString);
      localStorage.setItem(`meal_analysis_${analysisId}`, resultString);
      
      // Also store in sessionStorage as backup
      sessionStorage.setItem('meal_analysis_data', resultString);
      sessionStorage.setItem(`meal_analysis_${analysisId}`, resultString);
      
      console.log(`Analysis data saved with ID: ${analysisId}`, {
        hasImageUrl: !!analysisResult.imageUrl,
        dataStoredInLocalStorage: true,
        dataStoredInSessionStorage: true
      });
      
      // Redirect to the analysis page
      router.push(`/meal-analysis?id=${analysisId}`);
    } catch (error) {
      console.error('Error handling analysis response:', error);
      setUploadError('Failed to process analysis result');
    }
  };
  
  // Handle file upload to server
  const handleUpload = async (file: File) => {
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('goal', selectedGoal);
      
      console.log(`Starting to upload meal image (${file.size} bytes, ${file.type}) with goal: ${selectedGoal}`);
      
      // Send the file to the server
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error uploading meal:', errorData);
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      console.log('Successfully uploaded and analyzed meal:', data);
      
      // Check if we received a valid response
      if (!data.success) {
        throw new Error('API returned unsuccessful response');
      }
      
      // Generate a random ID if none was provided
      if (!data.analysisId) {
        data.analysisId = generateRandomId();
      }
      
      // Ensure imageUrl is present somewhere in the response
      if (!data.imageUrl && (!data.analysisResult || !data.analysisResult.imageUrl)) {
        console.warn('⚠️ WARNING: No imageUrl in API response - creating fallback');
        
        // Create a data URL from the file as fallback
        try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            // Add imageUrl to both places for redundancy
            data.imageUrl = imageUrl;
            if (data.analysisResult) {
              data.analysisResult.imageUrl = imageUrl;
            } else {
              console.error('No analysisResult in API response, creating minimal structure');
              data.analysisResult = {
                imageUrl: imageUrl,
                mealName: "Food Analysis",
                goal: selectedGoal,
                mealContents: [{ name: "Unknown food item" }],
                analysis: {
                  calories: 0,
                  totalCalories: 0,
                  macronutrients: [],
                  micronutrients: []
                }
              };
            }
            handleAnalysisResponse(data);
          };
          return; // Exit early as we'll call handleAnalysisResponse in the onload callback
        } catch (fileReadError) {
          console.error('Error creating data URL from file:', fileReadError);
          // Continue with processing even without an image, add a tiny fallback image
          const fallbackImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMBAQCDWQGXAAAASUVORK5CYII=";
          data.imageUrl = fallbackImageUrl;
          if (data.analysisResult) {
            data.analysisResult.imageUrl = fallbackImageUrl;
          }
        }
      }
      
      // Process the analysis response
      handleAnalysisResponse(data);
    } catch (error) {
      console.error('Error uploading meal:', error);
      setUploadError(error.message || 'Failed to upload and analyze image');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle button click to upload and analyze
  const handleAnalyzeClick = () => {
    if (file) {
      handleUpload(file);
    } else {
      setUploadError('Please select a file to upload.');
    }
  };
  
  return (
    <div className="w-full">
      {/* Health Goal Free Text Input */}
      <div className="mb-6">
        <label className="block text-blue-100 text-lg font-medium mb-2">
          Your Health Goal
        </label>
        <input
          type="text"
          value={healthGoal}
          onChange={(e) => setHealthGoal(e.target.value)}
          placeholder="Enter your health goal..."
          className="w-full px-4 py-3 rounded-lg text-sm font-medium mb-3 
                    bg-darkBlue-secondary border border-darkBlue-accent/50 
                    text-white focus:border-cyan-accent focus:ring-1 focus:ring-cyan-accent
                    placeholder-blue-100/50"
          disabled={isLoading}
        />
        
        {/* Suggested health goals */}
        <div className="mb-2">
          <p className="text-xs text-blue-100/70 mb-2">Suggested goals:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedHealthGoals.map((goal) => (
              <button
                key={goal}
                type="button"
                className="px-3 py-1 rounded-full text-xs font-medium bg-darkBlue-accent/20 
                          text-blue-100/80 hover:bg-darkBlue-accent/40 transition"
                onClick={() => setHealthGoal(goal)}
                disabled={isLoading}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Hidden file input with direct handlers for maximum compatibility */}
      <input 
        type="file"
        ref={fileInputRef} 
        accept="image/*"
        onChange={handleInputChange}
        disabled={isLoading}
        style={{ display: 'none' }}
        id="file-upload-input"
        data-testid="file-upload-input"
      />
      
      {/* Upload Area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive ? 'border-cyan-accent bg-cyan-accent/10' : 'border-darkBlue-accent/40 hover:border-cyan-accent/50'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={handleAreaClick}
      >
        <input {...getInputProps()} />
        
        {isLoading ? (
          <div className="py-6">
            <LoadingSpinner size="medium" color="cyan" text="Analyzing your meal..." />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center p-6">
              <div className="bg-darkBlue-accent/20 p-4 rounded-full mb-4">
                <Camera size={32} className="text-cyan-accent" />
              </div>
              <h3 className="text-lg font-medium text-blue-100 mb-2">Upload your meal photo</h3>
              <p className="text-blue-100/70 mb-4 text-sm">
                Drag & drop a file here, or use the buttons below
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="px-5 py-3 bg-gradient-to-br from-cyan-accent to-cyan-500 text-black font-medium rounded-lg hover:shadow-lg hover:from-cyan-400 hover:to-cyan-500 transition"
                  onClick={openFileDialog}
                  disabled={isLoading}
                >
                  Browse Files
                </button>
                <button
                  type="button"
                  className="px-5 py-3 bg-gradient-to-br from-green-400 to-green-600 text-black font-medium rounded-lg hover:shadow-lg hover:from-green-300 hover:to-green-500 transition flex items-center justify-center"
                  onClick={openCamera}
                  disabled={isLoading}
                >
                  <Camera size={16} className="mr-1" />
                  Take Photo
                </button>
              </div>
            </div>
            <p className="text-xs text-blue-100/50 mt-2">
              Supported formats: JPG, PNG, WebP
            </p>
            
            {/* Error message */}
            {uploadError && (
              <div className="mt-4 p-2 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm">
                {uploadError}
              </div>
            )}
            
            {/* Button row */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-xs text-blue-100/70">
                {file ? file.name : 'No file selected'}
              </div>
              <button
                type="button"
                onClick={handleAnalyzeClick}
                disabled={!file || isLoading || isUploading}
                className={`px-4 py-2 font-medium rounded-lg ${
                  !file || isLoading || isUploading
                  ? 'bg-darkBlue-accent/30 text-blue-100/50 cursor-not-allowed'
                  : 'bg-gradient-to-br from-cyan-accent to-cyan-500 text-black hover:shadow-lg hover:from-cyan-400 hover:to-cyan-500'
                }`}
              >
                {isLoading || isUploading ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="small" color="blue" />
                    <span className="ml-2">Analyzing...</span>
                  </span>
                ) : (
                  'Analyze Meal'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FoodUpload; 