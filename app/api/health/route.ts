import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Alternative health check endpoint as a backup to /api/ping
 */
export async function GET() {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const referer = headersList.get('referer') || 'direct';
  
  try {
    // Check environment variables
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      openaiKey: !!process.env.OPENAI_API_KEY
    };
    
    // Check if all required env vars are present
    const allEnvVarsPresent = Object.values(envStatus).every(Boolean);
    
    return NextResponse.json({
      status: allEnvVarsPresent ? "ok" : "warning",
      message: allEnvVarsPresent ? "All systems operational" : "Missing some environment variables",
      timestamp: new Date().toISOString(),
      request: {
        userAgent,
        referer
      },
      env: envStatus
    });
  } catch (error) {
    console.error('[API/health] Error:', error);
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 