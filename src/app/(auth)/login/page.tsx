'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envStatus, setEnvStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Check if environment variables are available
  useEffect(() => {
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Login page - checking env variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'defined' : 'missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'defined' : 'missing');
    
    if (supabaseUrl && supabaseKey) {
      setEnvStatus('ok');
    } else {
      setEnvStatus('error');
      setError('Configuration issue: Missing API credentials. Please try again later.');
    }
  }, []);

  // Improved error handling function to make error messages more user-friendly
  const getUserFriendlyError = (error: any): string => {
    console.log('Error during sign in:', error);
    
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('Failed to fetch')) {
      return 'Unable to connect to authentication service. Please check your internet connection.';
    }
    else if (errorMessage.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in. Check your spam folder if you don\'t see it.';
    }
    else if (errorMessage.includes('Invalid login credentials')) {
      return 'Incorrect email or password. Please try again or create a new account.';
    }
    else if (errorMessage.includes('For security purposes')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    else if (errorMessage.includes('rate limit')) {
      return 'Too many sign-in attempts. Please try again in a moment.';
    }
    
    // Default fallback
    return `Unable to sign in: ${errorMessage}`;
  };

  const checkEnvVariables = async () => {
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      setDebugInfo(JSON.stringify(data, null, 2));
    } catch (err) {
      setDebugInfo('Error checking environment variables');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Manual form validation
    if (!email || !password) {
      setError('Please fill in both email and password fields');
      return;
    }
    
    if (envStatus !== 'ok') {
      setError('Cannot sign in - API configuration issue. Please try again later.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to sign in with:', email);
      
      // Direct navigation to upload page for testing - remove this in production
      if (email === 'test@example.com' && password === 'password') {
        console.log('Test login detected, bypassing auth');
        router.push('/upload');
        return;
      }
      
      // Wait for the sign-in to complete and get the user
      const user = await signIn(email, password);
      console.log('Sign in completed, user:', user?.email);
      
      // Get redirect path from URL params or default to upload page
      const redirectPath = searchParams.get('redirect') || '/upload';
      console.log('Login successful, redirecting to:', redirectPath);
      
      // Use a hard navigation to ensure a full page reload and proper session recognition
      window.location.href = redirectPath;
    } catch (err: any) {
      setError(getUserFriendlyError(err));
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-indigo-600">Snap2Health</h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Sign in to your account</h2>
        </div>
        
        {envStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
            <p className="font-medium">Authentication service unavailable</p>
            <p className="text-sm mt-1">Our authentication service is currently unavailable. Please try again later.</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                disabled={envStatus === 'error' || isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={envStatus === 'error' || isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm bg-red-50 border border-red-200 text-red-600 p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || envStatus === 'error'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create an account
              </Link>
            </div>
            <div className="text-sm">
              <Link 
                href="/upload" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Continue without signing in
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={checkEnvVariables}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Check configuration
            </button>
          </div>
          
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-40">
              <pre>{debugInfo}</pre>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 