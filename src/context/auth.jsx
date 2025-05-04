'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// Create the auth context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  
  // Get the singleton instance
  const supabase = getSupabaseBrowser();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Get session and set up listener
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session) {
            setUser(session.user);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    });
    
    initializeAuth();
    
    // Cleanup
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);
  
  // Sign in function
  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  };
  
  // Sign up function
  const signUp = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };
  
  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  // Mock user for testing
  const setMockUser = () => {
    // Only use in development
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      const mockUser = {
        id: 'mock-user-id',
        email: 'test@example.com',
        user_metadata: {
          username: 'Test User',
          height: '68',
          weight: '160',
          age: '35',
          gender: 'neutral',
          defaultGoal: 'General Wellness'
        }
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
    }
  };
  
  // Reload user data
  const reloadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
      return { success: true };
    } catch (error) {
      console.error('Error reloading user:', error);
      return { success: false, error };
    }
  };
  
  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    setMockUser,
    reloadUser,
    supabase
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 