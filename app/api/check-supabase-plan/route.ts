import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test email send to check rate limits
    const testResult = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: 'test-rate-limit@example.com',
      password: 'test-password-123',
      options: {
        data: { test: true }
      }
    });

    return NextResponse.json({
      status: 'success',
      message: 'Pro plan appears to be active - no rate limit hit',
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      testResult: testResult.error ? 'error' : 'success'
    });

  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.code === 'over_email_send_rate_limit';
    
    return NextResponse.json({
      status: isRateLimit ? 'rate_limited' : 'error',
      message: isRateLimit 
        ? 'Still on FREE tier limits - Pro upgrade not active yet'
        : 'Other error occurred',
      error: error?.message || 'Unknown error',
      errorCode: error?.code,
      errorStatus: error?.status,
      timestamp: new Date().toISOString(),
      recommendation: isRateLimit 
        ? 'Disable email confirmation OR wait for Pro upgrade to take effect'
        : 'Check your Supabase configuration'
    });
  }
} 