import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // This requires service role key with admin privileges
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

    // NOTE: updateAuthConfig method doesn't exist in current Supabase client
    // This must be done manually in the Supabase Dashboard
    /*
    const { data, error } = await supabaseAdmin.auth.admin.updateAuthConfig({
      DISABLE_SIGNUP: false,
      ENABLE_EMAIL_CONFIRMATIONS: false, // This is the key setting
      ENABLE_PHONE_CONFIRMATIONS: false,
      EMAIL_CONFIRM_CHANGE_ENABLED: false
    });

    if (error) {
      console.error('❌ Failed to disable email confirmations:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        suggestion: "Try disabling email confirmations manually in Supabase Dashboard > Project Settings > Authentication"
      }, { status: 400 });
    }
    */

    console.log('ℹ️ Email confirmations must be disabled manually in Supabase Dashboard');
    
    return NextResponse.json({ 
      success: false, 
      message: "Email confirmations must be disabled manually in Supabase Dashboard. The updateAuthConfig API method is not available.",
      manualSteps: [
        "Go to Supabase Dashboard",
        "Navigate to Project Settings (gear icon)",
        "Find Authentication section", 
        "Disable 'Enable email confirmations'",
        "This will allow users to sign in without email confirmation"
      ],
      alternativeRecommendation: "Use the auto-confirm API endpoint at /api/auth/auto-confirm for new user signups"
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update auth configuration',
      manualSteps: [
        "Go to Supabase Dashboard",
        "Navigate to Project Settings (gear icon)",
        "Find Authentication section", 
        "Disable 'Enable email confirmations'"
      ]
    }, { status: 500 });
  }
} 