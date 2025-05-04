/**
 * API Route Helper
 * Contains utilities to properly handle API routes in both development and production
 */

import { NextRequest, NextResponse } from 'next/server';

// This tells Next.js that routes using this helper should be dynamic
export const dynamic = 'force-dynamic';

/**
 * Use this function to ensure API routes can use dynamic features like cookies
 * without breaking static generation during build
 */
export function createDynamicResponse(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  // Wrap the handler to include cache control headers
  return async function(req: NextRequest) {
    try {
      // Call the original handler
      const response = await handler(req);
      
      // Add cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Skip-Static-Generation', 'true');
      
      // Add a timestamp to help with cache busting
      response.headers.set('X-Response-Time', new Date().toISOString());
      
      return response;
    } catch (error) {
      console.error('API route error:', error);
      
      // Return an error response with no-cache headers
      return new NextResponse(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Skip-Static-Generation': 'true'
          }
        }
      );
    }
  };
}

/**
 * Helper function to create standardized API responses
 */
export function apiResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Skip-Static-Generation': 'true'
    }
  });
}