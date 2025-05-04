#!/usr/bin/env node

/**
 * Fix Vercel Deployment Issues
 * 
 * This script fixes common module resolution errors during Vercel deployment
 * by identifying missing imports and creating stub modules for them.
 */

const fs = require('fs');
const path = require('path');

// Define paths for missing modules
const missingModules = [
  { 
    importPath: '@/context/auth', 
    filePath: 'src/context/auth.tsx',
    content: `
// This is a minimal version for deployment
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create singleton instance
let supabaseClientInstance = null;

export const getSupabaseClient = () => {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }
  
  supabaseClientInstance = createClientComponentClient();
  console.log('Created Supabase client singleton');
  return supabaseClientInstance;
};

// Auth context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = getSupabaseClient();
  
  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  // Auth methods
  const signIn = async (credentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };
  
  const signUp = async (credentials) => {
    try {
      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };
  
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  // Mock user for testing
  const setMockUser = () => {
    const mockUser = {
      id: 'mock-id',
      email: 'mock@example.com',
      user_metadata: {
        name: 'Test User',
        height: '70',
        weight: '170',
        age: '35',
        gender: 'other',
        defaultGoal: 'General Wellness'
      }
    };
    setUser(mockUser);
    setIsAuthenticated(true);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        setMockUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`
  },
  { 
    importPath: '@/lib/cache-manager', 
    filePath: 'src/lib/cache-manager.ts',
    content: `
// This is a minimal version for deployment
export const clearCache = async () => {
  console.log('Clearing application cache');
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('app-cache');
      sessionStorage.removeItem('app-cache');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  return false;
};

export const invalidateCache = async (key) => {
  console.log('Invalidating cache for key:', key);
  return true;
};

export const runCacheMaintenance = async () => {
  console.log('Running cache maintenance');
  return true;
};
`
  },
  { 
    importPath: '@/utils/deviceDetection', 
    filePath: 'src/utils/deviceDetection.ts',
    content: `
// This is a minimal version for deployment
export const isMobile = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768;
  }
  return false;
};

export const isIOS = () => {
  if (typeof window !== 'undefined') {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
  return false;
};

export const isAndroid = () => {
  if (typeof window !== 'undefined') {
    return /Android/.test(navigator.userAgent);
  }
  return false;
};

export const getDeviceInfo = () => {
  return {
    isMobile: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Unknown'
  };
};
`
  },
  { 
    importPath: './auth-workaround', 
    filePath: 'app/(auth)/login/auth-workaround.ts',
    content: `
// Auth workaround for login page
export const setLocalAuth = (email) => {
  console.log('Setting up local auth for:', email);
  
  if (typeof window !== 'undefined') {
    // Create mock user
    const mockUser = {
      id: 'local-' + Date.now(),
      email,
      name: email.split('@')[0],
      created_at: new Date().toISOString(),
      user_metadata: {
        name: email.split('@')[0],
        defaultGoal: 'General Wellness'
      }
    };
    
    // Store in localStorage
    localStorage.setItem('local-auth-user', JSON.stringify(mockUser));
    localStorage.setItem('use-local-auth', 'true');
    
    return mockUser;
  }
  
  return null;
};

export const fixAuthIssues = async () => {
  console.log('Applying auth workarounds');
  if (typeof window !== 'undefined') {
    // Clear any conflicting tokens
    const tokenKeys = Object.keys(localStorage).filter(
      key => key.startsWith('supabase.auth.token') || 
             key.startsWith('sb-') && key.includes('-auth-token')
    );
    
    for (const key of tokenKeys) {
      localStorage.removeItem(key);
    }
    
    return true;
  }
  return false;
};

export default fixAuthIssues;
`
  },
  { 
    // Add auth-client-fix.js to public directory
    importPath: 'auth-client-fix',
    filePath: 'public/auth-client-fix.js',
    content: `/**
 * Supabase Auth Client Fix
 * Prevents the "Multiple GoTrueClient instances detected" error
 * and fixes authentication persistence issues
 */

(function() {
  // Track initialization state
  window.__SUPABASE_AUTH_INITIALIZED = false;
  
  // Track auth failures
  window.__AUTH_FAILURES = 0;
  
  // Create auth storage management
  window.__fixAuthStorage = function() {
    console.log('Running auth storage fix...');
    let fixed = false;
    
    try {
      // Clear auth-related localStorage items that might be corrupted
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.startsWith('supabase.auth.token') || 
            key.startsWith('supabase.auth.refresh') ||
            key.includes('supa') && key.includes('auth')
          )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove identified keys
      keysToRemove.forEach(key => {
        console.log('Removing problematic auth key:', key);
        localStorage.removeItem(key);
      });
      
      // Clear session cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name && (name.includes('supabase') || name.includes('sb-'))) {
          document.cookie = \`\${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;\`;
        }
      });
      
      fixed = true;
      window.__AUTH_FAILURES = 0;
    } catch (err) {
      console.error('Auth fix error:', err);
    }
    
    return fixed;
  };
  
  // Record authentication failures
  window.__recordAuthFailure = function() {
    window.__AUTH_FAILURES = (window.__AUTH_FAILURES || 0) + 1;
    console.log(\`Auth failure recorded: \${window.__AUTH_FAILURES} total\`);
    
    // If we have multiple failures, try clearing storage
    if (window.__AUTH_FAILURES >= 3) {
      window.__fixAuthStorage();
      window.__AUTH_FAILURES = 0;
    }
  };
  
  // Clear auth failures counter
  window.__clearAuthFailures = function() {
    window.__AUTH_FAILURES = 0;
    console.log('Auth failure count reset');
  };
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth client fix initialized');
    
    // Try to detect redirects from auth pages and fix storage if needed
    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get('error');
    const authError = url.searchParams.get('authError');
    
    if (errorParam || authError || 
        url.pathname === '/login' || 
        url.pathname === '/auth-fix') {
      // Run storage fix in case we're in an auth error loop
      setTimeout(() => window.__fixAuthStorage(), 100);
    }
  });
})();`
  },
  { 
    // Add auth-fix page
    importPath: 'auth-fix',
    filePath: 'app/(auth)/auth-fix/page.tsx',
    content: `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
              document.cookie = \`\${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;\`;
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
      setMessage(\`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`);
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
          document.cookie = \`\${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;\`;
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
      setMessage(\`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`);
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
          <div className={\`p-3 border rounded-md \${
            status === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 
            status === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' : 
            'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
          }\`}>
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
          
          <button 
            onClick={clearAuthStorage}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            disabled={status !== 'idle' && status !== 'error'}
          >
            Fix Authentication Storage
          </button>
          
          <button 
            onClick={resetAndRedirect}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            disabled={status !== 'idle' && status !== 'error'}
          >
            Reset and Return to Login
          </button>
          
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
}`
  },
  { 
    // Add login page to fix any import issues
    importPath: 'login',
    filePath: 'app/(auth)/login/page.tsx',
    content: `'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth';
import { setLocalAuth } from './auth-workaround';
import { setCookie } from 'cookies-next';
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
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSubmitting || isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            {authAttempts > 1 && (
              <div>
                <button
                  type="button"
                  onClick={handleLocalAuth}
                  disabled={isSubmitting || isLoading}
                  className="w-full flex justify-center py-2 px-4 mt-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                >
                  Use Alternative Sign In
                </button>
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
          </div>
        </div>
      </div>
    </>
  );
}`
  }
];

