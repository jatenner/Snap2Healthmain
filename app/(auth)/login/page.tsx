'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { setLocalAuth } from './auth-workaround';
import { setCookie } from 'cookies-next';
import { runCacheMaintenance } from '@/lib/cache-manager';
import Script from 'next/script';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirectTo') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authAttempts, setAuthAttempts] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const { signIn, isLoading, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectParam);
    }
    
    // Run cache maintenance when the login page loads
    const performMaintenanceAndCheck = async () => {
      try {
        await runCacheMaintenance();
        console.log('Cache maintenance completed on login page load');
      } catch (err) {
        console.error('Error during cache maintenance:', err);
      }
    };
    
    performMaintenanceAndCheck();
  }, [user, router, redirectParam]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthMessage('');
    setIsSubmitting(true);
    
    if (!email || !password) {
      setError('Email and password are required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Try regular sign in
      const { success, error } = await signIn(email, password);
      
      if (success) {
        // Reset auth attempts on success
        setAuthAttempts(0);
        router.push(redirectParam);
      } else {
        // Increment auth attempts
        setAuthAttempts(prev => prev + 1);
        
        if (error) {
          setError(error);
          
          // After 2 failed attempts, suggest the auth recovery page
          if (authAttempts >= 1) {
            setAuthMessage('Having trouble signing in? Try our recovery options.');
          }
        } else {
          setError('Failed to sign in. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      
      // Increment auth attempts
      setAuthAttempts(prev => prev + 1);
      
      // After 1 failed attempt, suggest the auth recovery page
      if (authAttempts >= 0) {
        setAuthMessage('Having trouble signing in? Try our recovery options.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Local auth fallback function - for use when regular auth fails
  const handleLocalAuth = () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create local user
      const localUser = setLocalAuth(email);
      
      if (localUser) {
        setCookie('auth-redirect', redirectParam);
        setAuthMessage('Using local authentication fallback. Redirecting...');
        
        // Redirect after a short delay to allow cookie to be set
        setTimeout(() => {
          router.push(redirectParam);
        }, 1500);
      } else {
        setError('Failed to set up local authentication');
      }
    } catch (err) {
      console.error('Local auth error:', err);
      setError('Error setting up local auth. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle debug info visibility
  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };
  
  // Get browser storage info for debugging
  const getBrowserStorageInfo = () => {
    try {
      const localStorageSize = new Blob(
        Object.entries(localStorage).map(entry => JSON.stringify(entry))
      ).size;
      
      const localStorageItems = Object.keys(localStorage).length;
      
      const cookieSize = document.cookie.length;
      const cookieItems = document.cookie.split(';').filter(c => c.trim()).length;
      
      return {
        localStorage: {
          size: `${(localStorageSize / 1024).toFixed(2)} KB`,
          items: localStorageItems
        },
        cookies: {
          size: `${(cookieSize / 1024).toFixed(2)} KB`,
          items: cookieItems
        }
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return 'Could not retrieve storage information';
    }
  };

  return (
    <>
      <Script
        src="/auth-client-fix.js"
        strategy="beforeInteractive"
        id="auth-fix-script"
      />
      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <Image 
              src="/logo.png" 
              alt="Snap2Health Logo" 
              width={100} 
              height={100} 
              className="mx-auto" 
            />
            <h1 className="mt-4 text-2xl font-bold">Welcome to Snap2Health</h1>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
              {error}
            </div>
          )}
          
          {authMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
              {authMessage}
              {authAttempts > 0 && (
                <div className="mt-2">
                  <Link href="/auth-fix" className="text-blue-600 underline">
                    Go to Authentication Recovery
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full flex justify-center py-2 px-4"
              >
                {isSubmitting || isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
            
            {authAttempts > 1 && (
              <div>
                <Button
                  type="button"
                  onClick={handleLocalAuth}
                  disabled={isSubmitting || isLoading}
                  variant="outline"
                  className="w-full flex justify-center py-2 px-4 mt-2"
                >
                  Use Alternative Sign In
                </Button>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
            
            <div className="mt-4">
              <Link href="/auth-fix" className="text-sm text-gray-500 hover:underline">
                Having trouble signing in?
              </Link>
            </div>
            
            <div className="mt-4">
              <button 
                onClick={toggleDebugInfo} 
                className="text-xs text-gray-400 hover:text-gray-600"
                type="button"
              >
                {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>
          </div>
          
          {showDebugInfo && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono overflow-x-auto">
              <h3 className="font-bold mb-2">Debug Information</h3>
              <p className="mb-1">Auth Attempts: {authAttempts}</p>
              <p className="mb-1">Is Submitting: {isSubmitting.toString()}</p>
              <p className="mb-1">Is Loading: {isLoading.toString()}</p>
              <p className="mb-1">Is Authenticated: {!!user}</p>
              
              <h4 className="font-bold mt-3 mb-1">Browser Storage:</h4>
              <pre className="text-xs">
                {JSON.stringify(getBrowserStorageInfo(), null, 2)}
              </pre>
              
              <div className="mt-4">
                <Button 
                  type="button" 
                  onClick={() => window.location.href = '/auth-fix'} 
                  variant="outline"
                  size="sm"
                  className="text-xs w-full"
                >
                  Go to Auth Recovery
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 