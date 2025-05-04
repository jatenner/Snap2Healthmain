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
      const localStorageItems = Object.keys(localStorage)
        .filter(key => key.includes('supabase') || key.includes('auth') || key.includes('sb-'))
        .reduce((acc, key) => {
          const value = localStorage.getItem(key);
          return {...acc, [key]: value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : null};
        }, {});
      
      const cookieItems = document.cookie.split(';')
        .filter(c => c.trim())
        .map(c => c.trim())
        .filter(c => c.includes('supabase') || c.includes('auth') || c.includes('sb-'));
      
      setStorageInfo({
        localStorage: localStorageItems,
        cookies: cookieItems
      });
    } catch (error) {
      console.error('Error getting storage info:', error);
      setStorageInfo('Could not retrieve storage information');
    }
  };
  
  // Clear auth storage and redirect to login
  const clearAuthStorage = () => {
    try {
      if (window.__fixAuthStorage) {
        const cleared = window.__fixAuthStorage();
        
        if (cleared) {
          setStatus('success');
          setMessage('Auth storage cleared successfully! Redirecting to login...');
          
          // Clear any cookies related to auth
          document.cookie.split(';').forEach(c => {
            if (c.includes('supabase') || c.includes('auth') || c.includes('sb-')) {
              const name = c.split('=')[0].trim();
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
          setMessage('Failed to clear auth storage. Please try again.');
        }
      } else {
        setStatus('error');
        setMessage('Auth fix function not available. Please refresh the page and try again.');
      }
    } catch (error) {
      console.error('Error clearing auth storage:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Reset auth state and redirects to login
  const resetAndRedirect = () => {
    try {
      // Clear localStorage
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase') || key.includes('auth') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      }
      
      // Clear cookies
      document.cookie.split(';').forEach(c => {
        const name = c.split('=')[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      setStatus('success');
      setMessage('Authentication reset successful! Redirecting to login...');
      
      // Update storage info display
      updateStorageInfo();
      
      // Redirect after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      console.error('Error resetting auth:', error);
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication Recovery</h1>
          <p className="mt-2 text-gray-600">Fix issues with your authentication</p>
        </div>
        
        {message && (
          <div className={`p-3 border rounded-md ${
            status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            status === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <h2 className="font-semibold">Authentication Issues?</h2>
            <p className="text-sm text-gray-600 mt-1">
              If you're having trouble signing in, the buttons below might help resolve the issue.
            </p>
          </div>
          
          <Button 
            onClick={clearAuthStorage}
            className="w-full"
          >
            Fix Authentication Storage
          </Button>
          
          <Button 
            onClick={resetAndRedirect}
            variant="outline"
            className="w-full"
          >
            Reset and Redirect to Login
          </Button>
          
          <div className="pt-4 border-t border-gray-200">
            <Link href="/login" className="text-blue-600 hover:underline text-sm">
              Return to Login
            </Link>
          </div>
        </div>
        
        {storageInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md text-xs">
            <h3 className="font-bold mb-2">Auth Storage Information</h3>
            <pre className="overflow-x-auto max-h-40">
              {JSON.stringify(storageInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 