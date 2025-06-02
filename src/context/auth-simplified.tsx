'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define a minimalistic User type
type User = {
  id?: string;
  email?: string;
} | null;

// Create a simple auth context with only essential properties
interface AuthContextType {
  user: User;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

// Create context with safe default values
const SimplifiedAuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  signIn: async () => ({ success: false, error: 'Auth not initialized' }),
  signOut: async () => { /* no-op default */ }
});

// Provider component
export function SimplifiedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock sign in (replace with actual auth logic if needed)
      // This is just a placeholder that doesn't cause errors
      if (email && password) {
        setUser({ id: '123', email });
        return { success: true };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (err) {
      console.error('Sign in error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Sign in failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified sign out function
  const signOut = async () => {
    try {
      setUser(null);
      // Clear any auth-related data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Value to provide to context consumers
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    signIn,
    signOut
  };

  return (
    <SimplifiedAuthContext.Provider value={contextValue}>
      {children}
    </SimplifiedAuthContext.Provider>
  );
}

// Hook for using the auth context
export const useSimplifiedAuth = () => {
  return useContext(SimplifiedAuthContext);
}; 