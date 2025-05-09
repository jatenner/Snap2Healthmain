import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // Create a response object that will be modified with the session
  const res = NextResponse.next();
  
  // Check if auth bypass is enabled
  const authBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
  
  // If auth bypass is enabled and not in production, skip auth check
  if (authBypass && process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
    console.log('Auth bypass enabled, skipping auth check');
    return res;
  }
  
  // Explicitly set Supabase URL and key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in middleware');
    return NextResponse.redirect(new URL('/error', req.url));
  }
  
  try {
    // Create the Supabase client with the request and response
    const supabase = createMiddlewareClient({ 
      req, 
      res,
    }, {
      supabaseUrl,
      supabaseKey,
    });
    
    // Get the user's session - this will set cookies in the response
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get the pathname from the URL
    const { pathname } = req.nextUrl;
    console.log(`Middleware processing route: ${pathname}, authenticated: ${!!session}`);

    // Check if the route should be protected
    const isProtectedRoute = pathname === '/' || 
                            pathname.startsWith('/dashboard') || 
                            pathname.startsWith('/profile') ||
                            pathname.startsWith('/meal-history') ||
                            pathname.startsWith('/upload') ||
                            pathname.startsWith('/meal-analysis');

    // Auth routes that should redirect to home page if already authenticated
    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    
    // If the route is protected and there's no session, redirect to login
    if (isProtectedRoute && !session) {
      console.log(`Protected route ${pathname} - no auth, redirecting to login`);
      // Store the URL they were trying to access for later redirect
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // If trying to access an auth route with a valid session, redirect to home page
    if (isAuthRoute && session) {
      console.log(`Auth route ${pathname} with valid session, redirecting to home page`);
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    // All other routes proceed normally with cookies properly set
    console.log(`Proceeding with route: ${pathname}`);
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

// Run middleware on all routes, including the root path
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/profile/:path*',
    '/meal-history/:path*',
    '/upload/:path*',
    '/meal-analysis/:path*',
    '/login',
    '/signup',
  ],
}; 