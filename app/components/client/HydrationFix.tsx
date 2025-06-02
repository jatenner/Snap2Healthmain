'use client';

import React, { useEffect, useState, ReactNode } from 'react';

interface HydrationFixProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that prevents hydration issues by only rendering on the client
 * and providing helpful error recovery
 */
export default function HydrationFix({ children, fallback }: HydrationFixProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Set mounted to true after hydration
    setMounted(true);
    
    // Add error handler for hydration errors
    const errorHandler = (event: ErrorEvent) => {
      if (event.error && 
         (event.error.message?.includes('hydration') ||
          event.error.message?.includes('content does not match') ||
          event.error.message?.includes('Event handlers cannot be passed') ||
          event.error.message?.includes('PropTypes'))) {
        console.warn('[HydrationFix] Caught hydration error:', event.error.message);
        
        // Prevent the error from showing in the console
        event.preventDefault();
        
        // For critical errors, force reload the page
        if (event.error.message.includes('Event handlers cannot be passed')) {
          console.warn('[HydrationFix] Critical hydration error, reloading page...');
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      }
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);
  
  // Show fallback or nothing until mounted
  if (!mounted) {
    return fallback || null;
  }
  
  return <>{children}</>;
} 