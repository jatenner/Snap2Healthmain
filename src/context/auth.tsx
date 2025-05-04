'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

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
    __fixAuthStorage?: () => boolean;
    __recordAuthFailure?: () => void;
    __clearAuthFailures?: () => void;
  }
}

// Check if we're in mock mode - only enable if explicitly set to 'true'
const mockAuth = typeof window !== 'undefined' && 
  (window.ENV?.NEXT_PUBLIC_MOCK_AUTH === 'true' || process.env.NEXT_PUBLIC_MOCK_AUTH === 'true');

const authBypass = typeof window !== 'undefined' && 
  (window.ENV?.NEXT_PUBLIC_AUTH_BYPASS === 'true' || process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true');

// Create a singleton instance of the Supabase client
// This prevents the "Multiple GoTrueClient instances detected" warning
let supabaseClientSingleton: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (supabaseClientSingleton) {
    return supabaseClientSingleton;
  }

  // Fix any auth storage issues before creating a new client
  if (typeof window !== 'undefined' && window.__fixAuthStorage) {
    window.__fixAuthStorage();
  }

  // For client-side, create a new client
  if (typeof window !== 'undefined') {
    console.log('Created Supabase client singleton');
    supabaseClientSingleton = createClientComponentClient();
    return supabaseClientSingleton;
  }

  // For server-side, create a new client each time (should not be an issue)
  return createClientComponentClient();
};

// User interface (at the top of the file)
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  avatar_url?: string;
  created_at?: string;
  user_metadata?: {
    [key: string]: any;
  };
  profile_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading?: boolean; // For backwards compatibility
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  setMockUser?: () => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Update the createMockUser function to include the new field
const createMockUser = (): User => ({
  id: 'mock-user-id',
  email: 'demo@snap2health.com',
  name: 'Demo User',
  avatar: '/avatar-placeholder.png',
  avatar_url: '/avatar-placeholder.png',
  profile_completed: false,
  user_metadata: {
    username: 'Demo User',
    defaultGoal: 'General Wellness'
  }
});

