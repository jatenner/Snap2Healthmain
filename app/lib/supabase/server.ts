import { createClient } from '@supabase/supabase-js';
import { checkSupabaseConfig } from '../env-checker';

/**
 * Get a server-side Supabase client
 * This is used for server components and API routes
 */
export function getSupabaseClient() {
  // Get and validate configuration
  const config = checkSupabaseConfig();
  
  if (!config.available || !config.url || !config.anonKey) {
    console.error('[Supabase Server] Missing or invalid Supabase configuration');
    throw new Error('Invalid Supabase configuration');
  }
  
  // Create and return the client
  const supabase = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  
  return supabase;
} 