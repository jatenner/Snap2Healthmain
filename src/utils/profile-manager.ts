'use client';

/**
 * Profile Manager Utility
 * Centralized profile management to ensure consistency across the app
 */

import { createBrowserClient } from '@supabase/ssr';
import * as clientAuth from './supabase/client-auth';

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Define the UserProfile interface for type safety
export interface UserProfile {
  id?: string;
  full_name?: string;
  age?: number;
  gender?: string;
  weight?: number;
  weight_unit?: string;
  height?: number;
  height_unit?: string;
  goal?: string;
  activity_level?: string;
}

// Extended profile with calculated values
export interface ExtendedUserProfile extends UserProfile {
  weightInKg?: number;
  heightInCm?: number;
  bmi?: number;
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
}

/**
 * Get missing fields from a profile
 * A field is considered missing if:
 * - It's undefined or null
 * - It's a numeric value <= 0
 * - It's a string that's empty or contains placeholders
 */
export function getMissingProfileFields(profile: UserProfile): string[] {
  if (!profile) return ['age', 'gender', 'weight', 'height', 'goal', 'activity_level'];
  
  const missingFields = [];
  
  // List of placeholder values that should be treated as missing
  const placeholders = [
    "Select Gender", "Choose Gender", "Gender", "Select", 
    "Select Goal", "Choose Goal", "Goal",
    "Select Activity Level", "Choose Activity Level", "Activity Level"
  ];
  
  // Only consider a field missing if it's undefined/null, empty string, or a placeholder value
  if (profile.age === undefined || profile.age === null || profile.age <= 0) {
    missingFields.push('age');
  }
  
  // Check gender
  if (!profile.gender || 
      profile.gender.trim() === '' || 
      placeholders.includes(profile.gender.trim())) {
    missingFields.push('gender');
  }
  
  // Check weight - must be a positive number
  if (profile.weight === undefined || profile.weight === null || profile.weight <= 0) {
    missingFields.push('weight');
  }
  
  // Check height - must be a positive number
  if (profile.height === undefined || profile.height === null || profile.height <= 0) {
    missingFields.push('height');
  }
  
  // Check goal
  if (!profile.goal || 
      profile.goal.trim() === '' || 
      placeholders.includes(profile.goal.trim())) {
    missingFields.push('goal');
  }
  
  // Check activity level
  if (!profile.activity_level || 
      profile.activity_level.trim() === '' || 
      placeholders.includes(profile.activity_level.trim())) {
    missingFields.push('activity_level');
  }
  
  return missingFields;
}

/**
 * Check if a profile is complete
 * A profile is complete when it has all required fields
 */
export function isProfileComplete(profile: UserProfile): boolean {
  if (!profile) return false;
  
  // Get missing fields
  const missingFields = getMissingProfileFields(profile);
  
  // A profile is complete only when ALL required fields are present
  return missingFields.length === 0;
}

/**
 * Get an effective profile with calculated fields
 * This consolidates profile data from all available sources
 * and ensures all required fields have valid values
 */
