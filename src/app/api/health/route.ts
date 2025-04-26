import { NextResponse } from 'next/server';

export async function GET() {
  // Get environment variable status (safely checking existence)
  const envStatus = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    openaiKey: !!process.env.OPENAI_API_KEY,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || null,
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: envStatus,
  });
} 