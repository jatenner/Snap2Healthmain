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

    // Update auth config to disable email confirmations
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

    console.log('✅ Email confirmations disabled successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: "Email confirmations have been DISABLED! Users can now sign in without confirming their email.",
      data,
      nextSteps: [
        "Test user sign up and sign in",
        "Existing users who couldn't sign in should now be able to",
        "No more email confirmation required"
      ]
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