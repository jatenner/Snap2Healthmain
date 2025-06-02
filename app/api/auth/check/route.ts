import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic route
export const dynamic = 'force-dynamic';

// Auth check endpoint
export async function GET(req: NextRequest) {
  try {
    // Get authorization and admin bypass headers
    const authHeader = req.headers.get('authorization');
    const adminBypass = req.headers.get('x-admin-bypass') === 'true';
    const userId = req.headers.get('x-user-id');
    
    // Allow direct access for certain paths in development mode
    const isDevMode = process.env.NODE_ENV === 'development';
    const url = req.nextUrl.pathname;
    const isEmergencyPath = url.includes('emergency') || 
                            url.includes('fix-schema') || 
                            url.includes('test-snap2health') || 
                            url.includes('snap2health-test');
    
    if (isDevMode && (adminBypass || isEmergencyPath)) {
      console.log('[Auth Check] Dev mode bypass for path:', url);
      return NextResponse.json({
        user: {
          id: userId || 'dev-admin-user',
          email: 'admin@example.com',
          role: 'admin'
        },
        session: {
          expires_at: Date.now() + 86400000 // 24 hours
        },
        auth: 'bypassed'
      });
    }
    
    // Check if we're in development mode with admin bypass
    if (process.env.NODE_ENV === 'development' && adminBypass) {
      console.log('[Auth Check] Admin bypass active in development mode');
      return NextResponse.json({
        user: {
          id: userId || 'dev-admin-user',
          email: 'admin@example.com',
          role: 'admin'
        },
        session: {
          expires_at: Date.now() + 86400000 // 24 hours
        },
        auth: 'bypassed'
      });
    }
    
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Auth Check] Error getting session:', error);
      return NextResponse.json(
        { error: 'Authentication error', details: error.message },
        { status: 401 }
      );
    }
    
    if (!session) {
      console.log('[Auth Check] No session found');
      // Check for token in authorization header
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        try {
          // Verify token
          const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
          
          if (tokenError || !user) {
            return NextResponse.json(
              { error: 'Invalid token', details: tokenError?.message || 'No user found' },
              { status: 401 }
            );
          }
          
          return NextResponse.json({ user, auth: 'token' });
        } catch (tokenError) {
          console.error('[Auth Check] Token verification error:', tokenError);
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // At this point we have a valid session
    console.log('[Auth Check] Valid session found for user:', session.user.id);
    return NextResponse.json({
      user: session.user,
      session: {
        expires_at: session.expires_at
      },
      auth: 'session'
    });
  } catch (error: any) {
    console.error('[Auth Check] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed', details: error.message },
      { status: 500 }
    );
  }
} 