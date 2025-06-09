import { NextRequest, NextResponse } from 'next/server';

// This is a guide for disabling email confirmation in your Supabase dashboard
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Email Confirmation Disable Guide",
    steps: [
      {
        step: 1,
        action: "Go to your Supabase Dashboard",
        url: "https://supabase.com/dashboard"
      },
      {
        step: 2,
        action: "Select your project",
        detail: "Choose the Snap2Health project"
      },
      {
        step: 3,
        action: "Navigate to Authentication → Settings",
        path: "Authentication > Settings"
      },
      {
        step: 4,
        action: "Find 'Enable email confirmations'",
        detail: "This should be under 'User confirmation settings'"
      },
      {
        step: 5,
        action: "Turn OFF 'Enable email confirmations'",
        warning: "This will allow users to sign in immediately after sign up"
      },
      {
        step: 6,
        action: "Save the changes",
        result: "Users will no longer need to confirm emails before signing in"
      }
    ],
    currentIssue: {
      problem: "Users can sign up but can't sign in",
      cause: "Email confirmation is required but users aren't confirming emails",
      solution: "Disable email confirmation for immediate sign-in access"
    },
    benefits: [
      "✅ Users can sign in immediately after signup",
      "✅ No email delivery issues",
      "✅ No rate limiting problems", 
      "✅ Smoother user experience",
      "✅ Fixes the 'invalid login credentials' error"
    ],
    considerations: [
      "⚠️ Users can sign up with invalid emails",
      "⚠️ No email verification for password resets",
      "⚠️ Consider adding email verification later if needed"
    ],
    alternativeApproach: {
      option: "Email confirmation optional",
      description: "Keep confirmation enabled but allow unconfirmed users to sign in",
      setting: "Look for 'Allow unconfirmed users to sign in' option"
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === "check-status") {
      // This would check current email confirmation status
      // But we can't change Supabase settings via API - must be done in dashboard
      
      return NextResponse.json({
        message: "Email confirmation settings must be changed in Supabase Dashboard",
        dashboardUrl: "https://supabase.com/dashboard",
        currentStatus: "Cannot be checked via API - check dashboard",
        instructions: "Go to Authentication > Settings > Enable email confirmations"
      });
    }
    
    return NextResponse.json({
      error: "Invalid action",
      validActions: ["check-status"]
    }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({
      error: "Request failed",
      details: error.message
    }, { status: 500 });
  }
} 