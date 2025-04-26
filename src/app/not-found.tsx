import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-6xl font-bold text-indigo-600 mb-2">404</div>
      <h1 className="text-2xl font-bold mb-4">Page not found</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
      >
        Return to Home
      </Link>
    </div>
  );
} 