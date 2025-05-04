import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
      
      // Redirect to the requested page after successful authentication
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, requestUrl.origin)
      );
    }
  }

  // If no code is present, redirect to the login page
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get the request body
  const requestBody = await request.json();
  const { action, email, password, userData } = requestBody;

  try {
    // Handle different auth actions
    switch (action) {
      case 'signin':
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signinError) {
          return NextResponse.json({ error: signinError.message }, { status: 400 });
        }

        return NextResponse.json(
          { user: signinData.user, session: signinData.session },
          { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );

      case 'signup':
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData || {},
          },
        });

        if (signupError) {
          return NextResponse.json({ error: signupError.message }, { status: 400 });
        }

        // Create initial profile entry
        if (signupData.user) {
          await supabase.from('profiles').upsert({
            id: signupData.user.id,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...userData
          });
        }

        return NextResponse.json(
          { user: signupData.user, session: signupData.session },
          { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );

      case 'signout':
        await supabase.auth.signOut();
        return NextResponse.json(
          { success: true },
          { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 