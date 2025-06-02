/**
 * User Profile Utility
 * Manages user profile data with memory optimization
 */

import { createClient } from './supabase/server';

// Default profile if nothing is found
const DEFAULT_PROFILE = {
  gender: 'neutral',
  age: 35,
  weight: 160,
  height: 67,
  activityLevel: 'moderate',
  defaultGoal: 'General Wellness'
};

// Cache to reduce database calls
const profileCache = new Map();

/**
 * Get a user's profile data with memory-efficient approach
 */
export async function getUserProfile(userId: string | undefined) {
  // If no userId, return default profile
  if (!userId) {
    return DEFAULT_PROFILE;
  }
  
  // Check cache first
  if (profileCache.has(userId)) {
    return profileCache.get(userId);
  }
  
  try {
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      console.warn('Error fetching profile:', error?.message || 'No profile found');
      return DEFAULT_PROFILE;
    }
    
    // Fill in any missing values with defaults
    const completeProfile = {
      ...DEFAULT_PROFILE,
      ...profile
    };
    
    // Cache the profile (limit cache size to 50 entries)
    if (profileCache.size >= 50) {
      const firstKey = profileCache.keys().next().value;
      profileCache.delete(firstKey);
    }
    profileCache.set(userId, completeProfile);
    
    return completeProfile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return DEFAULT_PROFILE;
  }
}

/**
 * Clear the profile cache (useful for memory management)
 */
export function clearProfileCache() {
  profileCache.clear();
  console.log('Profile cache cleared');
}

/**
 * Get a user goal, with fallback to default goal
 */
export function getUserGoal(profile: any, specifiedGoal?: string): string {
  return specifiedGoal || profile?.defaultGoal || DEFAULT_PROFILE.defaultGoal;
} 