export function getEffectiveProfile(profile: UserProfile | null): ExtendedUserProfile | null {
  if (!profile) {
    // Try to get profile from localStorage as a fallback
    let localProfile = null;
    
    if (typeof window !== 'undefined') {
      try {
        const storedProfile = localStorage.getItem('profile_backup');
        if (storedProfile) {
          localProfile = JSON.parse(storedProfile);
          console.log('[getEffectiveProfile] Using profile data from localStorage');
        }
      } catch (e) {
        console.error('[getEffectiveProfile] Error reading profile from localStorage:', e);
      }
    }
    
    if (!localProfile) {
      return null;
    }
    
    // Use the localStorage profile
    profile = { ...localProfile } as UserProfile;
  }
  
  // Create a copy to avoid modifying the original profile
  const effectiveProfile = { ...profile } as ExtendedUserProfile;
  
  // Ensure we have valid values for all fields
  if (!effectiveProfile.gender) effectiveProfile.gender = 'Male';
  if (!effectiveProfile.age || effectiveProfile.age <= 0) effectiveProfile.age = 30;
  if (!effectiveProfile.height || effectiveProfile.height <= 0) effectiveProfile.height = 70;
  if (!effectiveProfile.height_unit) effectiveProfile.height_unit = 'in';
  if (!effectiveProfile.weight || effectiveProfile.weight <= 0) effectiveProfile.weight = 160;
  if (!effectiveProfile.weight_unit) effectiveProfile.weight_unit = 'lb';
  if (!effectiveProfile.goal) effectiveProfile.goal = 'General Health';
  if (!effectiveProfile.activity_level) effectiveProfile.activity_level = 'Moderate';
  
  // Convert weights and heights for calculations
  effectiveProfile.weightInKg = effectiveProfile.weight_unit === 'lb' 
    ? effectiveProfile.weight * 0.453592 
    : effectiveProfile.weight;
  
  effectiveProfile.heightInCm = effectiveProfile.height_unit === 'in' 
    ? effectiveProfile.height * 2.54 
    : effectiveProfile.height;
  
  // Calculate BMI
  effectiveProfile.bmi = effectiveProfile.weightInKg / Math.pow(effectiveProfile.heightInCm / 100, 2);
  
  // Estimate BMR using Mifflin-St Jeor Formula
  if (effectiveProfile.gender?.toLowerCase().includes('male')) {
    effectiveProfile.bmr = (10 * effectiveProfile.weightInKg) + 
                          (6.25 * effectiveProfile.heightInCm) - 
                          (5 * effectiveProfile.age) + 5;
  } else {
    effectiveProfile.bmr = (10 * effectiveProfile.weightInKg) + 
                          (6.25 * effectiveProfile.heightInCm) - 
                          (5 * effectiveProfile.age) - 161;
  }
  
  // Apply activity multiplier to get TDEE
  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55, 
    'active': 1.725,
    'very active': 1.9,
    'athlete': 2.1
  };
  
  let activityFactor = 1.55; // Default to moderate
  
  // Find the best matching activity level
  const activityLevelLower = effectiveProfile.activity_level?.toLowerCase() || '';
  for (const [level, multiplier] of Object.entries(activityMultipliers)) {
    if (activityLevelLower.includes(level.toLowerCase())) {
      activityFactor = multiplier;
      break;
    }
  }
  
  // Calculate TDEE
  effectiveProfile.tdee = Math.round(effectiveProfile.bmr * activityFactor);
  
  // Apply goal adjustment for target calories
  if (effectiveProfile.goal) {
    const goalLower = effectiveProfile.goal.toLowerCase();
    
    if (goalLower.includes('weight loss') || goalLower.includes('lose')) {
      // 20% deficit for weight loss
      effectiveProfile.targetCalories = Math.round(effectiveProfile.tdee * 0.8);
    } 
    else if (goalLower.includes('muscle') || goalLower.includes('strength') || goalLower.includes('gain')) {
      // 20% surplus for muscle gain
      effectiveProfile.targetCalories = Math.round(effectiveProfile.tdee * 1.2);
    }
    else if (goalLower.includes('longevity') || goalLower.includes('health')) {
      // Slight deficit for longevity based on research
      effectiveProfile.targetCalories = Math.round(effectiveProfile.tdee * 0.9);
    }
    else {
      // Maintenance for general health or unspecified goals
      effectiveProfile.targetCalories = effectiveProfile.tdee;
    }
  } else {
    effectiveProfile.targetCalories = effectiveProfile.tdee;
  }
  
  return effectiveProfile;
}

/**
 * Save a backup of the profile to localStorage
 */
export function saveProfileBackup(profile: UserProfile): void {
  if (!profile || typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('profile_backup', JSON.stringify(profile));
    console.log('[ProfileManager] Stored profile backup in localStorage');
  } catch (e) {
    console.error('[ProfileManager] Error storing profile backup:', e);
  }
}

/**
 * Get a user's profile data from Supabase
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  
  try {
    // Use our client-auth utility instead of creating a new Supabase client
    const { data: profile, error } = await clientAuth.getProfile(userId);
    
    if (error || !profile) {
      console.warn('Error fetching profile:', error?.message || 'No profile found');
      return null;
    }
    
    // Save a backup to localStorage
    if (typeof window !== 'undefined') {
      saveProfileBackup(profile);
    }
    
    return profile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
} 