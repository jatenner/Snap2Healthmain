/**
 * Authentication helpers for Snap2Health
 */
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

/**
 * Get current authenticated user ID from session
 * Returns { userId, error }
 */
export async function getUserIdFromSession(req?: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerComponentClient({ cookies });
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error fetching session:', sessionError.message);
      return { userId: null, error: sessionError };
    }
    
    // Check if we're allowing bypass for development
    const bypassAuth = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
    const userId = session?.user?.id || (bypassAuth ? '00000000-0000-0000-0000-000000000000' : null);
    
    if (!userId && !bypassAuth) {
      return { userId: null, error: new Error('User not authenticated') };
    }
    
    return { userId, error: null };
  } catch (error) {
    console.error('Auth error:', error);
    return { userId: null, error };
  }
}

/**
 * Check if user is authenticated, redirect to login if not
 */
export async function requireAuth() {
  const { userId, error } = await getUserIdFromSession();
  
  if (!userId || error) {
    // Add a query parameter for redirect after login
    redirect('/login?redirect=true');
  }
  
  return userId;
}

/**
 * Get current user profile data
 */
export async function getUserProfile() {
  try {
    const { userId, error } = await getUserIdFromSession();
    
    if (!userId || error) {
      return { profile: null, error: new Error('Not authenticated') };
    }
    
    const supabase = createServerComponentClient({ cookies });
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      return { profile: null, error: profileError };
    }
    
    return { profile, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { profile: null, error };
  }
}

/**
 * Check auth status, return { user, profile, isLoading, error }
 * Client-side version
 */
export function useAuth() {
  const supabase = createClientComponentClient();
  
  // This is a stub - to be expanded with React hooks if needed
  // For now, we'll just provide the server functions
  
  return {
    supabase,
    signOut: async () => {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };
}

/**
 * Create auth response with no-cache headers
 */
export function createAuthResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}