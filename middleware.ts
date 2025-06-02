import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Define public routes that don't require authentication
const publicRoutes = [
  // Public pages
  '/login',
  '/signup',
  '/',
  
  // Public API endpoints
  '/api/ping',
  '/api/health',
  '/api/public/status',
  '/api/auth/check'
  // Removed analyze-meal, analyze-image and meals from public routes to enforce authentication
];

// Define API routes that should always accept requests but attach auth if available
const apiRoutesAllowUnauthenticated = [
  '/api/auth/'
];

// Redirect to login if authentication is required
async function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Use the app directory login page, not the pages directory login
  url.pathname = '/login';
  
  // Store the current URL in a query parameter for redirection after login
  url.searchParams.set('from', req.nextUrl.pathname);
  
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Check if the path is a public route
  const path = req.nextUrl.pathname;
  
  // Always allow requests to public routes without auth
  if (publicRoutes.some(route => path.startsWith(route))) {
    console.log(`[Middleware] Public route accessed: ${path}`);
    return res;
  }
  
  // API routes that should accept requests but attach auth if available
  if (apiRoutesAllowUnauthenticated.some(route => path.startsWith(route))) {
    console.log(`[Middleware] API route allowed without auth: ${path}`);
    return res;
  }
  
  // For all other routes, check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is authenticated, allow access
  if (session?.user) {
    console.log(`[Middleware] Authenticated user accessing ${path}: ${session.user.id}`);
    return res;
  }
  
  // For API routes, return 401 instead of redirecting
  if (path.startsWith('/api/')) {
    console.log(`[Middleware] Unauthenticated API request to ${path}, returning 401`);
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required' }, 
      { status: 401 }
    );
  }
  
  // For all other routes, redirect to login
  console.log(`[Middleware] Redirecting unauthenticated user from ${path} to login`);
  return redirectToLogin(req);
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|assets/).*)',
  ],
}; 