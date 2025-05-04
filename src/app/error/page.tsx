'use client';

import React from 'react';
import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-red-600">Authentication Error</h1>
      
      <div className="mb-8 max-w-md rounded-lg bg-white p-6 shadow-md">
        <p className="mb-4 text-gray-700">
          There was an error authenticating your request. This could be due to:
        </p>
        
        <ul className="mb-6 list-disc pl-5 text-left text-gray-600">
          <li className="mb-2">Your session has expired</li>
          <li className="mb-2">Missing environment configuration</li>
          <li className="mb-2">You're not signed in to an account</li>
        </ul>
        
        <div className="mt-6 flex flex-col space-y-4">
          <Link 
            href="/login" 
            className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Go to Login
          </Link>
          
          <Link 
            href="/" 
            className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
} 