'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function FallbackErrorPage() {
  useEffect(() => {
    // Log the recovery attempt
    console.log('FallbackErrorPage mounted - providing recovery UI');
    
    // Try to clear any problematic localStorage items
    try {
      localStorage.removeItem('__webpack_hash__');
      localStorage.removeItem('__next');
      localStorage.removeItem('next:prefetch');
      localStorage.removeItem('next:router-state');
    } catch (e) {
      console.warn('Could not clear localStorage items:', e);
    }
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    try {
      // Clear app storage
      localStorage.clear();
      sessionStorage.clear();
      console.log('Cleared all browser storage');
      
      // Reload page with cache buster
      window.location.href = window.location.pathname + '?t=' + Date.now();
    } catch (e) {
      console.error('Failed to clear cache:', e);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-600 text-white p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">Snap2Health</h1>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
          <div className="mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mx-auto mb-4 text-yellow-300"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">We've encountered an issue</h2>
            <p className="text-sm opacity-80 mb-4">
              The application is experiencing technical difficulties. Please try one of these options:
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleReload}
              className="w-full py-2 px-4 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
            >
              Reload Page
            </button>
            
            <button
              onClick={handleClearCache}
              className="w-full py-2 px-4 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-md font-medium hover:bg-white/30 transition-colors"
            >
              Clear Cache & Reload
            </button>
            
            <Link href="/debug.html" className="block w-full py-2 px-4 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-md font-medium hover:bg-white/30 transition-colors">
              Open Debug Page
            </Link>
          </div>
        </div>
        
        <div className="text-sm opacity-70">
          <p>If you continue to experience issues, please contact support.</p>
          <p className="mt-2">
            <Link href="/" className="underline">
              Return to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 