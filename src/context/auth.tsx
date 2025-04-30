'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

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

// Check if we're in mock mode - only enable if explicitly set to 'true'
const mockAuth = 
  typeof window !== 'undefined' && 
  (window.ENV?.NEXT_PUBLIC_MOCK_AUTH === 'true' || 
   window.localStorage.getItem('MOCK_AUTH') === 'true' || 
   process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' || 
   process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true');

if (mockAuth) {
  console.log('Auth bypass enabled, skipping auth check');
}

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

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  user_metadata?: {
    username?: string;
    defaultGoal?: string;
    height?: string;
    weight?: string;
    age?: string;
    gender?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading?: boolean; // For backwards compatibility
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  setMockUser?: () => void;
}

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Configure Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Only use mock in development if explicitly enabled
  const useMockAuth = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
  
  // Initialize Supabase client if credentials are available
  const supabase = supabaseUrl && supabaseAnonKey ? 
    createClient(supabaseUrl, supabaseAnonKey) : 
    null;
  
  if (!supabase && !useMockAuth) {
    console.warn('Supabase client not initialized and mock auth not enabled');
  } else if (!supabase) {
    console.log('Using mock Supabase client');
  }

  // Initialize user session on load
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        if (useMockAuth) {
          // Use mock user in development if auth bypass is enabled
          console.log('Auth bypass enabled, using demo user');
          setUser({
            id: 'mock-user-id',
            email: 'demo@snap2health.com',
            name: 'Demo User',
            avatar: '/avatar-placeholder.png'
          });
        } else if (supabase) {
          // Check for existing session with Supabase
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            const { user: supabaseUser } = session;
            
            if (supabaseUser) {
              // Get user profile data
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();
              
              setUser({
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: profile?.name || 'User',
                avatar: profile?.avatar_url
              });
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [supabase, useMockAuth]);

  // Authentication functions
  const signIn = async (email: string, password: string) => {
    try {
      if (useMockAuth) {
        // Simulate successful login in development
        setUser({
          id: 'mock-user-id',
          email: email || 'demo@snap2health.com',
          name: 'Demo User',
          avatar: '/avatar-placeholder.png',
          user_metadata: {
            username: 'Demo User',
            defaultGoal: 'General Wellness'
          }
        });
        return { success: true };
      }
      
      if (!supabase) {
        return { success: false, error: 'Authentication service unavailable' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: profile?.name || 'User',
          avatar: profile?.avatar_url
        });
        
        return { success: true };
      }
      
      return { success: false, error: 'Something went wrong' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Failed to sign in' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      if (useMockAuth) {
        // Simulate successful signup in development
        setUser({
          id: 'mock-user-id',
          email,
          name,
          avatar: '/avatar-placeholder.png',
          user_metadata: {
            username: name,
            defaultGoal: 'General Wellness'
          }
        });
        return { success: true };
      }
      
      if (!supabase) {
        return { success: false, error: 'Authentication service unavailable' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create user profile
        await supabase
          .from('profiles')
          .insert([{ 
            id: data.user.id, 
            name,
            email,
            created_at: new Date().toISOString() 
          }]);
        
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name,
        });
        
        return { success: true };
      }
      
      return { success: false, error: 'Something went wrong' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Failed to sign up' };
    }
  };

  const signOut = async () => {
    if (useMockAuth) {
      // Just clear the user in development
      setUser(null);
      router.push('/login');
      return;
    }
    
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    }
  };

  const setMockUser = () => {
    if (useMockAuth) {
      setUser({
        id: 'mock-user-id',
        email: 'demo@snap2health.com',
        name: 'Demo User',
        avatar: '/avatar-placeholder.png',
        user_metadata: {
          username: 'Demo User',
          defaultGoal: 'General Wellness'
        }
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoading: loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
        setMockUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 