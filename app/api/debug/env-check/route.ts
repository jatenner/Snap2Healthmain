import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      openai_key_exists: !!process.env.OPENAI_API_KEY,
      openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
      openai_key_prefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'none',
      supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_service_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      node_env: process.env.NODE_ENV,
      railway_env: process.env.RAILWAY_ENVIRONMENT,
      timestamp: new Date().toISOString()
    };
    
    console.log('[env-check] Environment status:', envCheck);
    
    return NextResponse.json(envCheck);
  } catch (error: any) {
    console.error('[env-check] Error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 