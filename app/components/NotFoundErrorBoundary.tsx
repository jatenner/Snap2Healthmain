'use client';

import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Ultra-simplified error boundary that avoids TypeError: Cannot read properties of undefined (reading 'call')
 */
export class NotFoundErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: unknown): State {
    // Simple error handling with no complex logic
    return { 
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }

  componentDidCatch(error: unknown): void {
    // Simple logging
    console.error('Caught error:', error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md mt-10">
          <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-700 mb-4">{this.state.errorMessage}</p>
          <div className="flex gap-4">
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function NotFoundErrorBoundaryWrapper({ children }: Props) {
  return <NotFoundErrorBoundary>{children}</NotFoundErrorBoundary>;
} 