'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/auth';
import { formatMealDate } from '../utils/formatMealTime';
import { Loader2, Camera, Upload } from 'lucide-react';
import { useRef } from 'react';

interface MealImage {
  publicUrl: string;
  name: string;
  createdAt: string;
}

interface MealImageUploaderProps {
  onAnalysisComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  goalOptions?: string[];
  defaultGoal?: string;
  showPreview?: boolean;
}

export function MealImageUploader({
  onAnalysisComplete,
  onError,
  goalOptions = [
    'General Wellness',
    'Weight Loss',
    'Muscle Gain',
    'Heart Health',
    'Diabetes Management'
  ],
  defaultGoal = 'General Wellness',
  showPreview = true,
}: MealImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [goal, setGoal] = useState(defaultGoal);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP, HEIC)');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size exceeds 10MB limit');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      
      // Clear any previous errors
      setErrorMessage(null);
      setSelectedFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };
  
  // Open file browser
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload and analyze the image
  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select an image first');
      return;
    }
    
    setIsUploading(true);
    setErrorMessage(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('goal', goal);
      
      // Send to the unified API endpoint
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      const result = await response.json();
      
      // Call the success callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
      
      return result;
    } catch (error) {
      console.error('Error analyzing image:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      
      // Call the error callback if provided
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Reset the component
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-4">
        {/* Image preview/upload area */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={triggerFileInput}
        >
          {showPreview && previewUrl ? (
            <div className="relative w-full aspect-square max-h-64 mx-auto overflow-hidden rounded-md">
              <img 
                src={previewUrl} 
                alt="Food preview" 
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <Camera className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                Click to take a photo or upload an image
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
        
        {/* Goal selection */}
        <div className="space-y-2">
          <label htmlFor="goal" className="block text-sm font-medium">
            Health Goal
          </label>
          <select
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isUploading}
          >
            {goalOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        
        {/* Error message */}
        {errorMessage && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
            {errorMessage}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleReset}
            disabled={!selectedFile || isUploading}
          >
            Reset
          </Button>
          <Button 
            type="button"
            onClick={handleUploadAndAnalyze}
            disabled={!selectedFile || isUploading}
            className="flex items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MealImageGallery() {
  const { user } = useAuth();
  const [images, setImages] = useState<MealImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMealImages();
    }
  }, [user]);

  async function fetchMealImages() {
    try {
      setLoading(true);
      
      if (!user) {
        setError("User must be logged in to view images");
        setLoading(false);
        return;
      }
      
      // Fetch images from user's specific directory
      const { data: userFiles, error: userError } = await supabase
        .storage
        .from('meal-images')
        .list(`users/${user.id}`, {
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (userError) {
        console.error('Error fetching user images:', userError);
        // Don't throw here, we'll just continue and try to get any images
      }
      
      let allImageFiles: any[] = [];
      
      // Add user-specific files if they exist
      if (userFiles && userFiles.length > 0) {
        const userImageFiles = userFiles.filter(file => 
          !file.name.endsWith('/') && 
          file.name.match(/\.(jpeg|jpg|png|gif|webp)$/i)
        );
        
        allImageFiles = [...userImageFiles.map(file => ({
          ...file,
          path: `users/${user.id}/${file.name}`
        }))];
      }
      
      // Extract date from filename or use created_at
      const extractDateFromFilename = (filename: string): string => {
        // Try to extract timestamp from filename pattern like "1745640110410-dinner3.jpeg"
        const match = filename.match(/^(\d+)-/);
        if (match && match[1]) {
          const timestamp = parseInt(match[1]);
          if (!isNaN(timestamp)) {
            // Check if timestamp is in milliseconds (13 digits) or seconds (10 digits)
            const adjustedTimestamp = timestamp.toString().length <= 10 
              ? timestamp * 1000  // Convert seconds to milliseconds
              : timestamp;
              
            const date = new Date(adjustedTimestamp);
            const currentYear = new Date().getFullYear();
            const currentDate = new Date();
            
            // Validate the year is reasonable (not in future)
            if (date.getFullYear() >= 2020 && date.getFullYear() <= currentYear) {
              console.log(`Valid timestamp extracted from filename: ${filename} -> ${date.toISOString()}`);
              return date.toISOString();
            } else if (date.getFullYear() > currentYear) {
              console.warn(`Future year detected in filename timestamp: ${date.getFullYear()}, using today's date`);
              return currentDate.toISOString();
            } else {
              console.log(`Unrealistic year in filename timestamp: ${date.getFullYear()}, using current date`);
              return currentDate.toISOString();
            }
          }
        }
        
        // If we can't extract a valid date, use current date
        console.log(`Couldn't extract valid date from filename: ${filename}, using current date`);
        return new Date().toISOString();
      };
      
      // Convert file paths to public URLs with date information
      const imageUrls = allImageFiles.map(file => {
        const { data } = supabase
          .storage
          .from('meal-images')
          .getPublicUrl(file.path);
          
        console.log(`Generated URL for ${file.path}:`, data.publicUrl);
        
        return {
          publicUrl: data.publicUrl,
          name: file.name,
          createdAt: file.created_at || extractDateFromFilename(file.name)
        };
      });
      
      // Sort by date, newest first
      imageUrls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setImages(imageUrls);
    } catch (err: any) {
      console.error('Error fetching meal images:', err);
      setError(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }

  function openModal(url: string) {
    setSelectedImage(url);
  }

  function closeModal() {
    setSelectedImage(null);
  }
  
  // Format date to a short readable format
  function formatDate(dateString: string) {
    return formatMealDate(dateString);
  }

  // Placeholder SVG for failed images
  const placeholderImage = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.44-6.19l-2.35 3.02-1.56-1.88c-.2-.25-.58-.24-.78.01l-1.74 2.23c-.2.25-.02.61.29.61h8.98c.28 0 .48-.34.28-.59l-2.55-3.21c-.2-.25-.58-.24-.77.02z'/%3E%3C/svg%3E`;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-56">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg my-4">
        <p className="font-medium">Error loading images</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={fetchMealImages}
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md text-sm"
        >
          Try again
        </button>
      </div>
    );
  }
  
  if (images.length === 0) {
    return (
      <div className="bg-blue-50 text-blue-700 p-4 rounded-lg my-4">
        <p>No meal images found. Upload your first meal to get started!</p>
      </div>
    );
  }

  // Group images by date (year-month-day)
  const groupImagesByDate = () => {
    const groupedImages: {[key: string]: MealImage[]} = {};
    
    images.forEach(image => {
      try {
        // Create date object and validate
        const date = new Date(image.createdAt);
        if (isNaN(date.getTime())) {
          // Handle invalid date
          const fallbackKey = 'Invalid date';
          if (!groupedImages[fallbackKey]) {
            groupedImages[fallbackKey] = [];
          }
          groupedImages[fallbackKey].push(image);
          return;
        }
        
        // Format as YYYY-MM-DD for grouping
        const dateKey = date.toISOString().split('T')[0];
        if (!groupedImages[dateKey]) {
          groupedImages[dateKey] = [];
        }
        groupedImages[dateKey].push(image);
      } catch (error) {
        console.error(`Error processing image date:`, error, image);
        // Add to error group
        const errorKey = 'Date error';
        if (!groupedImages[errorKey]) {
          groupedImages[errorKey] = [];
        }
        groupedImages[errorKey].push(image);
      }
    });
    
    return groupedImages;
  };
  
  const groupedImages = groupImagesByDate();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Your Meal Gallery</h2>
      
      {Object.keys(groupedImages).length > 0 ? (
        <div className="space-y-6">
          {Object.keys(groupedImages).sort().reverse().map(date => (
            <div key={date} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">{formatDate(date)}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {groupedImages[date].map((image, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => openModal(image.publicUrl)}
                  >
                    <Image
                      src={image.publicUrl}
                      alt={`Meal from ${formatDate(image.createdAt)}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        console.error(`Error loading image: ${image.publicUrl}`);
                        const urlParts = image.publicUrl.split('/');
                        console.log('URL analysis:', {
                          fullUrl: image.publicUrl,
                          domain: urlParts[2],
                          pathSegments: urlParts.slice(3),
                          isSupabaseUrl: image.publicUrl.includes('supabase.co')
                        });
                        (e.target as HTMLImageElement).src = placeholderImage;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="text-white text-xs">
                        {new Date(image.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openModal(image.publicUrl)}
            >
              <Image
                src={image.publicUrl}
                alt={`Meal ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover"
                onError={(e) => {
                  console.error(`Error loading image: ${image.publicUrl}`);
                  (e.target as HTMLImageElement).src = placeholderImage;
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs">
                {formatDate(image.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal for full-screen view */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-screen">
            <button 
              className="absolute -top-10 right-0 bg-white rounded-full p-2 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              src={selectedImage}
              alt="Full size meal"
              width={1200}
              height={800}
              className="max-h-screen object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholderImage;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 