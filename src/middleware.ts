import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
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
  ],
}; 