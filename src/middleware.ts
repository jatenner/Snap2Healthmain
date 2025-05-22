import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
<<<<<<< HEAD
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/history',
  '/meal-analysis',
  '/meal/',
  '/analyze',
  '/upload'
];

// Routes that are only accessible to non-authenticated users
const AUTH_ROUTES = [
  '/login',
  '/signup',
];

// Public paths that don't require authentication check
const PUBLIC_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/images',
  '/uploads',
  '/logo.svg',
  '/camera-icon.svg', 
  '/auth-reset.html',
  '/clear-cache.html',
  '/reset.html',
  '/dev-debug',
  '/sw.js'
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Get the path from the URL
  const path = req.nextUrl.pathname;
  
  // Skip middleware check for public paths
  if (PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))) {
    // Still add cache control headers
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  }
  
  // Check if we're using local auth
  const useLocalAuth = req.cookies.get('use-local-auth')?.value === 'true';
  const localAuthUser = req.cookies.get('local-auth-user')?.value;
  
  // If using local auth, handle that first
  if (useLocalAuth && localAuthUser) {
    // For auth routes, redirect to dashboard
    if (AUTH_ROUTES.some(route => path.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // For protected routes, allow access
    if (PROTECTED_ROUTES.some(route => path.startsWith(route))) {
      // Add cache control headers
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      return NextResponse.next({
        request: {
          headers: req.headers,
        },
        headers,
      });
    }
    
    return res;
  }
  
  // Create a Supabase client
  const supabase = createMiddlewareClient({ req, res });

  // Check if we're using auth bypass for development
  const bypassAuth = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
  if (bypassAuth) {
    // Add proper cache control headers
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  }

  // Refresh session if it exists
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => path.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => path.startsWith(route));

  // Handle protected routes (redirect to login if not authenticated)
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle auth routes (redirect to dashboard if already authenticated)
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Add cache-busting headers for authenticated routes
  if (session) {
    const headers = new Headers(res.headers);
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Return the response with the cache headers
    return NextResponse.next({
      request: {
        headers: req.headers,
      },
      headers,
    });
  }

  // Add proper cache control headers to everything
  res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  
  // Add version header for debugging
  res.headers.set('X-Version', Date.now().toString());
  
  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all routes except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/:path*',
=======
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // TEMPORARY: Bypass all authentication checks to allow testing without database
  console.log("TEMP FIX: Bypassing all authentication checks");
  return NextResponse.next();
  
  // Original middleware code below - commented out temporarily
  /*
  // Create a response object that will be modified with the session
  const res = NextResponse.next();
  
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
    const isProtectedRoute = pathname.startsWith('/dashboard') || 
                            pathname.startsWith('/profile') ||
                            pathname.startsWith('/meal-history') ||
                            pathname.startsWith('/upload') ||
                            pathname.startsWith('/meal-analysis');

    // Auth routes that should redirect to upload page if already authenticated
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
    
    // If trying to access an auth route with a valid session, redirect to upload page
    if (isAuthRoute && session) {
      console.log(`Auth route ${pathname} with valid session, redirecting to upload page`);
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/upload';
      return NextResponse.redirect(redirectUrl);
    }

    // All other routes proceed normally with cookies properly set
    console.log(`Proceeding with route: ${pathname}`);
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
  */
}

// Only run middleware on specific routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/meal-history/:path*',
    '/upload/:path*',
    '/meal-analysis/:path*',
    '/login',
    '/signup',
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
  ],
}; 