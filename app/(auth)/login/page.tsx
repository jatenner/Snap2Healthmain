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

// Add this type declaration for the global window object
declare global {
  interface Window {
    __fixAuthStorage?: () => boolean;
    __clearAuthFailures?: () => void;
    __recordAuthFailure?: () => void;
  }
}

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

  useEffect(() => {
    // Clear auth storage first to prevent conflicts
    if (typeof window !== 'undefined' && window.__fixAuthStorage) {
      window.__fixAuthStorage();
    }
    
    // If already logged in, redirect
    if (user) {
      router.push(redirectParam);
    }
    
    // Run cache maintenance
    const performMaintenance = async () => {
      try {
        await runCacheMaintenance();
        console.log('Cache maintenance completed on login page load');
      } catch (err) {
        console.error('Error during cache maintenance:', err);
      }
    };
    
    performMaintenance();
  }, [user, router, redirectParam]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthMessage('');
    setIsSubmitting(true);
    
    // Clear auth storage first to prevent conflicts
    if (typeof window !== 'undefined' && window.__fixAuthStorage) {
      window.__fixAuthStorage();
    }
    
    if (!email || !password) {
      setError('Email and password are required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Try to sign in
      const { success, error } = await signIn(email, password);
      
      if (success) {
        // Reset auth attempts on success
        setAuthAttempts(0);
        
        // Clear auth failures
        if (window.__clearAuthFailures) {
          window.__clearAuthFailures();
        }
        
        // Set auth status cookie to prevent sign-in loops
        setCookie('auth-status', 'authenticated');
        
        // Delay to allow auth state to update fully before redirecting
        setTimeout(() => {
          router.push(redirectParam);
        }, 500);
      } else {
        setAuthAttempts(prev => prev + 1);
        
        // Record auth failure for troubleshooting
        if (window.__recordAuthFailure) {
          window.__recordAuthFailure();
        }
        
        if (error) {
          setError(error);
          
          // After multiple failed attempts, provide recovery option
          if (authAttempts >= 1) {
            setAuthMessage('Having trouble signing in? Try our recovery options below.');
          }
        } else {
          setError('Failed to sign in. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      
      // Record auth failure
      if (window.__recordAuthFailure) {
        window.__recordAuthFailure();
      }
      
      // After multiple failed attempts, provide recovery option
      if (authAttempts >= 1) {
        setAuthMessage('Having trouble signing in? Try our recovery options below.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Local auth fallback for when regular auth isn't working
  const handleLocalAuth = () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      // Create local user
      const localUser = setLocalAuth(email);
      
      if (localUser) {
        setCookie('auth-status', 'authenticated');
        setCookie('auth-redirect', redirectParam);
        setAuthMessage('Using local authentication. Redirecting...');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push(redirectParam);
        }, 1000);
      } else {
        setError('Failed to set up local authentication');
      }
    } catch (err) {
      console.error('Local auth error:', err);
      setError('Error setting up local authentication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get browser storage info for debugging
  const getBrowserStorageInfo = () => {
    try {
      const localStorageItems = Object.keys(localStorage).length;
      const localStorageSize = Object.keys(localStorage).reduce((size, key) => {
        return size + (localStorage.getItem(key)?.length || 0);
      }, 0);
      
      const authItems = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth') || key.includes('sb-')
      ).length;
      
      const cookieCount = document.cookie.split(';').filter(c => c.trim()).length;
      
      return {
        localStorage: {
          totalItems: localStorageItems,
          authRelatedItems: authItems,
          size: `${(localStorageSize / 1024).toFixed(2)} KB`
        },
        cookies: {
          count: cookieCount
        }
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return 'Could not retrieve storage information';
    }
  };

  return (
    <>
      {/* Load auth client fix script with priority */}
      <Script 
        id="auth-fix-script"
        src="/auth-client-fix.js"
        strategy="beforeInteractive"
      />
      
      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-slate-900">
          <div className="text-center">
            <Image 
              src="/logo.png" 
              alt="Snap2Health Logo" 
              width={100} 
              height={100} 
              className="mx-auto" 
            />
            <h1 className="mt-4 text-2xl font-bold">Welcome to Snap2Health</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}
          
          {authMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
              {authMessage}
              {authAttempts > 0 && (
                <div className="mt-2">
                  <Link href="/auth-fix" className="text-blue-600 dark:text-blue-400 underline">
                    Go to Authentication Recovery
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline dark:text-blue-400">
                Sign up
              </Link>
            </p>
            
            <div className="mt-4">
              <Link href="/auth-fix" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                Having trouble signing in?
              </Link>
            </div>
            
            <div className="mt-4">
              <button 
                onClick={() => setShowDebugInfo(!showDebugInfo)} 
                className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                type="button"
              >
                {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>
          </div>
          
          {showDebugInfo && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono overflow-x-auto dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300">
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
                  onClick={() => {
                    if (window.__fixAuthStorage) {
                      window.__fixAuthStorage();
                      setAuthMessage('Auth storage cleared. Try signing in again.');
                    }
                  }} 
                  variant="outline"
                  size="sm"
                  className="text-xs w-full mb-2"
                >
                  Fix Auth Storage
                </Button>
                
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
        
        <div className="mt-4 w-full max-w-md">
          <details className="text-sm text-center text-gray-400">
            <summary className="cursor-pointer hover:text-gray-500">Having trouble logging in?</summary>
            <div className="mt-2 p-4 bg-white rounded-lg shadow-md dark:bg-slate-900">
              <p className="text-sm text-gray-600 mb-2 dark:text-gray-400">
                If you're experiencing login issues, try clearing your cache:
              </p>
              <button
                onClick={() => {
                  // Clear localStorage
                  if (typeof window !== 'undefined') {
                    try {
                      // Use our auth fix function
                      if (window.__fixAuthStorage) {
                        window.__fixAuthStorage();
                      }
                      
                      // Clear sessionStorage
                      sessionStorage.clear();
                      
                      // Force refresh
                      window.location.href = '/login?refresh=' + Date.now();
                    } catch (e) {
                      console.error('Error clearing storage:', e);
                    }
                  }
                }}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300"
              >
                Clear Browser Cache & Refresh
              </button>
            </div>
          </details>
        </div>
      </div>
    </>
  );
} 