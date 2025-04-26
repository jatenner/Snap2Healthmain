import React, { useState, useRef } from 'react';
import { uploadMealImage } from '../lib/uploadImageToSupabase';

interface ImageUploaderProps {
  userId: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  onUploadStart?: () => void;
  className?: string;
}

/**
 * Component for uploading images to Supabase storage
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  userId,
  onUploadSuccess,
  onUploadError,
  onUploadStart,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    setIsUploading(true);
    setUploadProgress(10);
    setError(null);
    onUploadStart?.();

    try {
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload the image
      const imageUrl = await uploadMealImage(file, userId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      onUploadSuccess?.(imageUrl);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      onUploadError?.(err);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />
      
      <button
        onClick={triggerFileInput}
        disabled={isUploading}
        className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center ${
          isUploading 
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 transition-colors'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload New Image'}
      </button>
      
      {isUploading && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 