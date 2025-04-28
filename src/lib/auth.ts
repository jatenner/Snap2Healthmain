import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from './supabaseClient';

/**
 * Get the user ID from the session
 * Handles both cookie-based auth and token-based auth
 */
export async function getUserIdFromSession(request: NextRequest) {
  try {
    // Check if we're in auth bypass mode
    if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
      console.log('[getUserIdFromSession] Using bypass auth mode with test user ID');
      return { userId: 'test-user-bypass' };
    }
    
    // Try to get user ID from cookies first (for server components)
    try {
      const cookieStore = cookies();
      const supabaseServer = createRouteHandlerClient({ cookies: () => cookieStore });
      const { data: { user }, error } = await supabaseServer.auth.getUser();
      
      if (user?.id) {
        console.log('[getUserIdFromSession] User found in cookie session:', user.id);
        return { userId: user.id };
      }
      
      if (error) {
        console.log('[getUserIdFromSession] Cookie auth error:', error.message);
      }
    } catch (cookieError) {
      console.error('[getUserIdFromSession] Error with cookie auth:', cookieError);
    }
    
    // Fallback to token in Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Validate the token using Supabase
      const { data: { user: apiUser }, error: apiError } = await supabase.auth.getUser(token);
      
      if (apiUser?.id) {
        console.log('[getUserIdFromSession] User found via API token:', apiUser.id);
        return { userId: apiUser.id };
      }
      
      if (apiError) {
        console.error('[getUserIdFromSession] Token validation error:', apiError);
      }
    }
    
    console.log('[getUserIdFromSession] No user ID found in session');
    return { userId: null };
  } catch (error) {
    console.error('[getUserIdFromSession] Error retrieving user ID:', error);
    return { userId: null };
  }
} 