import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';

/**
 * Get the user's profile data
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Update the user's profile data
 */
export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createClient();
    
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