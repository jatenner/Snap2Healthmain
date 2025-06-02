'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { HelpCircle } from 'lucide-react';

interface MealImageProps {
  src?: string;
  alt?: string;
  className?: string;
  height?: string | number;
  fallbackText?: string;
}

/**
 * A specialized component for rendering meal images that handles various edge cases
 * and ensures consistent display whether in console mode or not.
 */
export default function MealImage({ 
  src, 
  alt = "Meal Image", 
  className = "", 
  height = "h-64 md:h-72 lg:h-96",
  fallbackText = "No image available"
}: MealImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Normalize the src to ensure it's properly handled
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    // Fix relative URLs
    let normalizedSrc = src;
    if (!src.startsWith('http') && !src.startsWith('/')) {
      normalizedSrc = '/' + src;
    }
    
    setImageSrc(normalizedSrc);
    
    // Preload the image
    const img = new window.Image();
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      console.error('Error loading image at:', normalizedSrc);
      setIsLoading(false);
      setHasError(true);
    };
    img.src = normalizedSrc;
    
    // Force display after a timeout for images that fail silently
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [src, isLoading]);
  
  // If we have no image or an error, show fallback
  if (hasError || !imageSrc) {
    return (
      <div className={`w-full ${height} bg-gray-800 rounded-xl flex flex-col items-center justify-center p-4 ${className}`}>
        <div className="bg-blue-500/20 text-blue-400 p-3 rounded-lg mb-2">
          <HelpCircle size={32} />
        </div>
        <p className="text-gray-400 text-center">{fallbackText}</p>
      </div>
    );
  }
  
  return (
    <div className={`w-full ${height} relative bg-gray-800 rounded-xl overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Use a standard img tag for reliability */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <img 
          src={imageSrc} 
          alt={alt} 
          className={`max-h-full max-w-full object-contain ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        />
      </div>
    </div>
  );
} 