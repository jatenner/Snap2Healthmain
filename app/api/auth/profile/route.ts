import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Default profile to return when auth fails
const FALLBACK_PROFILE = {
  id: 'temporary-profile',
  name: 'Guest User',
  email: null,
  avatar_url: '/avatar-placeholder.png',
  user_metadata: {
    defaultGoal: 'General Wellness'
  },
  auth_status: 'fallback',
  message: 'Using fallback profile because authentication failed'
};

// Helper to add CORS headers to all responses
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(request: NextRequest) {
  try {
    // Add cache control headers to prevent caching
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };
    
    // Parse cookie value for local auth
    let useLocalAuth = false;
    let localAuthUser = null;
    
    try {
      const cookiesList = request.cookies;
      useLocalAuth = cookiesList.get('use-local-auth')?.value === 'true';
      
      // Get the local auth user if applicable
      if (useLocalAuth) {
        const localUserCookie = cookiesList.get('local-auth-user')?.value;
        if (localUserCookie) {
          localAuthUser = JSON.parse(decodeURIComponent(localUserCookie));
        }
      }
    } catch (cookieError) {
      console.error('Error parsing cookies:', cookieError);
    }
    
    // If using local auth, return the user from the cookie
    if (useLocalAuth && localAuthUser) {
      return addCorsHeaders(NextResponse.json({
        ...localAuthUser,
        auth_type: 'local',
      }, { headers }));
    }
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check auth status first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If auth fails or no user, return fallback profile with 200 status
    if (authError || !user) {
      console.warn('Auth failed in profile API. Error:', authError?.message || 'No user found');
      return addCorsHeaders(NextResponse.json({
        ...FALLBACK_PROFILE,
        timestamp: new Date().toISOString()
      }, { status: 200, headers }));
    }
    
    // Try to get profile data from database
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError || !profile) {
        // If profile fetch fails, return basic user info with user metadata
        return addCorsHeaders(NextResponse.json({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || '/avatar-placeholder.png',
          created_at: user.created_at,
          user_metadata: user.user_metadata || {},
          auth_status: 'authenticated',
          profile_status: 'missing'
        }, { headers }));
      }
      
      // Return the combined user and profile data
      return addCorsHeaders(NextResponse.json({
        ...profile,
        email: user.email,
        user_metadata: user.user_metadata || {},
        auth_status: 'authenticated',
        profile_status: 'complete'
      }, { headers }));
    } catch (profileError) {
      console.error('Error fetching profile:', profileError);
      
      // Return basic user info on profile error
      return addCorsHeaders(NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || '/avatar-placeholder.png',
        created_at: user.created_at,
        user_metadata: user.user_metadata || {},
        auth_status: 'authenticated',
        profile_status: 'error',
        error_message: 'Failed to fetch profile data'
      }, { headers }));
    }
  } catch (error) {
    console.error('Unexpected error in profile API:', error);
    
    // Even in case of catastrophic error, return a 200 with fallback data
    return addCorsHeaders(NextResponse.json({
      ...FALLBACK_PROFILE,
      error_type: 'server_error',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    }));
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return addCorsHeaders(
    new NextResponse(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  );
} 