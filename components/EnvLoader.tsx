'use client';

import { useState, useEffect, ReactNode } from 'react';
import { getEnv } from '@/utils/unified-env';

interface EnvLoaderProps {
  children: ReactNode;
}

/**
 * Environment Loader Component
 * 
 * This component initializes the environment variables when the app loads.
 * It will display a loading state until environment variables are properly loaded.
 */
export default function EnvLoader({ children }: EnvLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      // Initialize env variables on the client side
      const env = getEnv();
      console.log('[EnvLoader] Initializing environment variables');

      // Set up global window.__ENV if not already set
      if (typeof window !== 'undefined') {
        window.__ENV = window.__ENV || {};
        Object.entries(env).forEach(([key, value]) => {
          window.__ENV[key] = window.__ENV[key] || value;
        });
      }
      setLoaded(true);
      console.log('[EnvLoader] Environment variables successfully initialized');
    } catch (error) {
      console.error('[EnvLoader] Error initializing environment variables:', error);
      // Continue rendering even if there's an error
      setLoaded(true);
    }
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-300">Loading environment...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 