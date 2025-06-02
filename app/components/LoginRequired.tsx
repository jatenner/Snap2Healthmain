'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LoginRequired() {
  const pathname = usePathname();
  const redirectUrl = encodeURIComponent(pathname || '/dashboard');
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Authentication Required</h1>
        <p className="mb-4 text-gray-600">You need to be logged in to access this page.</p>
        <Link 
          href={`/login?redirectTo=${redirectUrl}`}
          className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
        >
          Sign In
        </Link>
        <div className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
} 