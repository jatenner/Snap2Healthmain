'use client';

/**
 * Client-side Authentication Utilities for Supabase
 * 
 * This module provides authentication functions that can be safely used
 * in client components without causing React Server Component errors.
 * 
 * IMPORTANT: This file is already properly set up with 'use client' directive
 * and should be used instead of server.ts for client components.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// Cache the current user to avoid multiple redundant requests
let cachedUser: User | null = null;

// Create a helper function to get the configured client
function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient();
  const result = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (result.data?.user) {
    cachedUser = result.data.user;
  }
  
  return result;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  const supabase = getSupabaseClient();
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  return result;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = getSupabaseClient();
  const result = await supabase.auth.signOut();
  cachedUser = null;
  return result;
}

/**
 * Get the current user's session
 */
export async function getSession() {
  const supabase = getSupabaseClient();
  const result = await supabase.auth.getSession();
  
  if (result.data?.session?.user) {
    cachedUser = result.data.session.user;
  }
  
  return result;
}

/**
 * Get the current user
 */
export async function getUser() {
  if (cachedUser) {
    return { data: { user: cachedUser }, error: null };
  }
  
  const supabase = getSupabaseClient();
  const result = await supabase.auth.getUser();
  
  if (result.data?.user) {
    cachedUser = result.data.user;
  }
  
  return result;
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated() {
  const { data } = await getSession();
  return !!data.session;
}

/**
 * Update user profile data in the profiles table
 */
export async function updateProfile(userId: string, profileData: any) {
  const supabase = getSupabaseClient();
  
  return await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString(),
    });
}

/**
 * Get a user's profile data
 */
export async function getProfile(userId: string) {
  if (!userId) return { data: null, error: new Error('User ID is required') };
  
  const supabase = getSupabaseClient();
  
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
} 