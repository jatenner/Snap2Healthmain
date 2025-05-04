/**
 * Supabase Client Singleton
 * Prevents the "Multiple GoTrueClient instances detected" error
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Store singleton instance
let instance = null;
let instanceCount = 0;

/**
 * Get the Supabase client singleton
 * @returns {Object} Supabase client instance
 */
export function getSupabaseClient() {
  if (instance) {
    return instance;
  }

  // Create fresh client only once
  if (typeof window !== 'undefined') {
    // Browser environment - use client component
    try {
      instance = createClientComponentClient();
      console.log('Created client-side Supabase singleton');
      
      // Track for debugging
      instanceCount++;
      window.__supabaseInstanceCount = instanceCount;
    } catch (err) {
      console.error('Error creating Supabase client:', err);
      
      // Fallback to direct creation if auth-helpers fail
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        instance = createClient(supabaseUrl, supabaseKey);
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
    
    instance = createClient(supabaseUrl, supabaseKey);
    console.log('Created server-side Supabase singleton');
  }
  
  return instance;
}

/**
 * Reset the singleton (for testing only)
 */
export function resetSupabaseClient() {
  instance = null;
  instanceCount = 0;
}

/**
 * Get the current instance count
 * @returns {number} Number of instances created
 */
export function getInstanceCount() {
  return instanceCount;
} 