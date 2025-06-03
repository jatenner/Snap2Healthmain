'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, usePathname } from 'next/navigation';

// Define user type
interface User {
  id: string;
  email?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Instead of throwing an error, return safe defaults
    console.warn('useAuth called outside of ClientAuthProvider - returning safe defaults');
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      signOut: async () => {},
      refreshUser: async () => {}
    };
  }
  return context;
}

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  // Make supabase client globally available for debugging
  if (typeof window !== 'undefined') {
    (window as any).supabase = supabase;
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // First check for stored authentication in localStorage before fetching
        try {
          const storedUserId = localStorage.getItem('auth_user_id');
          const storedTimestamp = localStorage.getItem('auth_login_timestamp');
          
          if (storedUserId && storedTimestamp) {
            const timestamp = parseInt(storedTimestamp);
            // If timestamp is less than 24 hours old, consider it valid
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
              console.log('[ClientAuthProvider] Found valid stored auth', storedUserId);
              // Set initial state from localStorage to prevent flicker
              setUser({ id: storedUserId });
              setIsAuthenticated(true);
            }
          }
        } catch (e) {
          console.error('[ClientAuthProvider] Error checking localStorage:', e);
        }
        
        // First try to refresh the session to ensure it's valid
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData.session) {
          console.log('[ClientAuthProvider] Session refreshed successfully');
          setUser({
            id: refreshData.session.user.id,
            email: refreshData.session.user.email
          });
          setIsAuthenticated(true);
          
          // Cache auth info
          try {
            localStorage.setItem('auth_login_timestamp', Date.now().toString());
            localStorage.setItem('auth_user_id', refreshData.session.user.id);
            localStorage.setItem('auth_user_email', refreshData.session.user.email || '');
          } catch (e) {
            console.error('[ClientAuthProvider] Error saving auth data to localStorage:', e);
          }
        } else {
          // If refresh failed, get session as fallback
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email
            });
            setIsAuthenticated(true);
            
            // Cache auth info
            try {
              localStorage.setItem('auth_login_timestamp', Date.now().toString());
              localStorage.setItem('auth_user_id', session.user.id);
              localStorage.setItem('auth_user_email', session.user.email || '');
            } catch (e) {
              console.error('[ClientAuthProvider] Error saving auth data to localStorage:', e);
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
            
            // Clean localStorage if no session
            try {
              localStorage.removeItem('auth_login_timestamp');
              localStorage.removeItem('auth_user_id');
              localStorage.removeItem('auth_user_email');
            } catch (e) {
              console.error('[ClientAuthProvider] Error clearing localStorage:', e);
            }
          }
        }
      } catch (error) {
        console.error('[ClientAuthProvider] Auth error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[ClientAuthProvider] Auth state changed: ${event}`);
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email
        });
        setIsAuthenticated(true);
        
        // Cache auth info
        try {
          localStorage.setItem('auth_login_timestamp', Date.now().toString());
          localStorage.setItem('auth_user_id', session.user.id);
          localStorage.setItem('auth_user_email', session.user.email || '');
        } catch (e) {
          console.error('[ClientAuthProvider] Error saving auth data to localStorage:', e);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        
        // Clean localStorage if no session
        try {
          localStorage.removeItem('auth_login_timestamp');
          localStorage.removeItem('auth_user_id');
          localStorage.removeItem('auth_user_email');
        } catch (e) {
          console.error('[ClientAuthProvider] Error clearing localStorage:', e);
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Function to sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      
      // Clean localStorage
      try {
        localStorage.removeItem('auth_login_timestamp');
        localStorage.removeItem('auth_user_id');
        localStorage.removeItem('auth_user_email');
      } catch (e) {
        console.error('[ClientAuthProvider] Error clearing localStorage:', e);
      }
      
      router.push('/');
    } catch (error) {
      console.error('[ClientAuthProvider] Error signing out:', error);
    }
  };

  // Function to manually refresh the auth state
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      // First try to refresh
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData.session) {
        setUser({
          id: refreshData.session.user.id,
          email: refreshData.session.user.email
        });
        setIsAuthenticated(true);
        return;
      }
      
      // Fallback to getSession
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[ClientAuthProvider] Error refreshing user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator while initializing auth
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-6 rounded-lg text-white">
          <div className="animate-pulse">Initializing authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Helper function to determine if a path requires authentication
function requiresAuth(path: string): boolean {
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/register',
    '/auth',
    '/reset-password',
    '/forgot-password'
  ];
  
  // Check if the path matches any of the public paths
  for (const publicPath of publicPaths) {
    if (path === publicPath || path.startsWith('/api/public')) {
      return false;
    }
  }
  
  return true;
}

// Declare global to make supabase available on window
declare global {
  interface Window {
    supabase: any;
  }
} 