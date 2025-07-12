'use client';

import { ReactNode, useEffect, useState } from 'react';
import HydrationFix from './HydrationFix';

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper component
 * Ensures proper hydration and error handling for client components
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set up global error handlers for hydration issues
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.error?.message || event.message || '';
      
      // Check for hydration-related errors
      if (errorMessage.includes('hydration') || 
          errorMessage.includes('content does not match') ||
          errorMessage.includes('Event handlers cannot be passed') ||
          errorMessage.includes('Cannot read properties of undefined')) {
        
        console.warn('[ClientProviders] Hydration error caught:', errorMessage);
        event.preventDefault(); // Prevent the error from crashing the app
        
        // For critical errors, attempt a graceful recovery
        if (errorMessage.includes('Event handlers cannot be passed')) {
          console.warn('[ClientProviders] Critical hydration error - attempting recovery');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('[ClientProviders] Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    // Add error event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Mark as client-side after hydration
    setIsClient(true);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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