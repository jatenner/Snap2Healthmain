import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current user's session
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const profileData = await request.json();
    const userId = session.user.id;

    // Basic validation
    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Add timestamp and user ID
    const dataWithTimestamp = {
      ...profileData,
      id: userId,
      updated_at: new Date().toISOString()
    };

    // Update profile in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .upsert(dataWithTimestamp, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      
      // Special handling for profile table not existing
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Profile table does not exist in the database', code: 'TABLE_NOT_FOUND' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error updating profile:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get profile from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Handle "not found" specially
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          profile: null,
          message: 'Profile not found'
        });
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: data,
      userId: userId
    });
  } catch (error: any) {
    console.error('Unexpected error getting profile:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 