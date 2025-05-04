'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { clearLocalAuth, setLocalAuth } from '../(auth)/login/auth-workaround';
import { useRouter } from 'next/navigation';
import { runCacheMaintenance, clearAllCaches } from '@/lib/cache-manager';

export default function AuthFixPage() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [detectedErrors, setDetectedErrors] = useState<string[]>([]);
  const router = useRouter();

  // Check for common errors on page load
  useEffect(() => {
    const errors = [];
    
    // Check localStorage capacity
    try {
      // Try to consume a bit of localStorage to test quota
      const testKey = 'auth-fix-test-' + Date.now();
      const testData = new Array(1000).fill('A').join('');
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
    } catch (e) {
      errors.push('Browser storage quota exceeded');
    }
    
    // Check for GoTrueClient conflicts
    if (typeof window !== 'undefined') {
      const consoleOutput = (document as any).querySelector ? 
        Array.from(document.querySelectorAll('.console-message-text'))
          .map(el => el.textContent)
          .join('\n') : '';
      
      if (consoleOutput.includes('GoTrueClient instances detected')) {
        errors.push('Multiple GoTrueClient instances detected');
      }
    }
    
    setDetectedErrors(errors);
    
    // Run cache maintenance automatically
    runCacheMaintenance().catch(err => {
      console.error('Auto maintenance error:', err);
    });
  }, []);

  const handleClearCache = async () => {
    setLoading(true);
    setMessage('Clearing browser caches...');
    
    try {
      const result = await clearAllCaches();
      if (result) {
        setMessage('Browser caches cleared successfully! You can now try logging in again.');
      } else {
        setMessage('Cache API not available or cache clearing failed. Please clear your browser cache manually.');
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
      setMessage('Error clearing caches. Please try again or clear manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLocalAuth = () => {
    setLoading(true);
    setMessage('Clearing local authentication data...');
    
    try {
      clearLocalAuth();
      setMessage('Local authentication data cleared. You can now try logging in again.');
    } catch (error) {
      console.error('Error clearing local auth:', error);
      setMessage('Error clearing authentication data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocalAuth = () => {
    setLoading(true);
    setMessage('Setting up local authentication...');
    
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    
    try {
      const user = setLocalAuth(email);
      if (user) {
        setMessage('Local authentication set up successfully. Redirecting to home page...');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setMessage('Failed to set up local authentication. Please try again.');
      }
    } catch (error) {
      console.error('Error setting up local auth:', error);
      setMessage('Error setting up local authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Quick local auth setup using a default email
  const handleQuickFix = () => {
    setLoading(true);
    setMessage('Setting up quick local authentication bypass...');
    
    try {
      // Fix GoTrueClient conflicts by clearing localStorage first
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('supabase-auth-token');
      } catch (e) {
        console.warn('Error clearing auth tokens:', e);
      }
      
      // Set up local auth with a default email
      const testEmail = 'quickfix@snap2health.com';
      const user = setLocalAuth(testEmail);
      
      if (user) {
        setMessage('Quick fix applied successfully! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setMessage('Quick fix failed. Try the manual options below.');
      }
    } catch (error) {
      console.error('Error applying quick fix:', error);
      setMessage('Quick fix failed. Try the manual options below.');
    } finally {
      setLoading(false);
    }
  };

  const handleFixAll = async () => {
    setLoading(true);
    setMessage('Running complete authentication fix...');
    
    try {
      // Clear caches
      await clearAllCaches();
      
      // Clear local auth
      clearLocalAuth();
      
      // Clear localStorage related to auth
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('supabase-auth-token');
        
        // Clear GoTrueClient instances
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('gotrue'))) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          try { 
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove key: ${key}`, e);
          }
        });
      } catch (storageErr) {
        console.warn('Error clearing localStorage:', storageErr);
      }
      
      // Clear any session cookies
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      setMessage('All authentication data and caches cleared successfully. You can now try logging in again.');
    } catch (error) {
      console.error('Error during complete fix:', error);
      setMessage('Error during complete fix. Please try individual options.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Authentication Recovery</h1>
        
        <p className="mb-4 text-gray-700">
          If you&apos;re experiencing authentication issues, the options below can help you recover.
        </p>
        
        {detectedErrors.length > 0 && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <h3 className="font-semibold text-amber-800">Detected Issues:</h3>
            <ul className="list-disc pl-5 mt-1 text-sm text-amber-700">
              {detectedErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
            <div className="mt-3">
              <Button
                onClick={handleQuickFix}
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                Apply Quick Fix
              </Button>
            </div>
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="pt-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-2">Fix Everything</h2>
            <p className="text-sm text-gray-600 mb-2">
              Comprehensive fix - clears all caches and auth data.
            </p>
            <Button 
              onClick={handleFixAll} 
              disabled={loading}
              className="w-full"
              variant="default"
            >
              Fix All Auth Issues
            </Button>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Option 1: Clear Browser Caches</h2>
            <p className="text-sm text-gray-600 mb-2">
              Fixes QuotaExceededError and cache-related login problems.
            </p>
            <Button 
              onClick={handleClearCache} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              Clear Browser Caches
            </Button>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Option 2: Clear Auth Data</h2>
            <p className="text-sm text-gray-600 mb-2">
              Resets all authentication state, fixing corrupt tokens.
            </p>
            <Button 
              onClick={handleClearLocalAuth} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              Clear Auth Data
            </Button>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Option 3: Use Local Auth</h2>
            <p className="text-sm text-gray-600 mb-2">
              Bypass authentication service completely (emergency option).
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 p-2 border rounded-md"
              />
              <Button 
                onClick={handleUseLocalAuth} 
                disabled={loading || !email}
                variant="outline"
              >
                Use Local Auth
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/login" className="text-blue-600 hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 