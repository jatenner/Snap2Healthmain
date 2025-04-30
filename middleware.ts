import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = ['/login', '/signup', '/_next', '/api', '/favicon.ico', '/images', '/uploads'];

export function middleware(request: NextRequest) {
  // Check if auth bypass is enabled - read directly from ENV to avoid context errors
  if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
    console.log('Auth bypass enabled, skipping auth check');
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For testing, check for a mock cookie instead of supabase token
  const hasAuthCookie = 
    request.cookies.get('sb-access-token') || 
    request.cookies.get('mock-auth-token');
  
  // If no auth token and not on a public path, redirect to login
  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    
    // Add the requested URL as a parameter so we can redirect after login
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 