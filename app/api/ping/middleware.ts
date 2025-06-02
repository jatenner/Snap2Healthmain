// Special middleware bypass for the ping route
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('[Ping Middleware] Bypassing auth for ping endpoint');
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/ping'],
}; 