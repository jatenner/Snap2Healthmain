import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Add export config to bypass middleware for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Simple ping endpoint to check if the API is running
 * No authentication required
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    bypassHeader: request.headers.get('x-dev-bypass') === 'true'
  });
}

/**
 * Health check endpoint for external services
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
} 