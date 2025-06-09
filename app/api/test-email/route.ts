import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing email configuration...')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the email from request body
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log(`📧 Attempting to send test email to: ${email}`)

    // Try to sign up a test user (this will trigger an email)
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'temp_password_for_test_12345!',
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    if (error) {
      console.error('❌ Supabase auth error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Failed to send test email via Supabase'
      }, { status: 400 })
    }

    console.log('✅ Test email sent successfully!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent! Check your inbox for confirmation.',
      userCreated: !!data.user,
      emailSent: true
    })

  } catch (error: any) {
    console.error('❌ Test email error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
} 