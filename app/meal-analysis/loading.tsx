import React from 'react';
import LoadingSpinner from '../../app/components/LoadingSpinner';

export default function MealAnalysisLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex flex-col items-center py-12">
        <LoadingSpinner size={48} />
        <h2 className="text-xl font-medium text-white mb-2">Analyzing your meal...</h2>
        <p className="text-gray-300 text-center max-w-md">
          Our AI is working to identify ingredients and calculate nutritional information.
        </p>
      </div>
      
      {/* Skeleton loading UI */}
      <div className="space-y-8">
        {/* Food Caption Skeleton */}
        <div className="bg-darkBlue-secondary rounded-lg p-6 shadow-md animate-pulse border border-darkBlue-accent/30">
          <div className="h-7 bg-darkBlue-accent/30 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-darkBlue-accent/30 rounded w-full mb-2"></div>
          <div className="h-4 bg-darkBlue-accent/30 rounded w-5/6"></div>
        </div>

        {/* Macronutrients Skeleton */}
        <div className="bg-darkBlue-secondary rounded-lg p-6 shadow-md animate-pulse border border-darkBlue-accent/30">
          <div className="h-6 bg-darkBlue-accent/30 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-darkBlue-accent/10 rounded-lg p-4">
                <div className="h-5 bg-darkBlue-accent/30 rounded w-1/2 mx-auto mb-3"></div>
                <div className="h-8 bg-darkBlue-accent/30 rounded w-2/3 mx-auto mb-2"></div>
                <div className="h-4 bg-darkBlue-accent/30 rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Micronutrients Skeleton */}
        <div className="bg-darkBlue-secondary rounded-lg p-6 shadow-md animate-pulse border border-darkBlue-accent/30">
          <div className="h-6 bg-darkBlue-accent/30 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-darkBlue-accent/10 rounded-lg p-4">
                <div className="h-5 bg-darkBlue-accent/30 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-darkBlue-accent/30 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Benefits Skeleton */}
        <div className="bg-darkBlue-secondary rounded-lg p-6 shadow-md animate-pulse border border-darkBlue-accent/30">
          <div className="h-6 bg-darkBlue-accent/30 rounded w-1/3 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-darkBlue-accent/10 rounded-lg p-4">
                <div className="h-5 bg-darkBlue-accent/30 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-darkBlue-accent/30 rounded w-full mb-1"></div>
                <div className="h-4 bg-darkBlue-accent/30 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 