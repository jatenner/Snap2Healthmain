import { NextRequest, NextResponse } from 'next/server';

// This is a guide for disabling email confirmation in your Supabase dashboard
export async function GET() {
  const instructions = {
    message: "Email Rate Limit Fix Instructions",
    steps: [
      "1. Go to your Supabase dashboard: https://supabase.com/dashboard",
      "2. Select your project",
      "3. Go to Authentication > Settings",
      "4. Under 'User Signups', toggle OFF 'Enable email confirmations'",
      "5. This will allow users to sign up without email verification",
      "6. Users can sign in immediately after signup",
      "7. Re-enable when your email limits reset (usually 24 hours)"
    ],
    alternative: "Or upgrade your Supabase plan to increase email limits",
    currentLimits: {
      free: "30 emails per hour",
      pro: "100 emails per hour", 
      team: "300 emails per hour"
    }
  };

  return NextResponse.json(instructions);
} 