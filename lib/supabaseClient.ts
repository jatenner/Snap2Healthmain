import { createClient } from '@supabase/supabase-js';

// Validate Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if required environment variables are defined
if (!supabaseUrl) {
  console.error('[supabaseClient] ERROR: NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  console.error('[supabaseClient] ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

if (!supabaseServiceKey) {
  console.error('[supabaseClient] WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Some write operations may fail.');
}

// Initialize the Supabase client with the regular anon key
export const supabase = createClient(
  supabaseUrl || 'https://cyrztlmzanhfybqsakgc.supabase.co', 
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cnp0bG16YW5oZnlicXNha2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjE3OTUsImV4cCI6MjA2MTE5Nzc5NX0.weWEWeSASoOGhXC6Gg5diwCBffxdV2NjuaHjjHkq3SE'
);

// Initialize a second client with the service role key for admin operations
export const adminSupabase = supabaseServiceKey 
  ? createClient(
      supabaseUrl || 'https://cyrztlmzanhfybqsakgc.supabase.co', 
      supabaseServiceKey
    )
  : null;

/**
 * Get the appropriate Supabase client based on the operation
 * @param requireAdmin - Whether the operation requires admin privileges
 * @returns The appropriate Supabase client
 */
export function getSupabaseClient(requireAdmin: boolean = false): typeof supabase {
  if (requireAdmin && adminSupabase) {
    return adminSupabase;
  }
  return supabase;
} 