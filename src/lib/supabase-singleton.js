/**
 * Enhanced Supabase Client Singleton v2
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

// Track globally to prevent race conditions
if (typeof window !== 'undefined') {
  window.__supabaseClientCreationLock = window.__supabaseClientCreationLock || false;
  window.__supabaseClientInstance = window.__supabaseClientInstance || null;
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

  // Prevent multiple simultaneous creations
  if (isCreatingInstance || (typeof window !== 'undefined' && window.__supabaseClientCreationLock)) {
    console.warn('Another creation in progress, waiting...');
    
    // Simple retry logic - will only retry once
    const startTime = Date.now();
    while (isCreatingInstance || (typeof window !== 'undefined' && window.__supabaseClientCreationLock)) {
      // Timeout after 2 seconds to prevent infinite loop
      if (Date.now() - startTime > 2000) {
        console.error('Timed out waiting for Supabase client creation, creating new instance');
        break;
      }
      
      // Check if instance was created while waiting
      if (instance || (typeof window !== 'undefined' && window.__supabaseClientInstance)) {
        return instance || window.__supabaseClientInstance;
      }
    }
  }
  
  // Set the creation lock
  isCreatingInstance = true;
  if (typeof window !== 'undefined') {
    window.__supabaseClientCreationLock = true;
  }
  
  try {
    // Create fresh client only once
    if (typeof window !== 'undefined') {
      // Browser environment - use client component
      try {
        console.log('Creating client-side Supabase singleton');
        instance = createClientComponentClient();
        
        // Store globally for cross-module access
        window.__supabaseClientInstance = instance;
        
        // Track for debugging
        instanceCount++;
        window.__supabaseInstanceCount = instanceCount;
        lastCreationTime = Date.now();
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
          window.__supabaseClientInstance = instance;
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
 */
export function resetSupabaseClient() {
  instance = null;
  instanceCount = 0;
  lastCreationTime = 0;
  isCreatingInstance = false;
  
  if (typeof window !== 'undefined') {
    window.__supabaseClientInstance = null;
    window.__supabaseClientCreationLock = false;
    window.__supabaseInstanceCount = 0;
    
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
    hasInstance: !!instance,
    hasGlobalInstance: typeof window !== 'undefined' && !!window.__supabaseClientInstance,
    creationLock: isCreatingInstance || (typeof window !== 'undefined' && window.__supabaseClientCreationLock)
  };
} 