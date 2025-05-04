'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

// Add TypeScript declaration for window.ENV and our auth fix functions
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      NEXT_PUBLIC_MOCK_AUTH?: string;
      NEXT_PUBLIC_AUTH_BYPASS?: string;
      NEXT_PUBLIC_APP_ENV?: string;
    };
    __fixAuthStorage?: () => boolean;
    __recordAuthFailure?: () => void;
    __clearAuthFailures?: () => void;
    __SUPABASE_AUTH_INITIALIZED?: boolean;
  }
}

// Check if we're in mock mode - only enable if explicitly set to 'true'
const mockAuth = typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_MOCK_AUTH === 'true';
const authBypass = typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_AUTH_BYPASS === 'true';

// Define the shape of our auth context
interface AuthContextType {
  user: SupabaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  getUserProfile: () => Promise<any>;
  getSession: () => Promise<any>;
  profile: any;
  refreshProfile: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a singleton supabase client to prevent the multiple instances issue
let supabaseClientSingleton: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side, always create new instance
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
  }

  // Client-side, use singleton pattern
  if (!supabaseClientSingleton) {
    // If running in browser and our fix script is available
    if (window.__SUPABASE_AUTH_INITIALIZED === true) {
      console.warn('Multiple auth client initialization attempts detected, using existing client');
      
      // Fix storage if needed before creating client
      if (window.__fixAuthStorage) {
        window.__fixAuthStorage();
      }
    }
    
    window.__SUPABASE_AUTH_INITIALIZED = true;
    console.log('Created Supabase client singleton');
    
    // Get URL and key from window.ENV if available
    const supabaseUrl = window.ENV?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    supabaseClientSingleton = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true, 
        storageKey: 'sb-auth-token',
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return supabaseClientSingleton;
}

// Create a provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  // Create a stable reference to our singleton supabase client
  const supabase = getSupabaseClient();

  // This function fetches user profile from the API
  const getUserProfile = async () => {
    try {
      // If user is not logged in, return null
      if (!user) return null;
      
      // If mock auth, return a mock profile
      if (mockAuth) {
        return {
          id: 'mock-user-id',
          name: 'Test User',
          email: 'test@example.com',
          goal: 'Weight Loss',
          age: 30,
          height: 175,
          weight: 70,
          gender: 'Other',
        };
      }
      
      const response = await fetch('/api/auth/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const profileData = await response.json();
      setProfile(profileData);
      return profileData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await getUserProfile();
    }
  };

  const getSession = async () => {
    try {
      // if mock auth or auth bypass, return a mock session
      if (mockAuth || authBypass) {
        return {
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
          },
          access_token: 'mock-token'
        };
      }
      
      // Real auth flow
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        
        // Record the auth failure
        if (window.__recordAuthFailure) {
          window.__recordAuthFailure();
        }
        
        return null;
      }
      
      return data.session;
    } catch (error) {
      console.error('Error in getSession:', error);
      return null;
    }
  };

  // Function to sign in a user
  const signIn = async (email: string, password: string) => {
    try {
      // Clear auth storage first to prevent conflicts
      if (typeof window !== 'undefined' && window.__fixAuthStorage) {
        window.__fixAuthStorage();
      }
      
      // If mock auth, simulate sign in success
      if (mockAuth) {
        // Set mock user
        const mockUser = {
          id: 'mock-user-id',
          email: 'test@example.com',
          role: 'authenticated',
        } as unknown as SupabaseUser;
        
        setUser(mockUser);
        setCookie('user-id', 'mock-user-id');
        setCookie('user-email', 'test@example.com');
        setCookie('auth-status', 'authenticated');
        
        return { success: true };
      }
      
      // Real auth flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        
        // Record the auth failure
        if (window.__recordAuthFailure) {
          window.__recordAuthFailure();
        }
        
        return { success: false, error: error.message };
      }
      
      // Reset auth failure count on success
      if (window.__clearAuthFailures) {
        window.__clearAuthFailures();
      }
      
      setUser(data.user);
      
      // Set cookie for additional auth verification
      setCookie('auth-status', 'authenticated');
      
      return { success: true };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      
      // Record the auth failure
      if (window.__recordAuthFailure) {
        window.__recordAuthFailure();
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };

  // Function to sign out a user
  const signOut = async () => {
    try {
      // If mock auth, simulate sign out
      if (mockAuth) {
        setUser(null);
        deleteCookie('user-id');
        deleteCookie('user-email');
        deleteCookie('auth-status');
        router.push('/login');
        return;
      }
      
      // Real sign out
      await supabase.auth.signOut();
      setUser(null);
      deleteCookie('auth-status');
      
      // Clear auth storage on signout to prevent issues on next login
      if (typeof window !== 'undefined' && window.__fixAuthStorage) {
        window.__fixAuthStorage();
      }
      
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Effect to check if the user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        
        // If auth bypass is enabled and we're in development, set a mock user
        if (authBypass && process.env.NODE_ENV === 'development') {
          console.log('Auth bypass enabled, using mock user');
          const mockUser = {
            id: 'bypass-user-id',
            email: 'bypass@example.com',
            role: 'authenticated',
          } as unknown as SupabaseUser;
          
          setUser(mockUser);
          setIsLoading(false);
          return;
        }
        
        // If mock auth, set a mock user
        if (mockAuth) {
          console.log('Mock auth enabled, using mock user');
          const mockUser = {
            id: 'mock-user-id',
            email: 'test@example.com',
            role: 'authenticated',
          } as unknown as SupabaseUser;
          
          setUser(mockUser);
          setIsLoading(false);
          return;
        }
        
        // Real auth check
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          setUser(null);
          
          // Fix auth storage if there was an error
          if (typeof window !== 'undefined' && window.__fixAuthStorage) {
            window.__fixAuthStorage();
          }
        } else if (data?.user) {
          setUser(data.user);
          
          // Reset auth failure count on successful auth check
          if (window.__clearAuthFailures) {
            window.__clearAuthFailures();
          }
          
          // Load profile after confirming user is authenticated
          getUserProfile();
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Unexpected error in checkUser:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Run the check
    checkUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          getUserProfile();
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    // Clean up the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    getUserProfile,
    getSession,
    profile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 