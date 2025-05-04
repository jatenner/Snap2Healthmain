import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Define response type to fix TypeScript errors
interface AuthDebugResponse {
  timestamp: string;
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    lastSignIn: string;
    created_at: string;
  } | null;
  supabase: {
    url: string;
    error: string | null;
  };
  localAuth: {
    enabled: boolean;
    user: any | null;
  };
  cookies?: {
    all: Array<{name: string; value: string}>;
  };
  env?: {
    NODE_ENV: string | undefined;
    AUTH_BYPASS: string | undefined;
  };
}

// API route to check authentication status and debug authentication
export async function GET(req: NextRequest) {
  try {
    // Get URL params
    const { searchParams } = new URL(req.url);
    const reset = searchParams.get('reset') === 'true';
    const detailed = searchParams.get('detailed') === 'true';
    
    // Get all cookies for debugging
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll().map(c => ({
      name: c.name,
      value: c.name.includes('token') ? `${c.value.substring(0, 10)}...` : c.value
    }));
    
    // Look specifically for local auth cookie
    const localAuthCookie = cookieStore.get('local-auth-user');
    const useLocalAuth = cookieStore.get('use-local-auth');
    
    // Initialize Supabase clients
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let supabase: any;
    let routeHandlerClient: any;
    
    if (supabaseUrl && supabaseAnonKey) {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      try {
        routeHandlerClient = createRouteHandlerClient({ cookies: () => cookieStore });
      } catch (e) {
        console.error('Error creating route handler client:', e);
      }
    }

    // If reset is true, sign out the user
    if (reset && routeHandlerClient) {
      await routeHandlerClient.auth.signOut();
      
      // Also clear local auth cookies
      cookieStore.delete('local-auth-user');
      cookieStore.delete('use-local-auth');
      
      return NextResponse.json({ 
        status: 'success', 
        message: 'Session cleared successfully',
        localAuthCleared: true
      });
    }
    
    // Get Supabase session
    let sessionResult = { data: { session: null }, error: null };
    if (supabase) {
      try {
        sessionResult = await supabase.auth.getSession();
      } catch (e) {
        sessionResult.error = `Error getting session: ${e.message}`;
      }
    }
    
    const { data: { session }, error: sessionError } = sessionResult;
    
    // Build response data
    const responseData: AuthDebugResponse = {
      timestamp: new Date().toISOString(),
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        lastSignIn: session.user.last_sign_in_at || '',
        created_at: session.user.created_at || ''
      } : null,
      supabase: {
        url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not configured',
        error: sessionError ? sessionError.message : null
      },
      localAuth: {
        enabled: useLocalAuth?.value === 'true',
        user: localAuthCookie ? JSON.parse(localAuthCookie.value) : null
      }
    };
    
    // Add detailed information if requested
    if (detailed) {
      responseData.cookies = {
        all: allCookies,
      };
      responseData.env = {
        NODE_ENV: process.env.NODE_ENV,
        AUTH_BYPASS: process.env.NEXT_PUBLIC_AUTH_BYPASS
      };
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ 
      error: `Authentication debug error: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// API route to set local authentication for testing
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { email, useLocalAuth, reset } = body;
    
    // Get cookie store
    const cookieStore = cookies();
    
    // If reset is true, clear all auth cookies
    if (reset) {
      cookieStore.delete('local-auth-user');
      cookieStore.delete('use-local-auth');
      
      return NextResponse.json({
        success: true,
        message: 'Local authentication reset successfully',
      });
    }
    
    // If we want to set local auth
    if (email && useLocalAuth) {
      // Create a mock user
      const mockUser = {
        id: 'local-user-id',
        email,
        name: email.split('@')[0],
        avatar_url: null,
        avatar: '/avatar-placeholder.png',
        created_at: new Date().toISOString(),
      };
      
      // Set the cookies
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      cookieStore.set('local-auth-user', JSON.stringify(mockUser), { maxAge });
      cookieStore.set('use-local-auth', 'true', { maxAge });
      
      return NextResponse.json({
        success: true,
        message: 'Local authentication set successfully',
        user: mockUser
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Missing email or useLocalAuth flag',
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Error setting local auth: ${error.message}`,
    }, { status: 500 });
  }
} 