import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Snap2Health Logo"
            width={100}
            height={100}
            className="mx-auto"
          />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Page Not Found</h1>
        
        <p className="mb-8 text-lg text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              Go to Login
            </Link>
          </Button>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Having trouble with the app?</p>
            <Link href="/auth-fix" className="text-blue-600 hover:underline">
              Try our authentication recovery tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 