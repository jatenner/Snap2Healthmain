/**
 * Enhanced Supabase Client Singleton v3
 * Prevents the "Multiple GoTrueClient instances detected" error 
 * with aggressive safeguards and monitoring
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Store singleton instance
let instance = null;
let instanceCount = 0;
let lastCreationTime = 0;
let isCreatingInstance = false;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

// Track globally to prevent race conditions
if (typeof window !== 'undefined') {
  window.__supabaseClientCreationLock = window.__supabaseClientCreationLock || false;
  window.__supabaseClientInstance = window.__supabaseClientInstance || null;
  window.__supabaseInitStartTime = window.__supabaseInitStartTime || Date.now();
}

/**
 * Check if client initialization is currently underway
 * @returns {boolean} True if initialization is in progress
 */
function isInitializing() {
  return isCreatingInstance || 
         (typeof window !== 'undefined' && window.__supabaseClientCreationLock);
}

/**
 * Wait for initialization to complete with timeout
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<boolean>} - Resolves true if initialization completed, false if timed out
 */
function waitForInitialization(timeout = 2000) {
  if (!isInitializing()) {
    return Promise.resolve(true);
  }
  
  const startTime = Date.now();
  
  return new Promise(resolve => {
    const checkInterval = setInterval(() => {
      if (!isInitializing()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.error('Timed out waiting for Supabase initialization');
        resolve(false);
      }
    }, 50);
  });
}

/**
 * Get the Supabase client singleton
 * @returns {Object} Supabase client instance
 */
export function getSupabaseClient() {
  // First, check for global instance if in browser
  if (typeof window !== 'undefined' && window.__supabaseClientInstance) {
    console.log('Using globally stored Supabase instance');
    return window.__supabaseClientInstance;
  }
  
  // Then check for module-level instance
  if (instance) {
    return instance;
  }

  // Track initialization attempts
  initializationAttempts++;
  
  // If too many attempts, clear any stale state
  if (initializationAttempts > MAX_INITIALIZATION_ATTEMPTS) {
    console.warn(`Excessive initialization attempts (${initializationAttempts}), resetting state`);
    resetSupabaseClient(true);
    initializationAttempts = 1;
  }

  // Critical section - ensure only one thread creates the client
  if (isInitializing()) {
    console.warn('Another Supabase client creation in progress, waiting...');
    
    // Wait for existing initialization to complete or timeout
    return waitForInitialization().then(completed => {
      if (completed && (instance || (typeof window !== 'undefined' && window.__supabaseClientInstance))) {
        return instance || window.__supabaseClientInstance;
      } else {
        console.warn('Initialization wait timed out, creating new instance');
        return createSupabaseClientInstance();
      }
    });
  }
  
  return createSupabaseClientInstance();
}

/**
 * Internal function to create the actual Supabase client instance
 * @returns {Object} The Supabase client instance
 */
function createSupabaseClientInstance() {
  // Set the creation lock
  isCreatingInstance = true;
  if (typeof window !== 'undefined') {
    window.__supabaseClientCreationLock = true;
    window.__supabaseInitStartTime = Date.now();
  }
  
  try {
    // Create fresh client only once
    if (typeof window !== 'undefined') {
      // Browser environment - use client component
      try {
        console.log('Creating client-side Supabase singleton');
        
        // Add a small delay before client creation to prevent race conditions
        // This is critical for fixing the "Multiple GoTrueClient instances" error
        if (typeof window !== 'undefined' && window.setTimeout) {
          const startTime = Date.now();
          while (Date.now() - startTime < 20) {
            // Intentional tight loop to introduce a small delay
            // This gives a chance for any existing client creation to complete
          }
        }
        
        instance = createClientComponentClient();
        
        // Store globally for cross-module access
        if (typeof window !== 'undefined') {
          window.__supabaseClientInstance = instance;
          
          // Track for debugging
          instanceCount++;
          window.__supabaseInstanceCount = instanceCount;
          lastCreationTime = Date.now();
          
          // Set a flag to indicate successful initialization
          window.__supabaseInitialized = true;
        }
        
        console.log('Created Supabase singleton (count:', instanceCount, ')');
      } catch (err) {
        console.error('Error creating Supabase client:', err);
        
        // Fallback to direct creation if auth-helpers fail
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          instance = createClient(supabaseUrl, supabaseKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storageKey: 'supabase.auth.token'
            }
          });
          
          // Store globally
          if (typeof window !== 'undefined') {
            window.__supabaseClientInstance = instance;
            window.__supabaseInitialized = true;
          }
          
          console.log('Created fallback Supabase client');
        } else {
          throw new Error('Missing Supabase credentials');
        }
      }
    } else {
      // Server environment - use direct creation
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
      }
      
      instance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      console.log('Created server-side Supabase singleton');
    }
    
    return instance;
  } catch (error) {
    console.error('Error in createSupabaseClientInstance:', error);
    throw error;
  } finally {
    // Release the lock
    isCreatingInstance = false;
    if (typeof window !== 'undefined') {
      window.__supabaseClientCreationLock = false;
    }
  }
}

/**
 * Reset the singleton (for testing or recovery)
 * @param {boolean} force - Force reset even if there's no error indication
 */
export function resetSupabaseClient(force = false) {
  // Only reset if we have a genuine reason to, or force is true
  if (!force && 
      !initializationAttempts || 
      initializationAttempts <= MAX_INITIALIZATION_ATTEMPTS) {
    return;
  }
  
  instance = null;
  instanceCount = 0;
  lastCreationTime = 0;
  isCreatingInstance = false;
  initializationAttempts = 0;
  
  if (typeof window !== 'undefined') {
    window.__supabaseClientInstance = null;
    window.__supabaseClientCreationLock = false;
    window.__supabaseInstanceCount = 0;
    window.__supabaseInitialized = false;
    
    // Clear auth-related storage
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase.auth.token') || 
          key.includes('supabase.auth.refreshToken') ||
          key.includes('sb-') ||
          key.includes('gotrue') ||
          key.startsWith('supabase.')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        console.log('Removing localStorage key:', key);
        localStorage.removeItem(key);
      });
      
      // Set flag indicating reset happened
      localStorage.setItem('supabase-client-reset-time', Date.now().toString());
      
      console.log('Auth storage cleared during reset');
    } catch (err) {
      console.error('Error clearing auth storage:', err);
    }
  }
  
  console.log('Supabase client singleton reset');
}

/**
 * Get the current instance info for debugging
 */
export function getInstanceInfo() {
  return {
    instanceCount,
    lastCreationTime,
    initializationAttempts,
    hasInstance: !!instance,
    hasGlobalInstance: typeof window !== 'undefined' && !!window.__supabaseClientInstance,
    creationLock: isCreatingInstance || (typeof window !== 'undefined' && window.__supabaseClientCreationLock),
    initialized: typeof window !== 'undefined' && !!window.__supabaseInitialized
  };
} 