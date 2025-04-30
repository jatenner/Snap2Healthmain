'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

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

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!auth) {
        throw new Error('Authentication not initialized');
      }
      
      const result = await auth.signUp(email, password, username);
      if (result?.error) {
        setError(result.error.message);
      } else {
        setSuccess('Account created! You can now sign in.');
        // Don't redirect immediately, let the user see the success message
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Snap2Health</h1>
          <h2 className="mt-2 text-xl">Create your account</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/50 border border-green-500 text-white p-3 rounded-md text-sm">
              {success}
              <div className="mt-2">
                <Link href="/login" className="text-blue-400 hover:underline">
                  Go to Sign In
                </Link>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700 border-gray-600"
                placeholder="Choose a username"
                disabled={isLoading || !!success}
              />
            </div>
            
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
                disabled={isLoading || !!success}
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
                placeholder="Create a password (min 6 characters)"
                minLength={6}
                disabled={isLoading || !!success}
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || !!success}
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            {isLoading ? 'Creating Account...' : success ? 'Account Created' : 'Sign Up'}
          </Button>
          
          <div className="text-center text-sm">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 