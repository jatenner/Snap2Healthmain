import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Get the user's profile data
 */
export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // First, retrieve user metadata from auth
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user data:', userError);
      return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
    }
    
    // Then check for separate profile data from the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // Not found error is ok
      console.error('Error getting profile data:', profileError);
    }
    
    // Combine user metadata and profile data
    const userMetadata = userData.user.user_metadata || {};
    const profile = profileData || {};
    
    // Default profile values
    const defaultProfileValues = {
      age: 35,
      gender: 'prefer-not-to-say',
      height: null,
      weight: 70,
      dietaryPreferences: null,
      healthGoals: 'General Wellness',
      activityLevel: 'Moderate',
    };
    
    // Combine all data sources with defaults
    const combinedProfile = {
      ...defaultProfileValues,
      ...profile,
      ...userMetadata,
      id: userId,
      email: userData.user.email,
    };
    
    return NextResponse.json({ profile: combinedProfile });
    
  } catch (error) {
    console.error('Error in profile GET route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Update the user's profile data
 */
export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the profile data from the request
    const profileData = await request.json();
    
    // Ensure we have valid data
    if (!profileData) {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
    }
    
    // Update user metadata in auth
    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: {
        age: profileData.age,
        gender: profileData.gender,
        height: profileData.height,
        weight: profileData.weight,
        dietaryPreferences: profileData.dietaryPreferences,
        healthGoals: profileData.healthGoals || 'General Wellness',
        activityLevel: profileData.activityLevel || 'Moderate',
      }
    });
    
    if (userUpdateError) {
      console.error('Error updating user metadata:', userUpdateError);
      return NextResponse.json({ error: 'Failed to update user metadata' }, { status: 500 });
    }
    
    // Also update the profiles table
    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        updated_at: new Date().toISOString(),
        age: profileData.age ? Number(profileData.age) : null,
        gender: profileData.gender,
        height: profileData.height ? String(profileData.height) : null,
        weight: profileData.weight ? Number(profileData.weight) : null,
        health_goal: profileData.healthGoals || 'General Wellness',
      });
    
    if (profileUpsertError) {
      console.error('Error upserting profile data:', profileUpsertError);
      // Continue anyway since we updated the user metadata successfully
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
    
  } catch (error) {
    console.error('Error in profile POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 