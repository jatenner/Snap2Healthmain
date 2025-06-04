'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import { isSupabaseConfigured, createSafeSupabaseClient, shouldUseMockAuth } from '../../lib/supabase/client';

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

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  signOut: async () => {},
  refreshUser: async () => {}
});

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return safe defaults instead of throwing error
    console.warn('useAuth called outside of AuthProvider - returning safe defaults');
    return {
      user: null,
      isLoading: false,
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
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we should use mock auth based on environment
  const useMockAuth = shouldUseMockAuth();

  // Debug logging
  console.log('[ClientAuthProvider] Environment check:', {
    useMockAuth,
    isClientSide: typeof window !== 'undefined',
    NODE_ENV: process.env.NODE_ENV
  });

  useEffect(() => {
    const initializeAuth = async () => {
        setIsLoading(true);
        
      // For mock/placeholder environments, use development auth
      if (useMockAuth) {
        console.log('[ClientAuthProvider] Using mock authentication for development');
        setUser({ id: 'dev-user-mock', email: 'dev@example.com' });
              setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // For real Supabase environments
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[ClientAuthProvider] Session error:', error);
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

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

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[ClientAuthProvider] Auth state changed:', event);
          
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
            setIsLoading(false);
          }
        );

        setIsLoading(false);

        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[ClientAuthProvider] Initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [useMockAuth]);

  const signOut = async () => {
    if (useMockAuth) {
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
      return;
    }

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[ClientAuthProvider] Sign out error:', error);
      }
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    } catch (error) {
      console.error('[ClientAuthProvider] Sign out error:', error);
    }
  };

  const refreshUser = async () => {
    if (useMockAuth) {
      return; // Nothing to refresh for mock auth
    }

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[ClientAuthProvider] Refresh user error:', error);
        return;
      }
      
      if (user) {
        setUser({
          id: user.id,
          email: user.email
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('[ClientAuthProvider] Refresh user error:', error);
    }
  };

  const contextValue: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        signOut,
        refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
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