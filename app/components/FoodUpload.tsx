'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '@/context/auth';

// Common health goals that users can select from
const SUGGESTED_GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "Heart Health",
  "Diabetes Management",
  "General Wellness"
];

export default function FoodUpload({ onUpload, isLoading }: { onUpload: (file: File, goal: string) => void, isLoading: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default goal from user profile if available
  useEffect(() => {
    if (user?.user_metadata?.defaultGoal) {
      setGoal(user.user_metadata.defaultGoal);
    } else {
      setGoal("General Wellness");
    }
  }, [user]);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      setError("No file selected");
      return;
    }

    const file = files[0];
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Please upload an image smaller than 10MB.");
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    
    // Clear previous file
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Set the file and preview
    setSelectedFile(file);
    
    try {
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError(null);
    } catch (err) {
      console.error("Error creating preview:", err);
      setError("Unable to preview the selected image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }
    
    try {
      setUploading(true);
      // Call onUpload with the file and goal
      onUpload(selectedFile, goal);
    } catch (err) {
      console.error("Error during submission:", err);
      setError("Failed to process your image. Please try again.");
      setUploading(false);
    }
  };

  const handleGoalClick = (selectedGoal: string) => {
    setGoal(selectedGoal);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Upload Section */}
          <div 
            className="cursor-pointer border-2 border-dashed border-cyan-accent/60 rounded-lg p-4 text-center hover:bg-navy-700/50 transition-colors flex items-center justify-center" 
            onClick={handleImageClick}
            style={{ minHeight: "200px" }}
          >
            {previewUrl ? (
              <div className="relative w-full h-48 md:h-full">
                <Image 
                  src={previewUrl}
                  alt="Food preview"
                  fill
                  className="object-cover rounded"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <svg 
                  className="h-16 w-16 text-cyan-accent/70" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <p className="mt-2 text-cyan-accent/90 font-medium">Upload a photo of your food</p>
                <p className="mt-1 text-xs text-blue-100/70">Click to browse or drop an image here</p>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={uploading || isLoading}
            />
          </div>
          
          {/* Goal Selection Section */}
          <div className="bg-darkBlue-accent/20 border border-darkBlue-accent/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-cyan-accent mb-3">Nutrition Goal</h3>
            <p className="text-sm text-white mb-3">Enter any health goal for personalized recommendations</p>
            
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Type your specific goal..."
              className="w-full p-2 rounded-md bg-white/10 text-white border border-darkBlue-accent/40 focus:ring-2 focus:ring-cyan-accent/50 focus:border-transparent mb-3"
            />
            
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_GOALS.map((suggestedGoal) => (
                <button
                  key={suggestedGoal}
                  type="button"
                  onClick={() => handleGoalClick(suggestedGoal)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    goal === suggestedGoal
                      ? 'bg-cyan-accent text-darkBlue-secondary'
                      : 'bg-darkBlue-accent/30 text-cyan-accent hover:bg-darkBlue-accent/50'
                  }`}
                >
                  {suggestedGoal}
                </button>
              ))}
            </div>
            
            <div className="mt-4">
              <p className="text-xs text-blue-100/70">Your goal will be used to provide personalized nutrition recommendations.</p>
            </div>
          </div>
        </div>
        
        {/* Analysis Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleImageClick}
            className="py-2 px-4 rounded-lg font-medium text-sm bg-darkBlue-accent/40 hover:bg-darkBlue-accent/60 text-white border border-darkBlue-accent/50"
            disabled={uploading || isLoading}
          >
            {previewUrl ? 'Change Image' : 'Upload Image'}
          </button>
          
          <button
            type="submit"
            className={`py-2 rounded-lg font-semibold text-navy-900 transition-colors ${
              uploading || isLoading
                ? 'bg-cyan-accent/70 cursor-wait'
                : selectedFile
                  ? 'bg-cyan-accent hover:bg-cyan-accent/80 shadow-lg shadow-cyan-accent/20'
                  : 'bg-cyan-accent/50 cursor-not-allowed'
            }`}
            disabled={uploading || isLoading || !selectedFile}
          >
            {uploading || isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size={20} />
                <span>{isLoading ? 'Analyzing...' : 'Uploading...'}</span>
              </div>
            ) : (
              'Analyze Food'
            )}
          </button>
        </div>
        
        {(uploading || isLoading) && (
          <div className="mt-4 bg-darkBlue-accent/20 border border-darkBlue-accent/40 rounded-lg p-3">
            <div className="flex items-center">
              <LoadingSpinner size={20} />
              <div className="ml-3">
                <h3 className="text-cyan-accent font-medium">
                  {isLoading ? 'Analyzing your meal' : 'Uploading image'}
                </h3>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-500/40 p-3 rounded-lg text-white text-sm">
            <p>{error}</p>
          </div>
        )}
      </form>
    </div>
  );
} 