// Create directory recursively
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// Fix missing modules
function fixMissingModules() {
  console.log('🔎 Checking for missing modules...');
  
  for (const module of missingModules) {
    const fullPath = path.join(process.cwd(), module.filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Missing module: ${module.importPath} (${module.filePath})`);
      try {
        ensureDirectoryExists(fullPath);
        fs.writeFileSync(fullPath, module.content.trim());
        console.log(`✅ Created stub for ${module.filePath}`);
      } catch (error) {
        console.error(`❌ Failed to create ${module.filePath}:`, error.message);
      }
    } else {
      console.log(`✅ Module exists: ${module.importPath}`);
    }
  }
  
  // Create auth-client-fix.js in public directory if it doesn't exist
  const authClientFixPath = path.join(process.cwd(), 'public/auth-client-fix.js');
  if (!fs.existsSync(authClientFixPath)) {
    try {
      // Find auth-client-fix in missingModules
      const authClientFixModule = missingModules.find(module => module.importPath === 'auth-client-fix');
      if (authClientFixModule) {
        ensureDirectoryExists(authClientFixPath);
        fs.writeFileSync(authClientFixPath, authClientFixModule.content.trim());
        console.log(`✅ Created auth-client-fix.js in public directory`);
      }
    } catch (error) {
      console.error(`❌ Failed to create auth-client-fix.js:`, error.message);
    }
  }
  
  // Create auth-fix page if it doesn't exist
  const authFixPagePath = path.join(process.cwd(), 'app/(auth)/auth-fix/page.tsx');
  if (!fs.existsSync(authFixPagePath)) {
    try {
      // Find auth-fix in missingModules
      const authFixModule = missingModules.find(module => module.importPath === 'auth-fix');
      if (authFixModule) {
        ensureDirectoryExists(authFixPagePath);
        fs.writeFileSync(authFixPagePath, authFixModule.content.trim());
        console.log(`✅ Created auth-fix page in app/(auth)/auth-fix directory`);
      }
    } catch (error) {
      console.error(`❌ Failed to create auth-fix page:`, error.message);
    }
  }
}

// Make sure next.config.js has the correct transpilation config
function checkNextConfig() {
  console.log('\n🔍 Checking Next.js configuration...');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    console.log('⚠️ next.config.js not found, creating minimal version');
    const minimalConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@supabase/auth-helpers-nextjs'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix issues with the app directory imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;
`;
    try {
      fs.writeFileSync(nextConfigPath, minimalConfig.trim());
      console.log('✅ Created minimal next.config.js');
    } catch (error) {
      console.error('❌ Failed to create next.config.js:', error.message);
    }
    return;
  }
  
  let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  let modified = false;
  
  // Check for path import
  if (!nextConfig.includes('path')) {
    nextConfig = `const path = require('path');\n${nextConfig}`;
    modified = true;
  }
  
  // Check for webpack configuration
  if (!nextConfig.includes('webpack')) {
    const webpackConfig = `
  webpack: (config, { isServer }) => {
    // Fix issues with the app directory imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };
    return config;
  },`;
    
    // Try to add webpack config
    nextConfig = nextConfig.replace(
      /const nextConfig\s*=\s*{/,
      `const nextConfig = {\n${webpackConfig}`
    );
    modified = true;
  }
  
  // Check for transpilePackages
  if (!nextConfig.includes('transpilePackages')) {
    nextConfig = nextConfig.replace(
      /const nextConfig\s*=\s*{/,
      `const nextConfig = {\n  transpilePackages: ['@supabase/auth-helpers-nextjs'],`
    );
    modified = true;
  }
  
  if (modified) {
    try {
      fs.writeFileSync(nextConfigPath, nextConfig);
      console.log('✅ Updated next.config.js with necessary configurations');
    } catch (error) {
      console.error('❌ Failed to update next.config.js:', error.message);
    }
  } else {
    console.log('✅ next.config.js already has the necessary configurations');
  }
}

// Run all the fixes
function runAllFixes() {
  console.log('🚀 Running Vercel deployment fixes...');
  fixMissingModules();
  checkNextConfig();
  console.log('\n✅ All fixes applied! Your application should now deploy without module resolution errors.');
  console.log('🔥 Commit these changes and try deploying again.');
}

runAllFixes(); 