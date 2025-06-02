'use client';

import React, { useState, useEffect } from 'react';
import FallbackErrorPage from './FallbackErrorPage';

// Track error recovery globally to prevent infinite loops
let globalErrorCount = 0;

// Custom error boundary to catch React errors at the top level
export default function ErrorCatcher({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFatal, setIsFatal] = useState(false);

  // Reset the global error count when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only reset if we haven't seen many errors recently
      if (globalErrorCount < 5) {
        globalErrorCount = 0;
      }
    }
    
    return () => {
      // Cleanup
    };
  }, []);

  // Effect to automatically retry on error
  useEffect(() => {
    if (hasError && retryCount < 3 && !isFatal) {
      const timer = setTimeout(() => {
        console.log(`Automatically retrying render (attempt ${retryCount + 1} of 3)...`);
        setHasError(false);
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Increasing delay for each retry
      
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount, isFatal]);

  // Effect to patch React runtime errors
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleErrorEvent = (event: ErrorEvent) => {
      // Track global error count
      globalErrorCount++;
      
      // Set fatal error if we have too many errors
      if (globalErrorCount > 10) {
        setIsFatal(true);
      }
      
      if (event.error && event.error.message && (
        event.error.message.includes('ReactCurrentDispatcher') ||
        event.error.message.includes('Cannot read properties of undefined') ||
        event.error.message.includes('undefined is not a function') ||
        event.error.message.includes('options.factory') ||
        event.error.message.includes('call') ||
        event.error.message.includes('webpack')
      )) {
        // Prevent the default error behavior
        event.preventDefault();
        console.warn('React runtime error suppressed by ErrorCatcher:', event.error.message);
        
        // Set error state if we see too many of these errors
        if (globalErrorCount > 5) {
          setHasError(true);
          setErrorInfo('Multiple React runtime errors detected');
        }
      }
    };

    // Add global error handler
    window.addEventListener('error', handleErrorEvent);
    
    // Apply Function prototype fixes
    if (typeof Function.prototype.call !== 'function') {
      console.warn('Function.prototype.call is not a function, applying fix');
      try {
        Object.defineProperty(Function.prototype, 'call', {
          value: function(thisArg, ...args) {
            thisArg = thisArg === null || thisArg === undefined ? window : Object(thisArg);
            const fnKey = '__fn__' + Math.random().toString(36).slice(2);
            thisArg[fnKey] = this;
            const result = thisArg[fnKey](...args);
            delete thisArg[fnKey];
            return result;
          },
          writable: true,
          configurable: true
        });
      } catch (e) {
        console.error('Failed to fix Function.prototype.call', e);
      }
    }
    
    return () => {
      window.removeEventListener('error', handleErrorEvent);
    };
  }, []);

  // Handle errors during render
  try {
    // If we previously had an error but we're retrying, show a loading state
    if (retryCount > 0 && !hasError && !isFatal) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="p-6 max-w-md bg-white rounded-lg shadow-md text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Recovering from error...</p>
            <p className="text-xs text-gray-500 mt-2">Attempt {retryCount} of 3</p>
          </div>
        </div>
      );
    }
    
    // Render children normally if no error
    if (!hasError) {
      return <>{children}</>;
    }
    
    // Show fallback error page for fatal errors or after multiple retry failures
    if (isFatal || retryCount >= 3) {
      return <FallbackErrorPage />;
    }
    
    // Show error UI if we have an error
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
        
        {errorInfo && (
          <div className="mb-4 p-3 bg-red-50 rounded text-sm text-red-800 font-mono overflow-auto max-h-32">
            {errorInfo}
          </div>
        )}
        
        <p className="mb-4 text-gray-700">
          The application encountered an error while loading. Please try refreshing the page.
        </p>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              setHasError(false);
              setRetryCount(prev => prev + 1);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={retryCount >= 3}
          >
            Try Again
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refresh Page
          </button>
        </div>
        
        {retryCount >= 2 && (
          <p className="mt-4 text-sm text-gray-500">
            Multiple recovery attempts failed. A page refresh might be needed.
          </p>
        )}
      </div>
    );
  } catch (error) {
    // Set error state if not already set
    if (!hasError) {
      console.error('Top level error caught:', error);
      setHasError(true);
      setErrorInfo(error instanceof Error ? error.message : String(error));
      
      // Track global error for repeated issues
      globalErrorCount++;
      if (globalErrorCount > 5) {
        setIsFatal(true);
      }
    }
    
    // Use fallback page for fatal errors
    if (isFatal || retryCount >= 3) {
      return <FallbackErrorPage />;
    }
    
    // Show minimal error UI when we catch during render
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
        <p className="mb-4 text-gray-700">
          The application encountered an error while loading. Please try refreshing the page.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }
} 