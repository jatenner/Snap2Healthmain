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
const mockAuth = false; // Always disable mock auth

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  
  // Configure Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Only use mock in development if explicitly enabled
  const useMockAuth = false; // Always disable mock auth
  
  // Initialize Supabase client if credentials are available
  const supabase = supabaseUrl && supabaseAnonKey ? 
    createClient(supabaseUrl, supabaseAnonKey) : 
    null;
  
  if (!supabase && !useMockAuth) {
    console.warn('Supabase client not initialized and mock auth not enabled');
  } else if (!supabase) {
    console.log('Using mock Supabase client');
  }

  // Modify the initialize function to make it more resilient and handle auth issues better
  const initialize = async () => {
    setIsInitialized(false);
    setLoading(true);
    
    try {
      // Prevent multiple GoTrueClient instances by checking if we've already initialized
      const authInitialized = localStorage.getItem('auth-initialized');
      const currentTimestamp = Date.now();
      
      if (authInitialized) {
        try {
          const parsedTime = parseInt(authInitialized, 10);
          // If we initialized less than 5 seconds ago, wait a bit to prevent conflicts
          if (currentTimestamp - parsedTime < 5000) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (e) {
          console.warn('Error parsing auth timestamp:', e);
        }
      }
      
      // Check if we should use local auth first 
      // (this helps prevent multiple GoTrueClient instances)
      const useLocalAuth = 
        localStorage.getItem('use-local-auth') === 'true' || 
        getCookie('use-local-auth') === 'true' || 
        getCookie('auth-fallback') === 'active';
      
      if (useLocalAuth) {
        try {
          // Get user from localStorage or cookies
          const localUserStr = 
            localStorage.getItem('local-auth-user') || 
            getCookie('local-auth-user') as string;
            
          if (localUserStr) {
            const localUser = JSON.parse(localUserStr);
            setUser(localUser);
            setLoading(false);
            setIsInitialized(true);
            localStorage.setItem('auth-initialized', currentTimestamp.toString());
            return; // Exit early, no need to check Supabase
          }
        } catch (e) {
          console.warn('Error getting local auth user:', e);
        }
      }
      
      // Try to get user from Supabase auth
      if (supabase) {
        try {
          // Set a flag to track initialization to prevent duplicate instances
          localStorage.setItem('auth-initialized', currentTimestamp.toString());
          
          // Get session data
          const { data: { session } } = await supabase.auth.getSession();
          
          // Check if we have a session
          if (session) {
            try {
              // Get the user profile with a more resilient approach
              const profile = await fetchProfileWithFallback(session.user.id);
              
              // Create a complete user object
              const userData: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url || '/avatar-placeholder.png',
                created_at: session.user.created_at,
                user_metadata: {
                  ...session.user.user_metadata,
                  ...(profile || {})
                },
                profile_completed: !!(
                  session.user.user_metadata?.height &&
                  session.user.user_metadata?.weight &&
                  session.user.user_metadata?.age &&
                  session.user.user_metadata?.gender
                )
              };
              
              // Store essential user data in localStorage for redundancy
              try {
                const minimalUser = {
                  id: userData.id,
                  email: userData.email,
                  name: userData.name,
                  user_metadata: userData.user_metadata
                };
                localStorage.setItem('auth-user-backup', JSON.stringify(minimalUser));
              } catch (storageErr) {
                console.warn('Failed to cache user data:', storageErr);
              }
              
              setUser(userData);
            } catch (profileError) {
              console.error('Error fetching profile, using basic user data:', profileError);
              
              // Fall back to just the basic user data
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                created_at: session.user.created_at,
                user_metadata: session.user.user_metadata || {},
                profile_completed: false
              });
            }
          } else {
            // No session, try to recover from backup if available
            try {
              const backupUser = localStorage.getItem('auth-user-backup');
              if (backupUser) {
                console.log('No active session, using backup user data');
                setUser(JSON.parse(backupUser));
              } else {
                setUser(null);
              }
            } catch (backupErr) {
              console.warn('Error using backup user:', backupErr);
              setUser(null);
            }
          }
        } catch (authError) {
          console.error('Error during auth check:', authError);
          
          // Last resort - try local auth again
          try {
            const localUserStr = localStorage.getItem('local-auth-user');
            if (localUserStr) {
              setUser(JSON.parse(localUserStr));
            } else {
              setUser(null);
            }
          } catch (localErr) {
            console.error('Failed to get local user after auth error:', localErr);
            setUser(null);
          }
        }
      } else {
        console.warn('Supabase client not initialized, checking for local user');
        
        // Try local auth as a fallback
        try {
          const localUserStr = localStorage.getItem('local-auth-user');
          if (localUserStr) {
            setUser(JSON.parse(localUserStr));
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error('Error getting local user when Supabase unavailable:', e);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Unexpected error during auth initialization:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

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
      if (supabase) {
        const { data, error } = await supabase
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

  // Initialize user session on load
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Check Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { user: authUser } = session;
          
          if (authUser) {
            // Try to get profile via our custom API endpoint
            const { data: profileData, error: profileError } = await fetchProfileWithFallback(authUser.id);
            
            if (profileData && !profileError) {
              // Merge data from Supabase Auth with our profile data
              const mergedUser = { 
                ...authUser, 
                ...profileData,
                profile_completed: !!(
                  authUser.user_metadata?.height &&
                  authUser.user_metadata?.weight &&
                  authUser.user_metadata?.age &&
                  authUser.user_metadata?.gender
                )
              };
              
              setUser(mergedUser);
              setLoading(false);
              setIsInitialized(true);
              return;
            } else {
              console.log('Profile data not found, using auth data only');
              // Create a merged user that matches our User type
              const userWithRequiredFields: User = {
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                avatar_url: '/avatar-placeholder.png',
                avatar: '/avatar-placeholder.png',
                created_at: authUser.created_at,
                user_metadata: authUser.user_metadata || {},
                profile_completed: !!(
                  authUser.user_metadata?.height &&
                  authUser.user_metadata?.weight &&
                  authUser.user_metadata?.age &&
                  authUser.user_metadata?.gender
                )
              };
              
              setUser(userWithRequiredFields);
              setLoading(false);
              setIsInitialized(true);
              return;
            }
          }
        }
        
        // Check for local auth (cookie-based fallback)
        try {
          const useLocalAuth = localStorage.getItem('use-local-auth') === 'true' || 
                                getCookie('use-local-auth') === 'true';
          
          if (useLocalAuth) {
            // Get the user from localStorage
            const localUserString = localStorage.getItem('local-auth-user') || 
                                   getCookie('local-auth-user') as string;
            
            if (localUserString) {
              try {
                const localUser = JSON.parse(localUserString);
                console.log('Using local auth fallback');
                
                // Add required fields if missing
                const userWithRequiredFields: User = {
                  id: localUser.id || 'local-user-id',
                  email: localUser.email || 'user@example.com',
                  name: localUser.name || localUser.email?.split('@')[0] || 'User',
                  avatar_url: '/avatar-placeholder.png',
                  avatar: '/avatar-placeholder.png',
                  user_metadata: localUser.user_metadata || {},
                  profile_completed: !!(
                    localUser.user_metadata?.height &&
                    localUser.user_metadata?.weight &&
                    localUser.user_metadata?.age &&
                    localUser.user_metadata?.gender
                  )
                };
                
                setUser(userWithRequiredFields);
                setLoading(false);
                setIsInitialized(true);
                return;
              } catch (e) {
                console.error('Error parsing local user:', e);
              }
            }
          }
        } catch (localAuthError) {
          console.error('Error checking local auth:', localAuthError);
        }
        
        // If no session or local auth, set no user
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error during auth initialization:', error);
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    initialize();
    
    // Listen for auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { user: authUser } = session;
          
          try {
            // Try to get profile via our custom API endpoint
            const { data: profileData, error: profileError } = await fetchProfileWithFallback(authUser.id);
            
            if (profileData && !profileError) {
              // Merge data from Supabase Auth with our profile data
              const mergedUser = { 
                ...authUser, 
                ...profileData,
                profile_completed: !!(
                  authUser.user_metadata?.height &&
                  authUser.user_metadata?.weight &&
                  authUser.user_metadata?.age &&
                  authUser.user_metadata?.gender
                )
              };
              
              setUser(mergedUser);
              setLoading(false);
            } else {
              // Create a user with just the auth data
              const userWithRequiredFields: User = {
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                avatar_url: '/avatar-placeholder.png',
                avatar: '/avatar-placeholder.png',
                created_at: authUser.created_at,
                user_metadata: authUser.user_metadata || {},
                profile_completed: !!(
                  authUser.user_metadata?.height &&
                  authUser.user_metadata?.weight &&
                  authUser.user_metadata?.age &&
                  authUser.user_metadata?.gender
                )
              };
              
              setUser(userWithRequiredFields);
              setLoading(false);
            }
          } catch (e) {
            console.error('Error updating user on auth state change:', e);
            
            // At minimum, set the auth user
            const userWithRequiredFields: User = {
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              avatar_url: '/avatar-placeholder.png',
              avatar: '/avatar-placeholder.png',
              created_at: authUser.created_at,
              user_metadata: authUser.user_metadata || {},
              profile_completed: false
            };
            
            setUser(userWithRequiredFields);
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear local auth data
          clearLocalAuth();
          setUser(null);
          setLoading(false);
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      if (useMockAuth) {
        // Set mock user for testing
        const mockUser = createMockUser();
        setUser(mockUser);
        setLoading(false);
        return { success: true };
      }
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setLoading(false);
        console.error('Sign in error:', error.message);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        try {
          const { data: profileData, error: profileError } = await fetchProfileWithFallback(data.user.id);
          
          let userData: User;
          
          if (profileData && !profileError) {
            userData = { 
              ...data.user, 
              ...profileData,
              profile_completed: !!(
                data.user.user_metadata?.height &&
                data.user.user_metadata?.weight &&
                data.user.user_metadata?.age &&
                data.user.user_metadata?.gender
              )
            };
          } else {
            userData = {
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
          }
          
          setUser(userData);
        } catch (e) {
          console.error('Error fetching profile after login:', e);
          
          // Set minimal user data
          const userData: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            avatar_url: '/avatar-placeholder.png',
            avatar: '/avatar-placeholder.png',
            created_at: data.user.created_at,
            user_metadata: data.user.user_metadata || {},
            profile_completed: false
          };
          
          setUser(userData);
        }
      }
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error('Sign in exception:', error);
      return { success: false, error: (error as Error).message };
    }
  };
  
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      if (useMockAuth) {
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
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase.auth.signUp({
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
        if (data.user && supabase) {
          const { error: profileError } = await supabase
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
      if (supabase) {
        await supabase.auth.signOut();
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
      
      if (supabase) {
        const { data, error } = await supabase.auth.getUser();
        
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
        isLoading: loading, // For backwards compatibility
        isInitialized,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
        setMockUser: useMockAuth ? setMockUser : undefined,
        reloadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 