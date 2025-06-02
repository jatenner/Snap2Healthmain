import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Attempt to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing auth session:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
    
    if (data?.session) {
      return NextResponse.json({
        success: true,
        userId: data.session.user.id,
        email: data.session.user.email,
        expires: new Date(data.session.expires_at * 1000).toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No session data returned'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Exception in auth refresh:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error during refresh'
    }, { status: 500 });
  }
} 