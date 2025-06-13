import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow this in development or for debugging
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 403 });
  }

  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyFormat: process.env.OPENAI_API_KEY ? 
      (process.env.OPENAI_API_KEY.startsWith('sk-') ? 'valid' : 'invalid') : 'missing',
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('OPENAI')
    ),
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(envCheck);
} 