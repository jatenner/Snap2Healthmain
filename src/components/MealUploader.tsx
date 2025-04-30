'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Camera, ImageIcon } from 'lucide-react';
import { FoodAnalysis } from './FoodAnalysis';
import { uploadImageToSupabase } from '@/lib/uploadImageToSupabase';
import { analyzeImage } from '@/lib/analyzeImage';

export function MealUploader() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [mealName, setMealName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Clear previous results
      setUploadedUrl(null);
      setAnalysisResult(null);
      setError(null);
      
      // Set default meal name from file name if empty
      if (!mealName) {
        const fileName = file.name.split('.')[0];
        setMealName(fileName.charAt(0).toUpperCase() + fileName.slice(1));
      }
    }
  };
  
  // Trigger the file input when the upload button is clicked
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle image upload and analysis
  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 1. Upload image to Supabase
      const imageUrl = await uploadImageToSupabase(selectedImage);
      
      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }
      
      setUploadedUrl(imageUrl);
      
      // 2. Analyze the uploaded image
      const result = await analyzeImage(imageUrl);
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }
      
      setAnalysisResult({
        mealId: result.mealId,
        mealContent: result.mealContents,
        analysis: result.mealAnalysis
      });
    } catch (err) {
      console.error('Error during analysis:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the component state for a new analysis
  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setMealName('');
    setAnalysisResult(null);
    setError(null);
    
    // Also clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // If we have analysis results, show the analysis component
  if (uploadedUrl && analysisResult) {
    return (
      <FoodAnalysis 
        imageUrl={uploadedUrl}
        mealName={mealName || 'My Meal'}
        mealContent={analysisResult.mealContent}
        analysis={analysisResult.analysis}
        onReset={handleReset}
        onSave={() => {
          // Could add success notification here
        }}
      />
    );
  }
  
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-background rounded-xl shadow-md">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Analyze Your Meal</h2>
          <p className="text-muted-foreground mt-1">
            Upload a photo of your food to get nutritional insights
          </p>
        </div>
        
        {/* Image Upload Section */}
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={triggerFileInput}
          >
            {previewUrl ? (
              <div className="relative w-full aspect-square max-h-64 mx-auto overflow-hidden rounded-md">
                <Image 
                  src={previewUrl} 
                  alt="Preview" 
                  fill
                  style={{ objectFit: 'cover' }}
                  className="mx-auto"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to select or drop your image here
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports JPG, PNG and HEIC
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
              data-testid="image-upload"
            />
          </div>
          
          <div className="flex justify-center space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={triggerFileInput}
              className="flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="flex items-center"
              onClick={() => {
                // Would integrate with device camera here
                alert('Camera functionality would be implemented here');
              }}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
          </div>
        </div>
        
        {/* Meal Name Input */}
        <div className="space-y-2">
          <Label htmlFor="mealName">Meal Name (optional)</Label>
          <Input
            id="mealName"
            placeholder="What are you eating?"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            disabled={loading}
            data-testid="meal-name-input"
          />
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="text-destructive text-sm p-2 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleReset}
            disabled={!selectedImage || loading}
          >
            Reset
          </Button>
          <Button 
            type="button"
            onClick={handleAnalyze}
            disabled={!selectedImage || loading}
            className="flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Meal'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 