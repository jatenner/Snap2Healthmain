'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, createClient, SupabaseClient } from '@supabase/supabase-js';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

// Add TypeScript declaration for window.ENV
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      NEXT_PUBLIC_MOCK_AUTH?: string;
      NEXT_PUBLIC_AUTH_BYPASS?: string;
      NEXT_PUBLIC_APP_ENV?: string;
    };
  }
}

// Always enable mock auth in production
const FORCE_MOCK_AUTH = true;

// Check if we're in mock mode
const mockAuth = FORCE_MOCK_AUTH || 
  typeof window !== 'undefined' && 
  (window.ENV?.NEXT_PUBLIC_MOCK_AUTH === 'true' || 
   window.localStorage.getItem('MOCK_AUTH') === 'true' || 
   process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' || 
   process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true');

console.log('Auth bypass enabled, skipping auth check');

// Create a Supabase client (or a mock one if in mock mode)
let supabase: SupabaseClient;

try {
  if (mockAuth) {
    // Use a basic client with no actual connection in mock mode
    console.log('Using mock Supabase client');
    // Create a complete mock implementation that won't try to validate URLs
    supabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
        signUp: async () => ({ data: { user: null, session: null }, error: null }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              range: () => Promise.resolve({ data: [], error: null })
            })
          })
        })
      }),
      storage: { 
        from: () => ({
          upload: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } })
        })
      }
    } as unknown as SupabaseClient;
  } else {
    const supabaseUrl = typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_SUPABASE_URL 
      ? window.ENV.NEXT_PUBLIC_SUPABASE_URL 
      : process.env.NEXT_PUBLIC_SUPABASE_URL;
      
    const supabaseKey = typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing - falling back to mock');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Fallback to mock client with more complete implementation
  console.log('Falling back to mock Supabase client due to error');
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null })
          })
        })
      })
    }),
    storage: { 
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } })
      })
    }
  } as unknown as SupabaseClient;
}

// Define the type for the AuthContext
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any } | undefined>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any } | undefined>;
  signOut: () => Promise<void>;
  setMockUser: () => void; // For testing purposes
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a default mock user
const createMockUser = () => ({
  id: 'mock-user-id',
  email: 'user@example.com',
  user_metadata: { username: 'Demo User' },
  role: 'authenticated',
  aud: 'authenticated',
  app_metadata: {},
  created_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
} as unknown as User);

// Create the AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from cookie on first load or create mock user
  useEffect(() => {
    if (mockAuth) {
      // Just create a mock user immediately
      const mockUser = createMockUser();
      setUser(mockUser);
      setCookie('user', JSON.stringify(mockUser));
      setIsLoading(false);
      console.log('Mock user created automatically');
      return;
    }

    const cookieUser = getCookie('user');
    
    if (cookieUser) {
      try {
        const parsedUser = JSON.parse(cookieUser as string);
        setUser(parsedUser);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing user cookie:', error);
      }
    }

    // Check for existing session
    const getUser = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data && data.session) {
          setUser(data.session.user);
          // Also set the cookie
          setCookie('user', JSON.stringify(data.session.user));
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setCookie('user', JSON.stringify(session.user));
      } else {
        setUser(null);
        deleteCookie('user');
      }
      setIsLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, username: string) => {
    // Check if using mock auth
    if (mockAuth) {
      const mockUser = createMockUser();
      // We don't want to automatically sign in after signup as we'd expect email verification
      // Just return success
      return undefined;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        console.error('Error signing up:', error.message);
        return { error };
      }
      
      // We'll let the user confirm their email before signing them in
      return undefined;
    } catch (error) {
      console.error('Error in signUp function:', error);
      return { error };
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    // Check if using mock auth
    if (mockAuth) {
      const mockUser = createMockUser();
      setUser(mockUser as unknown as User);
      setCookie('user', JSON.stringify(mockUser));
      return undefined;
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in:', error.message);
        return { error };
      }

      if (data && data.user) {
        setUser(data.user);
        setCookie('user', JSON.stringify(data.user));
      }
      
      return undefined;
    } catch (error) {
      console.error('Error in signIn function:', error);
      return { error };
    }
  };

  // Sign out function
  const signOut = async () => {
    // Check if using mock auth
    if (mockAuth) {
      setUser(null);
      deleteCookie('user');
      return;
    }
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      deleteCookie('user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // For testing purposes
  const setMockUser = () => {
    if (mockAuth) {
      const mockUser = createMockUser();
      setUser(mockUser as unknown as User);
      setCookie('user', JSON.stringify(mockUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        setMockUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 