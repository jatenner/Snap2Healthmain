import React, { useState, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { uploadImageToSupabase } from '@/lib/uploadImageToSupabase';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    try {
      setIsUploading(true);
      const imageUrl = await uploadImageToSupabase(file);
      onImageUpload(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {previewImage ? (
            <div className="relative w-full aspect-square overflow-hidden rounded-lg">
              <img
                src={previewImage}
                alt="Food preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-square flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">Take or upload a photo of your meal</p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            id="image-upload"
            className="hidden"
            disabled={isUploading}
          />
          
          <label htmlFor="image-upload" className="w-full">
            <Button
              variant="default"
              className="w-full"
              disabled={isUploading}
              asChild
            >
              <span>
                {isUploading ? 'Uploading...' : previewImage ? 'Change Photo' : 'Take Photo'}
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
} 