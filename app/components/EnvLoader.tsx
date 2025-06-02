'use client';

import { useState, useEffect, ReactNode } from 'react';
import { getEnv } from '@/utils/unified-env';

interface EnvLoaderProps {
  children: ReactNode;
}

/**
 * This component ensures environment variables are correctly loaded and accessible
 * in both client and server contexts.
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
        <div className="p-4 bg-gray-800 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-white">Loading environment...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 