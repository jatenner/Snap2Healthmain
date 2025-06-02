'use client';

/**
 * Client-side Supabase Client with Singleton Pattern
 * 
 * This module ensures that only one Supabase client instance is created,
 * preventing the "Multiple GoTrueClient instances detected" issue.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Track the singleton client instance
let clientInstance = null;
let instanceCount = 0;

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClientComponentClient() {
  instanceCount++;
  
  // If we already have an instance, return it
  if (clientInstance) {
    if (instanceCount > 1) {
      console.log('Reusing existing Supabase client instance (count:', instanceCount, ')');
    }
    return clientInstance;
  }
  
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  try {
    // Create a new instance without cookies (client-side)
    clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'supabase.auth.token',
      },
      global: {
        headers: {
          'X-Client-Info': 'snap2health-client',
        },
      }
    });
    
    console.log('Created Supabase client singleton (client-side)');
    return clientInstance;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}

// For memory management, clear the instance when needed
export function clearClientInstance() {
  clientInstance = null;
  instanceCount = 0;
  console.log('Cleared Supabase client instance');
} 