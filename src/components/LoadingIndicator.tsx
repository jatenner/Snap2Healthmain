'use client';

import React from 'react';

export default function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Spinner */}
        <div className="w-20 h-20 border-4 border-darkBlue-accent/40 rounded-full"></div>
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-cyan-accent rounded-full border-t-transparent animate-spin"></div>
      </div>
      
      <div className="mt-8 text-center">
        <h3 className="text-xl font-medium text-white mb-2">Analyzing your meal...</h3>
        <p className="text-gray-300 max-w-md">
          Our AI is identifying food items and calculating nutritional values. This will only take a moment.
        </p>
      </div>
      
      <div className="mt-8 flex space-x-2">
        <div className="w-3 h-3 bg-cyan-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-cyan-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-cyan-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
} 