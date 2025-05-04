/**
 * Singleton implementation for Supabase client
 * This ensures only one GoTrueClient instance is created across the app
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Store the single instance
let supabaseInstance = null;

// Counter for debugging
let instanceCounter = 0;

export function getSupabaseBrowser() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Initialize the instance if it doesn't exist yet
  supabaseInstance = createClientComponentClient();
  instanceCounter++;
  
  console.log('Created Supabase client singleton');
  
  return supabaseInstance;
}

// For debugging - check if we have multiple instances
export function getInstanceCounter() {
  return instanceCounter;
}

// Force reset (only for testing/debugging)
export function resetSupabaseClient() {
  supabaseInstance = null;
  instanceCounter = 0;
} 