'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth';

// Add TypeScript declaration for window.ENV
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      NEXT_PUBLIC_MOCK_AUTH?: string;
      NEXT_PUBLIC_AUTH_BYPASS?: string;
      NEXT_PUBLIC_APP_ENV?: string;
    };
  }
}

// Define the auth context type
interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error } | undefined>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: Error } | undefined>;
  signOut: () => Promise<void>;
  setMockUser?: () => void;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Use a try/catch wrapper to handle server-side rendering gracefully
  let auth: AuthContextType | undefined;
  let isMockAuth = false;
  
  try {
    auth = useAuth();
    
    // Check if we're in mock/test mode
    isMockAuth = 
      typeof window !== 'undefined' && 
      (window.ENV?.NEXT_PUBLIC_MOCK_AUTH === 'true' || 
       window.localStorage.getItem('MOCK_AUTH') === 'true' || 
       process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' || 
       process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true');
  } catch (error) {
    console.error('Auth context not available yet');
  }

  // Handle form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (!auth) {
        throw new Error('Authentication not initialized');
      }
      
      const result = await auth.signIn(email, password);
      if (result?.error) {
        setError(result.error.message);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  // If auth bypass is enabled, show simplified test mode UI
  if (isMockAuth || process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-6 shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Snap2Health</h1>
            <h2 className="mt-2 text-xl font-semibold text-green-400">Test Mode</h2>
            <p className="mt-2 text-sm text-gray-400">
              Authentication is disabled for development
            </p>
          </div>
          
          <div className="mt-8">
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Go to Home Page
            </Link>
            
            <div className="mt-6 bg-gray-700 p-4 rounded-md text-sm">
              <p className="font-semibold text-green-400">Authentication Bypassed</p>
              <p className="mt-2 text-gray-300">
                For local testing, authentication is automatically bypassed.
                You can navigate freely through the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular login form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Snap2Health</h1>
          <h2 className="mt-2 text-xl">Sign In</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border-gray-600"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border-gray-600"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
          
          <div className="text-center text-sm">
            <p>
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-400 hover:underline">
                Sign up
              </Link>
            </p>
            
            {/* Test credentials for demonstration */}
            <div className="mt-4 p-2 bg-gray-700 rounded-md">
              <p className="font-medium">Test Account:</p>
              <p>Email: test@example.com</p>
              <p>Password: password123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 