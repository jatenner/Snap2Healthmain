import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/simple-login',
  '/simple-signup',
  '/signup-fixed',
  '/',
  '/api/ping',
  '/api/health',
  '/api/system-status',
  '/api/auth',
  '/auth',
  '/favicon.ico',
  '/logo.svg',
];

function isPublicRoute(path: string): boolean {
  return publicRoutes.some(route => path === route || path.startsWith(route + '/'));
}

function isStaticAsset(path: string): boolean {
  return (
    path.startsWith('/_next/') ||
    path.startsWith('/images/') ||
    path.startsWith('/uploads/') ||
    path.startsWith('/static/') ||
    path.includes('.')
  );
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Always allow public routes and static assets
  if (isPublicRoute(path) || isStaticAsset(path)) {
    return NextResponse.next();
  }

  // Create a response to pass to the Supabase client (for cookie handling)
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh the session (this also validates it)
  const { data: { user } } = await supabase.auth.getUser();

  // If no user and this is a protected page (not API), redirect to login
  if (!user && !path.startsWith('/api/')) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }

  // For API routes without a user, let the route handler return 401
  // (this allows the route to provide a proper JSON error response)
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
