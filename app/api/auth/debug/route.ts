import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// API route to check authentication status and reset sessions if needed
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || 'Unknown'
      } : null,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 