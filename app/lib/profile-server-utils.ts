import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UserProfile } from './profile-utils';

/**
 * Fetches complete user profile from database or user metadata
 * This function can only be used in server components or API routes
 */
export async function getFullUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // First try to get user data from auth
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[getFullUserProfile] Error getting user:', userError);
      return null;
    }
    
    if (!userData.user) {
      console.error('[getFullUserProfile] No user found');
      return null;
    }
    
    // Try to get profile from user metadata first
    const userMetadata = userData.user.user_metadata || {};
    
    if (userMetadata && Object.keys(userMetadata).length > 0) {
      console.log('[getFullUserProfile] Using user metadata for profile');
      return {
        id: userId,
        name: userMetadata.full_name || userMetadata.name || userData.user.email,
        email: userData.user.email,
        goal: userMetadata.goal || userMetadata.defaultGoal,
        age: userMetadata.age,
        gender: userMetadata.gender,
        weight: userMetadata.weight,
        height: userMetadata.height,
        activityLevel: userMetadata.activityLevel || userMetadata.activity_level,
        weight_unit: userMetadata.weight_unit || 'lb',
        height_unit: userMetadata.height_unit || 'in'
      };
    }
    
    // If no metadata, try to get from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[getFullUserProfile] Error fetching profile:', profileError);
    }
    
    if (profileData) {
      console.log('[getFullUserProfile] Using database profile');
      return {
        id: userId,
        name: profileData.full_name || userData.user.email,
        email: userData.user.email,
        goal: profileData.goal,
        age: profileData.age,
        gender: profileData.gender,
        weight: profileData.weight,
        height: profileData.height,
        activityLevel: profileData.activity_level,
        weight_unit: profileData.weight_unit || 'lb',
        height_unit: profileData.height_unit || 'in'
      };
    }
    
    // Fallback to basic user info
    console.log('[getFullUserProfile] Using fallback basic profile');
    return {
      id: userId,
      name: userData.user.email,
      email: userData.user.email,
      goal: 'General Wellness',
      age: null,
      gender: null,
      weight: null,
      height: null,
      activityLevel: null
    };
    
  } catch (error) {
    console.error('[getFullUserProfile] Unexpected error:', error);
    return null;
  }
} 