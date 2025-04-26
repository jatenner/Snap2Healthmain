'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import ImageUploader from '../../components/ImageUploader';
import ImageGallery from '../../components/ImageGallery';

export default function ImagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  // Check for auth status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!data.session?.user) {
          console.log('No authenticated user found, redirecting to login');
          router.push('/login');
          return;
        }
        
        setUserId(data.session.user.id);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUserId(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });
    
    // Clean up subscription
    return () => {
      data.subscription.unsubscribe();
    };
  }, [router]);

  // Handle successful upload
  const handleUploadSuccess = (url: string) => {
    console.log('Upload successful:', url);
    // Increment the refresh trigger to reload the gallery
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle image selection
  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
  };

  // Close the image viewer
  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Meal Images</h1>
      
      {userId && (
        <>
          <div className="mb-8">
            <ImageUploader 
              userId={userId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(err) => console.error('Upload error:', err)}
            />
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Image Gallery</h2>
            <ImageGallery 
              userId={userId}
              refreshTrigger={refreshTrigger}
              onImageSelect={handleImageSelect}
              className="mt-4"
            />
          </div>
        </>
      )}
      
      {/* Image viewer modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={closeImageViewer}>
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden">
            <button 
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full"
              onClick={closeImageViewer}
            >
              ✕
            </button>
            <img 
              src={selectedImage} 
              alt="Selected meal" 
              className="max-h-[90vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
} 