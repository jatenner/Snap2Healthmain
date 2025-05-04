import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// API route to check authentication status and reset sessions if needed
export async function GET(req: NextRequest) {
  try {
    // Get the Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Get URL params
    const { searchParams } = new URL(req.url);
    const reset = searchParams.get('reset') === 'true';
    
    // If reset is true, sign out the user
    if (reset) {
      await supabase.auth.signOut();
      return NextResponse.json({ 
        status: 'success', 
        message: 'Session cleared successfully',
        wasAuthenticated: !!session
      });
    }
    
    // Return the debug info
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        lastSignIn: session.user.last_sign_in_at
      } : null,
      error: sessionError,
      cookiesPresent: {
        accessToken: !!cookieStore.get('sb-access-token'),
        refreshToken: !!cookieStore.get('sb-refresh-token')
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get authentication info' }, { status: 500 });
  }
} 