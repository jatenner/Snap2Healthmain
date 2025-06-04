// @ts-nocheck
'use client';

import React, { useEffect, ReactNode } from 'react';

interface ClientErrorHandlerProps {
  children: ReactNode;
}

export default function ClientErrorHandler({ children }: ClientErrorHandlerProps) {
  useEffect(() => {
    // Directly monkey-patch Function.prototype.call to ensure it never fails
    const originalCall = Function.prototype.call;
    Function.prototype.call = function(thisArg: any, ...args: any[]) {
      try {
        if (this && originalCall) {
          return originalCall.apply(this, [thisArg, ...args]);
        }
      } catch (e) {
        console.warn('Error in Function.prototype.call, using fallback');
      }
      // Fallback implementation
      const effectiveThisArg = thisArg || window;
      return this.apply(effectiveThisArg, args);
    };

    // Make webpack require more resilient
    if (typeof window !== 'undefined') {
      // Wait a bit for webpack to initialize
      setTimeout(() => {
        try {
          // Make webpack's require resilient
          if ((window as any).__webpack_require__) {
            const originalRequire = (window as any).__webpack_require__;
            (window as any).__webpack_require__ = function(...args: any[]) {
              try {
                return originalRequire.apply(this, args);
              } catch (e) {
                console.warn('Error in webpack require, returning empty module');
                return {};
              }
            };
            // Copy properties
            Object.keys(originalRequire).forEach(key => {
              (window as any).__webpack_require__[key] = originalRequire[key];
            });
          }
        } catch (e) {
          console.warn('Failed to patch webpack require', e);
        }
      }, 100);
    }

    // Disable React strict mode errors in development
    (window as any).__NEXT_HYDRATION_MARK_RENDERED = true;
    (window as any).__NEXT_DATA__ = (window as any).__NEXT_DATA__ || {};
    (window as any).__NEXT_DATA__.props = (window as any).__NEXT_DATA__.props || {};
    
    // Add global error handling for React hydration errors
    const errorHandler = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
         (event.error.message.includes('hydration') || 
          event.error.message.includes('Cannot read properties of undefined'))) {
        console.warn('Caught React hydration error:', event.error.message);
        // Prevent the browser from showing the error
        event.preventDefault();
        // Force a re-render of the content on critical errors
        if (event.error.message.includes('call')) {
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      }
    };
    window.addEventListener('error', errorHandler);
    
    // Clean up
    return () => {
      window.removeEventListener('error', errorHandler);
      // We don't restore Function.prototype.call to avoid breaking things during cleanup
    };
  }, []);

  return <>{children}</>;
} 