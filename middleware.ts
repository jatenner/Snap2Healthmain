import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  // Public pages
  '/login',
  '/signup',
  '/',
  
  // Public API endpoints
  '/api/ping',
  '/api/health',
  '/api/public',
  '/api/auth',
  
  // Static assets
  '/favicon.ico',
  '/logo.svg',
  '/_next',
  '/public'
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Always allow access to public routes
  if (publicRoutes.some(route => path.startsWith(route))) {
    console.log(`[Middleware] Public route accessed: ${path}`);
    return NextResponse.next();
  }
  
  // Always allow access to static files
  if (path.includes('_next/') || 
      path.includes('.') || 
      path.startsWith('/images/') ||
      path.startsWith('/uploads/') ||
      path.startsWith('/static/')) {
    return NextResponse.next();
  }
  
  // For development, be more permissive
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Development mode - allowing access to: ${path}`);
    return NextResponse.next();
  }
  
  // In production, you might want to add more sophisticated auth checking here
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 