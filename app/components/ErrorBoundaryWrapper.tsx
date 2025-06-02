'use client';

import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
}

// Simple error boundary to catch and handle component errors
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    // Convert to Error if it's not already
    const errorObj = error instanceof Error ? error : error ? new Error(String(error)) : new Error("Unknown error");
    
    // Update state so the next render will show the fallback UI
    return { hasError: true, error: errorObj };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo | null): void {
    // Safe error logging with defensive checks
    if (!errorInfo) {
      console.error("ErrorBoundary caught an error but errorInfo is missing:", error);
      this.setState({ 
        error: error instanceof Error ? error : new Error(String(error || "Unknown error")), 
        errorInfo: null 
      });
      return;
    }
    
    // Log error with safety measures
    console.error(
      "Component error caught by ErrorBoundary:", 
      error instanceof Error ? error.message : String(error || "Unknown error")
    );
    console.error("Error details:", errorInfo);
    
    // Update state with error details
    this.setState({ 
      error: error instanceof Error ? error : new Error(String(error || "Unknown error")), 
      errorInfo 
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Safely access error message with type checking
      const errorMessage = this.state.error && typeof this.state.error.message === 'string' 
        ? this.state.error.message 
        : "An unknown error occurred";
      
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-red-800 mb-3">Something went wrong</h2>
          <p className="text-sm text-red-700 mb-4">{errorMessage}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Try again
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
              <summary className="font-medium cursor-pointer">Stack trace</summary>
              <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 rounded">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  // Use state to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Mark as mounted after hydration
    setMounted(true);
    
    // Setup window error capture for non-React errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error caught:', { message, source, lineno, colno, error });
      // Call the original handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };
    
    // Catch unhandled promise rejections - using addEventListener to avoid TS errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Clean up on unmount
    return () => {
      window.onerror = originalOnError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // Only render the error boundary on the client to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }
  
  return <ErrorBoundary>{children}</ErrorBoundary>;
} 