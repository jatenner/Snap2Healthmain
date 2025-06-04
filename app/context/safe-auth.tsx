'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';

interface SafeAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const SafeAuthContext = createContext<SafeAuthContextType | undefined>(undefined);

export const SafeAuthProvider = ({ children }: { children: ReactNode }) => {
  // Always provide a mock user for safe fallback mode
  const mockUser: User = {
    id: 'safe-user',
    email: 'safe@snap2health.com',
    user_metadata: { name: 'Safe Mode User' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[SafeAuthProvider] Mock sign in for:', email);
    return { success: true };
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; data?: any }> => {
    console.log('[SafeAuthProvider] Mock sign up for:', email);
    return { success: true, data: { user: { email, user_metadata: { name } } } };
  };

  const signOut = async (): Promise<void> => {
    console.log('[SafeAuthProvider] Mock sign out');
  };

  const value: SafeAuthContextType = {
    user: mockUser,
    loading: false,
    signIn,
    signUp,
    signOut,
    isAuthenticated: true,
  };

  return (
    <SafeAuthContext.Provider value={value}>
      {children}
    </SafeAuthContext.Provider>
  );
};

export const useSafeAuth = () => {
  const context = useContext(SafeAuthContext);
  if (context === undefined) {
    // Return safe defaults if provider is not available
    console.warn('useSafeAuth called outside of SafeAuthProvider - returning safe defaults');
    return {
      user: null,
      loading: false,
      signIn: async () => ({ success: false, error: 'Safe auth provider not initialized' }),
      signUp: async () => ({ success: false, error: 'Safe auth provider not initialized' }),
      signOut: async () => {},
      isAuthenticated: false,
    };
  }
  return context;
}; 