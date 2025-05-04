import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      AUTH_BYPASS: process.env.NEXT_PUBLIC_AUTH_BYPASS,
      MOCK_AUTH: process.env.NEXT_PUBLIC_MOCK_AUTH,
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    }
  });
} 