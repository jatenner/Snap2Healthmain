/**
 * Supabase Client Singleton
 * 
 * This file creates and exports a singleton instance of the Supabase client.
 * This ensures we have only one instance of the client throughout the application.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Type declaration for window.ENV
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      APP_ENV?: string;
      AUTH_BYPASS?: boolean;
      MOCK_AUTH?: boolean;
    };
    __ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    };
    process?: {
      env?: {
        NEXT_PUBLIC_SUPABASE_URL?: string;
        NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      }
    };
    initializeSupabase?: () => SupabaseClient | null;
  }
}

// Get environment variables from various sources with improved error handling
function getEnvVars() {
  console.log('[Supabase] Getting environment variables');
  
  // Check if we're in a client-side context
  const isClient = typeof window !== 'undefined';
  
  // Hardcoded fallback values to ensure the app works
  const fallbackSupabaseUrl = 'https://cyrztlmzanhfybqsakgc.supabase.co';
  const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cnp0bG16YW5oZnlicXNha2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjE3OTUsImV4cCI6MjA2MTE5Nzc5NX0.weWEWeSASoOGhXC6Gg5diwCBffxdV2NjuaHjjHkq3SE';
  
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  
  if (isClient) {
    console.log('[Supabase] Checking client-side environment variables');
    
    // Priority 1: Check window.process.env (injected by our fix script)
    if (window.process?.env?.NEXT_PUBLIC_SUPABASE_URL && window.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseUrl = window.process.env.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log('[Supabase] Using client-side ENV values from window.process.env');
      return { supabaseUrl, supabaseAnonKey };
    }
    
    // Priority 2: Check direct window.ENV (from our fix script)
    if (window.ENV?.NEXT_PUBLIC_SUPABASE_URL && window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseUrl = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log('[Supabase] Using client-side ENV values from window.ENV');
      return { supabaseUrl, supabaseAnonKey };
    }
    
    // Priority 3: Check window.__ENV 
    if (window.__ENV?.NEXT_PUBLIC_SUPABASE_URL && window.__ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseUrl = window.__ENV.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = window.__ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log('[Supabase] Using client-side ENV values from window.__ENV');
      return { supabaseUrl, supabaseAnonKey };
    }

    // Priority 4: Check alternate key names in window objects
    if (window.ENV?.SUPABASE_URL && window.ENV?.SUPABASE_ANON_KEY) {
      supabaseUrl = window.ENV.SUPABASE_URL;
      supabaseAnonKey = window.ENV.SUPABASE_ANON_KEY;
      console.log('[Supabase] Using client-side ENV values from window.ENV with alternate keys');
      return { supabaseUrl, supabaseAnonKey };
    }
    
    // Priority 5: Check direct window properties
    if (window.supabaseUrl && window.supabaseKey) {
      supabaseUrl = window.supabaseUrl;
      supabaseAnonKey = window.supabaseKey;
      console.log('[Supabase] Using client-side global variables from window');
      return { supabaseUrl, supabaseAnonKey };
    }
  }
  
  // Priority 6: Try process.env for server-side
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log('[Supabase] Using server-side ENV values from process.env');
      return { supabaseUrl, supabaseAnonKey };
    }
  } catch (error) {
    console.warn('[Supabase] Error accessing process.env, will use fallbacks', error);
  }
  
  // Priority 7: Use hardcoded fallbacks as last resort
  console.warn('[Supabase] Using hardcoded fallback credentials');
  return { 
    supabaseUrl: fallbackSupabaseUrl, 
    supabaseAnonKey: fallbackSupabaseAnonKey 
  };
}

// Use the singleton pattern for the Supabase client
let supabaseInstance: SupabaseClient | null = null;

// Create the Supabase client with proper auth configuration
function createSupabaseClient() {
  try {
    console.log('[Supabase] Creating Supabase client');
    const { supabaseUrl, supabaseAnonKey } = getEnvVars();
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Supabase] Cannot create client: missing environment variables');
      throw new Error('Missing Supabase environment variables');
    }
    
    console.log(`[Supabase] URL: ${supabaseUrl.substring(0, 20)}..., Key: ${supabaseAnonKey.substring(0, 10)}...`);
    
    // Check for browser-injected direct client first
    if (typeof window !== 'undefined' && window.initializeSupabase) {
      const directClient = window.initializeSupabase();
      if (directClient) {
        console.log('[Supabase] Using browser-injected direct client');
        return directClient;
      }
    }
    
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'supabase.auth.token',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Use custom storage for better cross-browser support
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null;
            try {
              return localStorage.getItem(key);
            } catch (error) {
              console.error('[Supabase] Error accessing localStorage:', error);
              return null;
            }
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') return;
            try {
              localStorage.setItem(key, value);
            } catch (error) {
              console.error('[Supabase] Error writing to localStorage:', error);
            }
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return;
            try {
              localStorage.removeItem(key);
            } catch (error) {
              console.error('[Supabase] Error removing from localStorage:', error);
            }
          }
        }
      }
    });

    console.log('[Supabase] Client created successfully');
    return client;
    
  } catch (error) {
    console.error('[Supabase] Error in createSupabaseClient:', error);
    throw error;
  }
}

// Function to get the singleton instance with error handling
export function getSupabaseClient() {
  try {
    // Always create a fresh client in server context
    if (typeof window === 'undefined') {
      return createSupabaseClient();
    }
    
    // Create singleton instance if it doesn't exist
    if (!supabaseInstance) {
      supabaseInstance = createSupabaseClient();
      console.log('[Supabase] Client initialized successfully');
    }
    
    return supabaseInstance;
  } catch (error) {
    console.error('[Supabase] Critical error creating client:', error);
    throw error;
  }
}

/**
 * Checks if a session token exists in local storage
 * This is useful for checking authentication status on the client side
 */
export function hasStoredSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check for auth data in localStorage - look for both old and new formats
    const hasSession = 
      localStorage.getItem('supabase.auth.token') !== null || 
      localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, '').split('.')[0] + '-auth-token') !== null;
    return hasSession;
  } catch (e) {
    console.error('[Supabase] Error checking for stored session:', e);
    return false;
  }
}

/**
 * Helper function to get authenticated user ID from local storage
 */
export function getLocalUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try primary storage location
    const authData = localStorage.getItem('supabase.auth.token');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed?.currentSession?.user?.id || null;
      } catch (e) {
        console.error('[Supabase] Error parsing primary auth data');
      }
    }
    
    // Try alternate storage format (sb-{project}-auth-token)
    try {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, '').split('.')[0] || 'cyrztlmzanhfybqsakgc';
      const alternateAuthData = localStorage.getItem(`sb-${projectRef}-auth-token`);
      if (alternateAuthData) {
        const parsed = JSON.parse(alternateAuthData);
        return parsed?.user?.id || null;
      }
    } catch (e) {
      console.error('[Supabase] Error accessing alternate auth data');
    }
    
    return null;
  } catch (e) {
    console.error('[Supabase] Error parsing auth data:', e);
    return null;
  }
}

// Initialize auth state immediately if in browser environment
if (typeof window !== 'undefined') {
  // Get the client instance to ensure it's initialized
  const supabase = getSupabaseClient();
  
  // Handle URL hash for OAuth flows
  const handleAuthTokensInUrl = async () => {
    // Handle hash-based redirects from OAuth providers
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    
    if (accessToken && refreshToken) {
      console.log('[Supabase] Found auth tokens in URL hash, setting session');
      try {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
      } catch (e) {
        console.error('[Supabase] Error setting session from URL tokens:', e);
      }
    }
  };
  
  // Run the handler
  handleAuthTokensInUrl();
} 