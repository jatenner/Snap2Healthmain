'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';

export default function AnalyzePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      if (!selectedFile.type.includes('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Image must be smaller than 10MB');
        return;
      }
      
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an image to analyze');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload image to storage
      const formData = new FormData();
      formData.append('file', file);
      
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
      setIsAnalyzing(true);
      
      // Analyze the image
      const analysisResponse = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl, 
          goal: caption || 'General Wellness',
          // The API will automatically fetch the user profile if needed
        }),
      });
      
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      const analysisData = await analysisResponse.json();
      
      // Save the meal data
      const saveResponse = await fetch('/api/save-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          caption,
          analysis: analysisData,
        }),
      });
      
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save meal data');
      }
      
      const { mealId } = await saveResponse.json();
      
      // Redirect to the meal detail page
      router.push(`/meal/${mealId}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Analyze Your Meal</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Upload a photo of your meal</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="meal-photo"
                />
                <label
                  htmlFor="meal-photo"
                  className="cursor-pointer block"
                >
                  {preview ? (
                    <div className="relative h-64 w-full mb-3">
                      <Image
                        src={preview}
                        alt="Meal preview"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="py-8">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m-8 0v12m-24 0h12a4 4 0 004-4v-8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        Click to select an image or drag and drop one here
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="caption" className="block text-gray-700 mb-2">
                Caption (optional)
              </label>
              <input
                type="text"
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a description for this meal"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isUploading || isAnalyzing}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md disabled:bg-gray-400"
            >
              {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Analyze Meal'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 