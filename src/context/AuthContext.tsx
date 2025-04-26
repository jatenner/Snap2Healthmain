'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

// For debugging purposes - verify environment variables are accessible in client components
const DEBUG_ENV = true; // Temporarily enable debugging 

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      console.log('Refreshing auth session...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      if (data?.session) {
        console.log('Session refreshed successfully:', data.session.user.email);
        setSession(data.session);
        setUser(data.session.user);
      } else {
        console.log('No session found during refresh');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Exception during session refresh:', error);
    }
  };

  useEffect(() => {
    // Log environment variables in development for debugging
    if (DEBUG_ENV && process.env.NODE_ENV === 'development') {
      console.log('Client Environment Variables:');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      // Don't log the full key for security, just a hint
      if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) + '...');
      } else {
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined');
      }
    }

    // Initial session fetch
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth and checking for session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        console.log('Session check complete:', data.session ? 'User is logged in' : 'No active session');
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'User session updated' : 'No session');
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
      
      // Force router refresh when auth state changes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      setLoading(true);
      
      // Check environment variables are available before attempting sign in
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Missing Supabase environment variables in sign-in attempt');
        throw new Error('Authentication service is not properly configured');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful, session established');
      
      // Ensure the UI updates with the new session
      setSession(data.session);
      setUser(data.session?.user || null);
      
      // We don't call router.push here because it will be handled in the component
      router.refresh();
      
      // Return the user for confirmation
      return data.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log('Attempting sign up for:', email);
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      
      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }
      
      console.log('Sign up response:', data);
      
      if (data.user) {
        router.refresh();
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting sign out');
      setLoading(true);
      await supabase.auth.signOut();
      
      // Use window.location for a clean redirect to login and full page reload
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 