// Helper function to clear local auth data
const clearLocalAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('use-local-auth');
    localStorage.removeItem('local-auth-user');
    localStorage.removeItem('auth-ready');
    
    // Also clear cookies properly
    document.cookie = "use-local-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "local-auth-user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    console.log('Local auth data cleared');
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // For compatibility with existing code
  const isLoading = loading;

  // Use local authentication if set
  const checkLocalAuth = () => {
    try {
      const useLocalAuth = getCookie('use-local-auth') === 'true';
      const localAuthUser = getCookie('local-auth-user');
      
      if (useLocalAuth && localAuthUser) {
        const userData = JSON.parse(localAuthUser as string) as User;
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        setIsInitialized(true);
        setIsInitializing(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking local auth:', error);
      return false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (isInitializing) {
      // Try to use local auth first
      const hasLocalAuth = checkLocalAuth();
      if (hasLocalAuth) return;
      
      // Otherwise initialize with Supabase
      const initialize = async () => {
        try {
          setLoading(true);
          
          // If we're using auth bypass, create a mock user and skip Supabase
          if (authBypass) {
            const mockUser = createMockUser();
            setUser(mockUser);
            setIsAuthenticated(true);
            setIsInitialized(true);
            setLoading(false);
            if (window.__clearAuthFailures) {
              window.__clearAuthFailures();
            }
            return;
          }

          // Get the Supabase client
          const supabase = getSupabaseClient();
          
          // Get the current session
          const { data: { session } } = await supabase.auth.getSession();

          // If we have a session, set the user
          if (session) {
            // Get user with metadata
            const { data: userData } = await supabase.auth.getUser();
            
            if (userData?.user) {
              const fullUser: User = {
                id: userData.user.id,
                email: userData.user.email || '',
                name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
                avatar_url: userData.user.user_metadata?.avatar_url,
                created_at: userData.user.created_at,
                user_metadata: userData.user.user_metadata,
              };
              
              // Fetch additional profile data if needed
              try {
                const profileData = await fetchProfileWithFallback(userData.user.id);
                if (profileData) {
                  fullUser.user_metadata = {
                    ...fullUser.user_metadata,
                    ...profileData
                  };
                }
              } catch (error) {
                console.error('Error fetching profile data:', error);
              }
              
              setUser(fullUser);
              setIsAuthenticated(true);
              
              // Mark authentication success
              if (window.__clearAuthFailures) {
                window.__clearAuthFailures();
              }
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
            
            // Record authentication failure for troubleshooting
            if (window.__recordAuthFailure) {
              window.__recordAuthFailure();
            }
          }
          
          // Set up auth state change listener
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                const { data: userData } = await supabase.auth.getUser();
                
                if (userData?.user) {
                  const fullUser: User = {
                    id: userData.user.id,
                    email: userData.user.email || '',
                    name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
                    avatar_url: userData.user.user_metadata?.avatar_url,
                    created_at: userData.user.created_at,
                    user_metadata: userData.user.user_metadata,
                  };
                  
                  setUser(fullUser);
                  setIsAuthenticated(true);
                  
                  // Mark authentication success
                  if (window.__clearAuthFailures) {
                    window.__clearAuthFailures();
                  }
                }
              } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          );
          
          // Clean up the listener on unmount
          return () => {
            authListener.subscription.unsubscribe();
          };
        } catch (error) {
          console.error('Auth initialization error:', error);
          setError(error instanceof Error ? error.message : 'Authentication error');
          
          // Record authentication failure for troubleshooting
          if (window.__recordAuthFailure) {
            window.__recordAuthFailure();
          }
          
          // If initialization fails, try fixing auth storage and retry
          if (window.__fixAuthStorage && retryCount < 2) {
            console.log('Retrying auth initialization...');
            window.__fixAuthStorage();
            setRetryCount(prev => prev + 1);
            // Let the retry happen on the next cycle
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } finally {
          setLoading(false);
          setIsInitialized(true);
          setIsInitializing(false);
        }
      };
      
      initialize();
    }
  }, [isInitializing, retryCount]);

  // Add this helper function to fetch profile with multiple fallbacks
  const fetchProfileWithFallback = async (userId: string): Promise<any> => {
    // First try the API endpoint with better error handling
    try {
      // Use direct fetch to add cache busting
      const timestamp = Date.now();
      const profileResponse = await fetch(`/api/auth/profile?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        return profileData;
      }
    } catch (apiError) {
      console.warn('Error fetching profile from API:', apiError);
    }
    
    // Fall back to direct database query
    try {
      if (supabaseClientSingleton) {
        const { data, error } = await supabaseClientSingleton
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (!error && data) {
          return data;
        }
        
        if (error) {
          console.warn('Error getting profile from database:', error.message);
        }
      }
    } catch (dbError) {
      console.warn('Error during direct profile query:', dbError);
    }
    
    // Last resort - check localStorage for cached profile
    try {
      const cachedProfile = localStorage.getItem(`profile-${userId}`);
      if (cachedProfile) {
        return JSON.parse(cachedProfile);
      }
    } catch (cacheError) {
      console.warn('Error reading cached profile:', cacheError);
    }
    
    // Return null if all methods fail
    return null;
  };

  // Handle sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // For local auth testing
      if (mockAuth || authBypass) {
        const mockUser = createMockUser();
        setUser(mockUser);
        setIsAuthenticated(true);
        
        // If using cookies for local auth
        setCookie('use-local-auth', 'true');
        setCookie('local-auth-user', JSON.stringify(mockUser));
        
        // Mock a delay for more realistic behavior
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoading(false);
        
        return { success: true };
      }

      // For normal authentication
      const supabase = getSupabaseClient();
      
      // Clear auth storage first to prevent issues
      if (window.__fixAuthStorage) {
        window.__fixAuthStorage();
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message);
        throw new Error(error.message);
      }

      if (data?.user) {
        const fullUser: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
          user_metadata: data.user.user_metadata,
        };

        setUser(fullUser);
        setIsAuthenticated(true);
        
        // Mark authentication success
        if (window.__clearAuthFailures) {
          window.__clearAuthFailures();
        }
        
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Record authentication failure
      if (window.__recordAuthFailure) {
        window.__recordAuthFailure();
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      if (mockAuth || authBypass) {
        // Set mock user for testing
        const mockUser = createMockUser();
        setUser({
          ...mockUser, 
          email, 
          name,
          user_metadata: { ...mockUser.user_metadata, name }
        });
        setLoading(false);
        return { success: true };
      }
      
      if (!supabaseClientSingleton) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabaseClientSingleton.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username: email.split('@')[0],
          }
        }
      });
      
      if (error) {
        setLoading(false);
        console.error('Sign up error:', error.message);
        return { success: false, error: error.message };
      }
      
      // Set the user if available
      if (data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: name || data.user.email?.split('@')[0] || 'User',
          avatar_url: '/avatar-placeholder.png',
          avatar: '/avatar-placeholder.png',
          created_at: data.user.created_at,
          user_metadata: {
            ...data.user.user_metadata,
            name
          },
          profile_completed: false
        };
        
        setUser(userData);
      }
      
      setLoading(false);
      
      // Create a profile for the user
      try {
        if (data.user && supabaseClientSingleton) {
          const { error: profileError } = await supabaseClientSingleton
            .from('profiles')
            .insert([
              { 
                user_id: data.user.id,
                name,
                email: email,
                username: email.split('@')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
          
          if (profileError) {
            console.error('Error creating profile:', profileError.message);
          }
        }
      } catch (profileError) {
        console.error('Exception creating profile:', profileError);
      }
      
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error('Sign up exception:', error);
      return { success: false, error: (error as Error).message };
    }
  };
  
  const signOut = async () => {
    setLoading(true);
    
    // Clear local auth first to avoid race conditions
    clearLocalAuth();
    
    try {
      if (supabaseClientSingleton) {
        await supabaseClientSingleton.auth.signOut();
      }
      
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const reloadUser = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      if (supabaseClientSingleton) {
        const { data, error } = await supabaseClientSingleton.auth.getUser();
        
        if (error || !data.user) {
          console.error('Error reloading user:', error);
          setLoading(false);
          return;
        }
        
        // Try to get profile via our custom API endpoint
        const { data: profileData, error: profileError } = await fetchProfileWithFallback(data.user.id);
        
        if (profileData && !profileError) {
          // Merge data from Supabase Auth with our profile data
          const mergedUser = { 
            ...data.user, 
            ...profileData,
            profile_completed: !!(
              data.user.user_metadata?.height &&
              data.user.user_metadata?.weight &&
              data.user.user_metadata?.age &&
              data.user.user_metadata?.gender
            )
          };
          
          setUser(mergedUser);
        } else {
          // Create a user with just the auth data
          const userWithRequiredFields: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            avatar_url: '/avatar-placeholder.png',
            avatar: '/avatar-placeholder.png',
            created_at: data.user.created_at,
            user_metadata: data.user.user_metadata || {},
            profile_completed: !!(
              data.user.user_metadata?.height &&
              data.user.user_metadata?.weight &&
              data.user.user_metadata?.age &&
              data.user.user_metadata?.gender
            )
          };
          
          setUser(userWithRequiredFields);
        }
      }
    } catch (error) {
      console.error('Error reloading user:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // For testing and development
  const setMockUser = () => {
    const mockUser = createMockUser();
    setUser(mockUser);
    
    // Set in localStorage for persistence
    localStorage.setItem('use-local-auth', 'true');
    localStorage.setItem('local-auth-user', JSON.stringify(mockUser));
    
    // Also set in cookies
    setCookie('use-local-auth', 'true');
    setCookie('local-auth-user', JSON.stringify(mockUser));
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoading,
        isInitialized,
        signIn,
        signUp,
        signOut,
        isAuthenticated,
        setMockUser,
        reloadUser,
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