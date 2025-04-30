'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';

// Simplified FoodUpload component that works with our API
export default function FoodUpload({ onUpload, isLoading }: { onUpload: (file: File, goal: string) => void, isLoading: boolean }) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<string>("General Wellness");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageClick = () => {
    console.log("Upload area clicked, triggering file input click");
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log("File input change event triggered", { hasFiles: !!files, fileCount: files?.length });
    
    if (!files || files.length === 0) {
      setError("No file selected");
      return;
    }

    const file = files[0];
    console.log("File selected:", { name: file.name, type: file.type, size: file.size });
    
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
      
      console.log("Image selected successfully:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
    } catch (err) {
      console.error("Error creating preview:", err);
      setError("Unable to preview the selected image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted", { hasFile: !!selectedFile });
    
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }
    
    try {
      setUploading(true);
      // Verify file is accessible before upload
      console.log("Submitting file:", {
        name: selectedFile.name,
        type: selectedFile.type,
        size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
        lastModified: new Date(selectedFile.lastModified).toISOString(),
        goal: goal
      });
      
      // Call onUpload with the file and goal
      onUpload(selectedFile, goal);
    } catch (err) {
      console.error("Error during submission:", err);
      setError("Failed to process your image. Please try again.");
      setUploading(false); // Reset uploading state on error
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="cursor-pointer border-4 border-dashed border-cyan-accent/60 rounded-lg p-8 text-center hover:bg-navy-700/50 transition-colors shadow-lg" 
               onClick={handleImageClick}>
            {previewUrl ? (
              <div className="relative h-80 w-full">
                <Image 
                  src={previewUrl}
                  alt="Food preview"
                  fill
                  className="object-contain rounded"
                />
                <div className="absolute bottom-2 right-2 bg-navy-900/80 text-white py-1 px-3 rounded-full text-sm">
                  {selectedFile?.name}
                </div>
              </div>
            ) : (
              <div className="py-12">
                <svg 
                  className="mx-auto h-20 w-20 text-cyan-accent/70" 
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
                <p className="mt-4 text-xl text-cyan-accent/90 font-semibold">Click to upload or take a photo</p>
                <p className="mt-2 text-sm text-blue-100/70">JPG, PNG, or GIF up to 10MB</p>
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
        </div>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">What's your health goal for this meal?</h2>
          <p className="text-white mb-4">Choose a goal to get tailored nutrition insights for your meal</p>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Enter your health goal (e.g., Weight Loss, Muscle Gain, Kidney Function, etc.)"
            className="w-full p-4 rounded-md bg-white text-darkBlue-secondary text-lg font-medium border-2 border-cyan-accent focus:ring-4 focus:ring-cyan-accent/50 focus:border-transparent"
          />
        </div>
        
        <button
          type="submit"
          className={`w-full py-4 rounded-lg font-semibold text-xl text-navy-900 transition-colors ${
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
              <LoadingSpinner size="sm" />
              <span>{isLoading ? 'Analyzing meal...' : 'Uploading image...'}</span>
            </div>
          ) : (
            'Analyze Food'
          )}
        </button>
        
        {(uploading || isLoading) && (
          <div className="mt-6 bg-darkBlue-accent/20 border border-darkBlue-accent/40 rounded-lg p-4">
            <div className="flex items-center">
              <LoadingSpinner size="md" />
              <div className="ml-4">
                <h3 className="text-cyan-accent font-semibold text-lg">
                  {isLoading ? 'AI is analyzing your meal' : 'Uploading your image'}
                </h3>
                <p className="text-blue-100/80">
                  {isLoading 
                    ? 'Our AI is identifying ingredients and calculating nutritional information...' 
                    : 'Uploading your image to our secure server...'}
                </p>
              </div>
            </div>
            <div className="mt-3 text-sm text-blue-100/60">
              This may take up to 20-30 seconds depending on the complexity of your meal.
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-500/40 p-4 rounded-lg text-white">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </form>
    </div>
  );
} 