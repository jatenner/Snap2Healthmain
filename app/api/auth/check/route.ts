import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic route
export const dynamic = 'force-dynamic';

// Auth check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return NextResponse.json({ authenticated: false, error: error.message });
    }
    
    return NextResponse.json({ 
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name
      } : null
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 