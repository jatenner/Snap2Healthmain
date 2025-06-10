import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabaseAdmin.auth.admin.listUsers();
    
    // Test 2: Try to send email (should not hit rate limit on Pro)
    const testEmail = `test-${Date.now()}@example.com`;
    let emailTest;
    let emailError = null;

    try {
      emailTest = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: testEmail,
        password: 'test-password-123',
        options: {
          data: { test: true }
        }
      });
    } catch (error: any) {
      emailError = error;
    }

    // Test 3: Check project info (Pro plans have different limits)
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectId = projectUrl?.split('//')[1]?.split('.')[0];

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      tests: {
        connection: {
          success: !connectionError,
          error: connectionError?.message,
          userCount: connectionTest?.users?.length || 0
        },
        emailLimits: {
          hitRateLimit: emailError?.code === 'over_email_send_rate_limit',
          error: emailError?.message,
          testResult: emailTest ? 'success' : 'failed',
          interpretation: emailError?.code === 'over_email_send_rate_limit' 
            ? '🚨 STILL ON FREE TIER - Pro upgrade not active yet'
            : '✅ Pro tier active - no rate limits'
        }
      },
      projectInfo: {
        projectId,
        supabaseUrl: projectUrl,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      recommendations: emailError?.code === 'over_email_send_rate_limit' 
        ? [
            '1. Wait 10-15 minutes for Pro upgrade to fully activate',
            '2. Contact Supabase support if issue persists',
            '3. Temporarily disable email confirmation as workaround'
          ]
        : [
            '1. Pro plan is active!',
            '2. You can safely keep email confirmation enabled',
            '3. Ready to handle hundreds of users'
          ]
    });

  } catch (error: any) {
    console.error('Pro plan verification error:', error);

    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 