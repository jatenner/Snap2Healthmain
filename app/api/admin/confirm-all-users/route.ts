import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🔧 Starting manual user confirmation...');

    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const unconfirmedUsers = users.users.filter(user => 
      !user.email_confirmed_at && user.email
    );

    let successCount = 0;
    const results = [];

    for (const user of unconfirmedUsers) {
      try {
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true
          }
        );

        if (updateError) {
          results.push({ email: user.email, status: 'error', error: updateError.message });
        } else {
          results.push({ email: user.email, status: 'confirmed' });
          successCount++;
        }
      } catch (error) {
        results.push({ 
          email: user.email, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      message: 'User confirmation completed',
      summary: {
        total_found: unconfirmedUsers.length,
        successfully_confirmed: successCount,
        errors: unconfirmedUsers.length - successCount
      },
      results
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to confirm users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unconfirmed = users.users.filter(u => !u.email_confirmed_at);
    const confirmed = users.users.filter(u => u.email_confirmed_at);

    return NextResponse.json({
      total_users: users.users.length,
      confirmed_users: confirmed.length,
      unconfirmed_users: unconfirmed.length,
      unconfirmed_emails: unconfirmed.map(u => u.email)
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check user status'
    }, { status: 500 });
  }
} 