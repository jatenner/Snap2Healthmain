import React from 'react';
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
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        {imageUrl && (
          <div className="md:w-1/3 relative">
            <div className="relative h-64 md:h-full w-full">
              <Image
                src={imageUrl}
                alt={caption}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              />
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