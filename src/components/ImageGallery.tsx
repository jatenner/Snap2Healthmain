import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';

interface ImageGalleryProps {
  userId: string;
  refreshTrigger?: number; // Used to trigger a refresh when incremented
  onImageSelect?: (url: string) => void;
  className?: string;
}

/**
 * A reusable gallery component that displays a user's uploaded meal images
 * and can refresh when new images are uploaded
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({
  userId,
  refreshTrigger = 0,
  onImageSelect,
  className = '',
}) => {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if no userId provided
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchUserImages = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // List all objects in the user's directory
        const { data, error } = await supabase.storage
          .from('meal-images')
          .list(`users/${userId}`);
        
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          setImages([]);
          setIsLoading(false);
          return;
        }
        
        // Get signed URLs for each image
        const imagePromises = data.map(async (file) => {
          const filePath = `users/${userId}/${file.name}`;
          
          // Try to get a signed URL first
          const { data: signedData, error: signedError } = await supabase.storage
            .from('meal-images')
            .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
            
          if (signedError || !signedData) {
            // Fall back to public URL
            const { data: publicData } = supabase.storage
              .from('meal-images')
              .getPublicUrl(filePath);
              
            return {
              name: file.name,
              url: publicData.publicUrl
            };
          }
          
          return {
            name: file.name,
            url: signedData.signedUrl
          };
        });
        
        const resolvedImages = await Promise.all(imagePromises);
        setImages(resolvedImages);
      } catch (err: any) {
        console.error('Error fetching images:', err);
        setError(err.message || 'Failed to load images');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserImages();
  }, [userId, refreshTrigger]); // Refetch when userId or refreshTrigger changes

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading your images...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (images.length === 0) {
    return <div className="text-gray-500 p-4">No images found. Upload some to get started!</div>;
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {images.map((image) => (
        <div 
          key={image.name} 
          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onImageSelect?.(image.url)}
        >
          <Image
            src={image.url}
            alt={image.name.split('-').slice(1, -1).join('-')}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default ImageGallery; 