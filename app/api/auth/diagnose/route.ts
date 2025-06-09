import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Diagnostic endpoint to check user authentication status
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for diagnosis' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with admin privileges for user lookup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed for admin operations
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Create regular client for auth testing
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create admin client if service key is available
    const adminClient = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    const diagnosis: any = {
      email,
      timestamp: new Date().toISOString(),
      tests: {
        userExists: false,
        emailConfirmed: false,
        canSignIn: false,
        accountLocked: false,
        lastSignIn: null,
        errorDetails: null
      }
    };

    // Test 1: Check if user exists in auth.users table (requires admin client)
    if (adminClient) {
      try {
        const { data: adminUsers, error: adminError } = await adminClient.auth.admin.listUsers();
        
        if (!adminError && adminUsers.users) {
          const userRecord = adminUsers.users.find(u => u.email === email);
          
          if (userRecord) {
            diagnosis.tests.userExists = true;
            diagnosis.tests.emailConfirmed = !!userRecord.email_confirmed_at;
            diagnosis.tests.lastSignIn = userRecord.last_sign_in_at;
            
            // Check if account is disabled/locked - removing banned_until as it doesn't exist on User type
            diagnosis.tests.accountLocked = false; // Note: banned_until not available on User type
            
            // Store additional metadata
            diagnosis.userMetadata = {
              id: userRecord.id,
              createdAt: userRecord.created_at,
              emailConfirmedAt: userRecord.email_confirmed_at,
              bannedUntil: null, // Note: banned_until not available on User type
              provider: userRecord.app_metadata?.provider || 'email'
            };
          }
        } else {
          diagnosis.adminError = adminError?.message || 'Could not access admin API';
        }
      } catch (adminErr: any) {
        diagnosis.adminError = `Admin check failed: ${adminErr.message}`;
      }
    } else {
      diagnosis.adminWarning = 'No service role key - limited diagnosis available';
    }

    // Test 2: Try a mock sign-in to see the exact error
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'fake-password-for-testing-only-123'
      });

      if (error) {
        diagnosis.tests.errorDetails = {
          message: error.message,
          status: error.status,
          name: error.name
        };

        // Analyze the error to determine the likely cause
        if (error.message.includes('Invalid login credentials')) {
          diagnosis.likelyCause = 'password_mismatch_or_unconfirmed_email';
          diagnosis.recommendation = 'User may need to verify email or password is incorrect';
        } else if (error.message.includes('Email not confirmed')) {
          diagnosis.likelyCause = 'email_not_confirmed';
          diagnosis.recommendation = 'User needs to check email and click verification link';
        } else if (error.message.includes('Too many requests')) {
          diagnosis.likelyCause = 'rate_limited';
          diagnosis.recommendation = 'User should wait before trying again';
        } else if (error.message.includes('User not found')) {
          diagnosis.likelyCause = 'user_not_found';
          diagnosis.recommendation = 'User may need to sign up first';
        } else {
          diagnosis.likelyCause = 'unknown_error';
          diagnosis.recommendation = 'Check Supabase logs for more details';
        }
      } else {
        // This shouldn't happen with a fake password, but if it does...
        diagnosis.tests.canSignIn = true;
        diagnosis.likelyCause = 'authentication_working';
        diagnosis.recommendation = 'Authentication appears to be working - check password';
      }
    } catch (signInErr: any) {
      diagnosis.tests.errorDetails = {
        message: signInErr.message,
        type: 'unexpected_error'
      };
      diagnosis.likelyCause = 'system_error';
      diagnosis.recommendation = 'Check Supabase configuration and connectivity';
    }

    // Test 3: Check Supabase auth settings
    diagnosis.authSettings = {
      signUpEnabled: 'Check Supabase dashboard: Authentication > Settings',
      emailConfirmationRequired: 'Check if "Enable email confirmations" is ON',
      passwordMinLength: 'Check password requirements in Auth settings',
      rateLimiting: 'Check if rate limiting is affecting sign-ins'
    };

    // Provide actionable solutions
    diagnosis.solutions = {
      forUser: [
        'Check email for verification link if email confirmation is required',
        'Ensure password meets minimum requirements (usually 6+ characters)',
        'Try password reset if unsure about password',
        'Wait a few minutes if rate limited',
        'Contact support if issue persists'
      ],
      forAdmin: [
        'Check Supabase Authentication settings',
        'Verify email confirmation requirements',
        'Check if user exists in auth.users table',
        'Review rate limiting settings',
        'Check Supabase logs for detailed error information'
      ]
    };

    return NextResponse.json({
      success: true,
      diagnosis
    });

  } catch (error: any) {
    console.error('Auth diagnosis error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Diagnosis failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 