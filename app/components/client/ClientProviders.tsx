'use client';

import React, { ReactNode } from 'react';
import HydrationFix from './HydrationFix';

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper component
 * Ensures proper hydration and error handling for client components
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <HydrationFix
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-pulse text-white text-opacity-50">
            Loading application...
          </div>
        </div>
      }
    >
      {children}
    </HydrationFix>
  );
} 