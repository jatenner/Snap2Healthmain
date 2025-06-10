import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Auto-confirm new users endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🚀 Auto-confirm signup for:', email);

    // Step 1: Create user with admin privileges (bypasses email confirmation)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This automatically confirms the email
      user_metadata: {
        name: name || '',
        full_name: name || ''
      }
    });

    if (createError) {
      console.error('❌ Failed to create user:', createError);
      
      // If user already exists, try to confirm them instead
      if (createError.message.includes('already registered')) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);
        
        if (existingUser && !existingUser.email_confirmed_at) {
          const { data: confirmedUser, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { email_confirm: true }
          );
          
          if (confirmError) {
            return NextResponse.json({ 
              error: 'User exists but confirmation failed: ' + confirmError.message 
            }, { status: 400 });
          }
          
          return NextResponse.json({
            success: true,
            message: 'Existing user confirmed successfully',
            user: confirmedUser.user,
            action: 'confirmed_existing'
          });
        }
        
        return NextResponse.json({ 
          error: 'User already exists and is confirmed. Try signing in instead.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: createError.message 
      }, { status: 400 });
    }

    console.log('✅ User created and auto-confirmed:', newUser.user?.email);

    return NextResponse.json({
      success: true,
      message: 'User created and automatically confirmed!',
      user: newUser.user,
      action: 'created_and_confirmed'
    });

  } catch (error) {
    console.error('❌ Auto-confirm error:', error);
    return NextResponse.json({ 
      error: 'Failed to create and confirm user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Endpoint to manually confirm an existing user
export async function PATCH(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the user
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    if (user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: 'User is already confirmed',
        user
      });
    }

    // Confirm the user
    const { data: confirmedUser, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      return NextResponse.json({ 
        error: 'Failed to confirm user: ' + confirmError.message 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'User confirmed successfully',
      user: confirmedUser.user
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to confirm user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 