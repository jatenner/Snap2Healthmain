'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Type declaration for window methods
declare global {
  interface Window {
    __fixAuthStorage?: () => boolean;
    __clearAuthFailures?: () => void;
    __recordAuthFailure?: () => void;
  }
}

export default function AuthFixPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [storageInfo, setStorageInfo] = useState<any>(null);
  
  useEffect(() => {
    // Load storage info on mount
    updateStorageInfo();
  }, []);
  
  // Get browser storage info for debugging
  const updateStorageInfo = () => {
    try {
      const authLocalStorage = Object.keys(localStorage)
        .filter(key => 
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('sb-') ||
          key.includes('gotrue')
        )
        .map(key => {
          const value = localStorage.getItem(key);
          return {
            key,
            value: value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : null
          };
        });
      
      const authCookies = document.cookie.split(';')
        .filter(c => c.trim())
        .map(c => c.trim())
        .filter(c => 
          c.includes('supabase') || 
          c.includes('auth') || 
          c.includes('sb-')
        );
      
      setStorageInfo({
        localStorage: authLocalStorage,
        cookies: authCookies
      });
    } catch (error) {
      console.error('Error getting storage info:', error);
      setStorageInfo('Could not retrieve storage information');
    }
  };
  
  // Clear auth storage and redirect to login
  const clearAuthStorage = () => {
    try {
      setStatus('idle');
      setMessage('Clearing authentication storage...');
      
      if (window.__fixAuthStorage) {
        const cleared = window.__fixAuthStorage();
        
        if (cleared) {
          setStatus('success');
          setMessage('Authentication storage cleared successfully! Redirecting to login page...');
          
          // Clear auth-related cookies
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name && (
              name.includes('supabase') || 
              name.includes('sb-') || 
              name.includes('auth')
            )) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          });
          
          // Update storage info display
          updateStorageInfo();
          
          // Redirect after a delay
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Failed to clear authentication storage. Please try again or restart your browser.');
        }
      } else {
        setStatus('error');
        setMessage('Authentication fix function not available. Please try refreshing the page.');
      }
    } catch (error) {
      console.error('Error clearing auth storage:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Reset auth state and redirect to login
  const resetAndRedirect = () => {
    try {
      setStatus('idle');
      setMessage('Resetting authentication state...');
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('sb-') ||
          key.includes('gotrue')
        ) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      // Clear session storage
      sessionStorage.clear();
      
      setStatus('success');
      setMessage('Authentication state reset successful! Redirecting to login page...');
      
      // Update storage info display
      updateStorageInfo();
      
      // Redirect after a delay with forced refresh
      setTimeout(() => {
        window.location.href = '/login?refresh=' + Date.now();
      }, 1500);
    } catch (error) {
      console.error('Error resetting auth:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Hard reset - force page reload with clean state
  const hardReset = () => {
    try {
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      setStatus('success');
      setMessage('All browser storage cleared! Performing hard reset...');
      
      // Force page reload with cache bypass
      setTimeout(() => {
        window.location.href = '/login?hard_reset=' + Date.now();
      }, 1000);
    } catch (error) {
      console.error('Error during hard reset:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication Recovery</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Fix issues with your authentication</p>
        </div>
        
        {message && (
          <div className={`p-3 border rounded-md ${
            status === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 
            status === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' : 
            'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
          }`}>
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md dark:bg-slate-800">
            <h2 className="font-semibold">Authentication Issues?</h2>
            <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">
              If you're having trouble signing in, the buttons below can help fix common authentication problems.
            </p>
          </div>
          
          <Button 
            onClick={clearAuthStorage}
            className="w-full"
            disabled={status !== 'idle' && status !== 'error'}
          >
            Fix Authentication Storage
          </Button>
          
          <Button 
            onClick={resetAndRedirect}
            variant="outline"
            className="w-full"
            disabled={status !== 'idle' && status !== 'error'}
          >
            Reset and Return to Login
          </Button>
          
          <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
            <details className="text-sm text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Advanced Options
              </summary>
              <div className="mt-2">
                <Button 
                  onClick={hardReset}
                  variant="destructive"
                  className="w-full mt-2"
                  disabled={status !== 'idle' && status !== 'error'}
                >
                  Hard Reset (Clear All Data)
                </Button>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  Use this option only if other methods fail. This will clear all local browser data.
                </p>
              </div>
            </details>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400 text-sm">
              Return to Login
            </Link>
          </div>
        </div>
        
        {storageInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md text-xs dark:bg-slate-800">
            <h3 className="font-bold mb-2">Authentication Storage Information</h3>
            <details>
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                View Storage Details
              </summary>
              <pre className="overflow-x-auto mt-2 max-h-60 p-2 bg-gray-100 rounded dark:bg-slate-700">
                {JSON.stringify(storageInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
} 