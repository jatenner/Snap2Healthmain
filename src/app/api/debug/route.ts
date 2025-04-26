import { NextResponse } from 'next/server';

export async function GET() {
  // Check if required environment variables are available
  const envStatus = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Available' : 'Missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Available' : 'Missing',
    },
    openai: {
      key: process.env.OPENAI_API_KEY ? 'Available' : 'Missing',
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(envStatus);
} 