import { NextResponse } from 'next/server';

export async function GET() {
  // Generate a unique version identifier based on build timestamp or current time
  const version = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString();
  
  // Return the version with no caching headers
  return NextResponse.json(
    { 
      version,
      timestamp: Date.now()
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
} 