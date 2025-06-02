'use client';

import React, { ReactNode } from 'react';

interface MinimalErrorBoundaryProps {
  children: ReactNode;
}

interface MinimalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * A minimal error boundary that avoids the "call" property error
 * This is a simplified version that shouldn't trigger memory or reference issues
 */
export class MinimalErrorBoundary extends React.Component<
  MinimalErrorBoundaryProps,
  MinimalErrorBoundaryState
> {
  constructor(props: MinimalErrorBoundaryProps) {
    super(props);
    // Initialize with no error
    this.state = { hasError: false, error: null };
  }

  // Safely catch errors
  static getDerivedStateFromError(error: Error): MinimalErrorBoundaryState {
    return { hasError: true, error };
  }

  // Log errors without complex operations
  componentDidCatch(error: Error): void {
    console.error('MinimalErrorBoundary caught an error:', error);
  }

  render(): ReactNode {
    // Show error UI if there's an error
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-md m-4">
          <h2 className="text-lg font-bold text-red-800">Something went wrong</h2>
          <p className="text-red-600 mt-2">
            {this.state.error?.message || 'An unknown error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    // No error, render children
    return this.props.children;
  }
}

// Export a default function component wrapper for easier use
export default function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return <MinimalErrorBoundary>{children}</MinimalErrorBoundary>;
} 