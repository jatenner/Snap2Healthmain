/**
 * Authentication utilities for Snap2Health
 */

import { AuthResponse } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-singleton';

/**
 * Get the current auth session
 */
export const getCurrentSession = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return data.session;
};

/**
 * Get the current user
 */
export const getCurrentUser = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return data.user;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  const supabase = getSupabaseClient();
  const response = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return response;
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string, metadata?: any): Promise<AuthResponse> => {
  const supabase = getSupabaseClient();
  const response = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {}
    }
  });
  
  return response;
};

/**
 * Sign out the current user
 */
export const signOutUser = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    return false;
  }
  
  return true;
};

/**
 * Check if user has a valid session
 */
export const hasValidSession = async () => {
  const session = await getCurrentSession();
  return !!session;
}; 