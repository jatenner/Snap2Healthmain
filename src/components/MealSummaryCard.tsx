import React, { useState } from 'react';
import Image from 'next/image';

interface MealSummaryCardProps {
  caption: string;
  ingredients: string[];
  imageUrl?: string;
  calories?: number;
  goal?: string;
}

export const MealSummaryCard: React.FC<MealSummaryCardProps> = ({
  caption,
  ingredients,
  imageUrl,
  calories,
  goal
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Placeholder image for fallbacks
  const placeholderImage = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.44-6.19l-2.35 3.02-1.56-1.88c-.2-.25-.58-.24-.78.01l-1.74 2.23c-.2.25-.02.61.29.61h8.98c.28 0 .48-.34.28-.59l-2.55-3.21c-.2-.25-.58-.24-.77.02z'/%3E%3C/svg%3E`;

  // Log image URL for debugging
  if (imageUrl) {
    console.log("MealSummaryCard rendering with imageUrl:", imageUrl);
    
    // Additional diagnostic checks
    try {
      const url = new URL(imageUrl);
      console.log("Image URL analysis:", {
        protocol: url.protocol,
        hostname: url.hostname,
        pathname: url.pathname,
        search: url.search,
        isSupabase: url.hostname.includes('supabase')
      });
    } catch (e) {
      console.error("Invalid image URL format:", imageUrl, e);
    }
  } else {
    console.log("MealSummaryCard rendering without imageUrl");
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        {imageUrl && !imageError && (
          <div className="md:w-1/3 relative">
            <div className="relative h-64 md:h-full w-full">
              <Image
                src={imageUrl}
                alt={caption}
                fill
                unoptimized // Add this to bypass Next.js image optimization
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                onError={(e) => {
                  console.error(`Error loading image in MealSummaryCard: ${imageUrl}`);
                  setImageError(true);
                }}
              />
            </div>
          </div>
        )}
        
        {/* Fallback if image failed to load */}
        {imageUrl && imageError && (
          <div className="md:w-1/3 bg-gray-100 flex items-center justify-center h-64 md:h-auto">
            <div className="text-center p-4">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">Image unavailable</p>
            </div>
          </div>
        )}
        
        {/* Content Section */}
        <div className={`p-6 ${imageUrl ? 'md:w-2/3' : 'w-full'}`}>
          {goal && (
            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
              Goal: {goal}
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{caption}</h2>
          
          {calories && (
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Calories</p>
                <p className="text-xl font-bold text-indigo-700">{calories} kcal</p>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-md font-semibold text-gray-700 mb-2">Ingredients Identified</h3>
            {ingredients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No specific ingredients identified</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 