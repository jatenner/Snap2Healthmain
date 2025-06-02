/**
 * Profile Utilities
 * 
 * This file contains utility functions for working with user profiles,
 * including retrieving, validating, and enhancing profile data for use
 * with nutritional analysis.
 */

// Import necessary dependencies
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    _effectiveProfile?: UserProfile;
  }
}

export interface UserProfile {
  id?: string;
  full_name?: string;
  age?: number;
  gender?: string;
  height?: number;
  height_unit?: 'cm' | 'in';
  weight?: number;
  weight_unit?: 'kg' | 'lb';
  activity_level?: string;
  goal?: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  health_conditions?: string[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  email?: string;
  [key: string]: any;
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

// Default profile values - used as fallbacks when user profile is incomplete
const DEFAULT_PROFILE = {
  gender: 'Female',
  age: 30,
  height: 165,
  height_unit: 'cm' as 'cm',
  weight: 65,
  weight_unit: 'kg' as 'kg',
  activity_level: 'Moderate',
  goal: 'General Health'
};

// Add FDA reference daily values map after the interfaces and before existing functions
// This map contains standard daily values for nutrients based on FDA guidelines
export const FDA_DAILY_VALUES: Record<string, { value: number; unit: string; isLimit?: boolean }> = {
  // Macronutrients
  'protein': { value: 50, unit: 'g' },
  'carbohydrates': { value: 275, unit: 'g' },
  'carbs': { value: 275, unit: 'g' },
  'total carbohydrate': { value: 275, unit: 'g' },
  'fat': { value: 78, unit: 'g' },
  'total fat': { value: 78, unit: 'g' },
  'saturated fat': { value: 20, unit: 'g', isLimit: true },
  'trans fat': { value: 0, unit: 'g', isLimit: true },
  'dietary fiber': { value: 28, unit: 'g' },
  'fiber': { value: 28, unit: 'g' },
  'soluble fiber': { value: 28, unit: 'g' },
  'insoluble fiber': { value: 28, unit: 'g' },
  'sugar': { value: 50, unit: 'g', isLimit: true },
  'total sugar': { value: 50, unit: 'g', isLimit: true },
  'added sugar': { value: 50, unit: 'g', isLimit: true },
  'cholesterol': { value: 300, unit: 'mg', isLimit: true },
  
  // Minerals
  'sodium': { value: 2300, unit: 'mg', isLimit: true },
  'potassium': { value: 4700, unit: 'mg' },
  'calcium': { value: 1300, unit: 'mg' },
  'iron': { value: 18, unit: 'mg' },
  'phosphorus': { value: 1250, unit: 'mg' },
  'magnesium': { value: 420, unit: 'mg' },
  'zinc': { value: 11, unit: 'mg' },
  'copper': { value: 0.9, unit: 'mg' },
  'manganese': { value: 2.3, unit: 'mg' },
  'selenium': { value: 55, unit: 'mcg' },
  'chromium': { value: 35, unit: 'mcg' },
  'molybdenum': { value: 45, unit: 'mcg' },
  'chloride': { value: 2300, unit: 'mg' },
  'iodine': { value: 150, unit: 'mcg' },
  
  // Vitamins
  'vitamin a': { value: 900, unit: 'mcg' },
  'vitamin c': { value: 90, unit: 'mg' },
  'vitamin d': { value: 20, unit: 'mcg' },
  'vitamin e': { value: 15, unit: 'mg' },
  'vitamin k': { value: 120, unit: 'mcg' },
  'thiamin': { value: 1.2, unit: 'mg' },
  'riboflavin': { value: 1.3, unit: 'mg' },
  'niacin': { value: 16, unit: 'mg' },
  'vitamin b6': { value: 1.7, unit: 'mg' },
  'folate': { value: 400, unit: 'mcg' },
  'folic acid': { value: 400, unit: 'mcg' },
  'vitamin b12': { value: 2.4, unit: 'mcg' },
  'biotin': { value: 30, unit: 'mcg' },
  'pantothenic acid': { value: 5, unit: 'mg' },
  'choline': { value: 550, unit: 'mg' },
  
  // Common aliases and variations
  'vit a': { value: 900, unit: 'mcg' },
  'vit c': { value: 90, unit: 'mg' },
  'vit d': { value: 20, unit: 'mcg' },
  'vit e': { value: 15, unit: 'mg' },
  'vit k': { value: 120, unit: 'mcg' },
  'vitamin b1': { value: 1.2, unit: 'mg' },
  'vitamin b2': { value: 1.3, unit: 'mg' },
  'vitamin b3': { value: 16, unit: 'mg' },
  'vit b6': { value: 1.7, unit: 'mg' },
  'vit b12': { value: 2.4, unit: 'mcg' },
  'panthothenic acid': { value: 5, unit: 'mg' },
};

/**
 * Check if a profile is complete - contains all required fields with valid values
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // List of required fields
  const requiredFields = ['age', 'gender', 'height', 'weight', 'activity_level'];
  
  // Check if all required fields exist and have valid values
  for (const field of requiredFields) {
    const value = profile[field];
    
    if (value === undefined || value === null || value === '') {
      return false;
    }
    
    // For numeric fields, ensure they are positive numbers
    if (field === 'age' || field === 'height' || field === 'weight') {
      if (typeof value !== 'number' || value <= 0) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Get an effective profile with calculated fields
 * This consolidates profile data and ensures all required fields have valid values
 */
export const getEffectiveProfile = async (
  initialProfileData?: UserProfile | null,
  supabaseInstance?: any // Explicitly allow passing a Supabase client instance
): Promise<ExtendedUserProfile> => {
  let supabase = supabaseInstance;
  let effectiveUserProfile: UserProfile | null = initialProfileData ? { ...initialProfileData } : null;

  // If no Supabase client instance is provided and we are on the client-side, create one.
  if (!supabase && typeof window !== 'undefined') {
    console.log('[getEffectiveProfile] Supabase client not explicitly passed, creating new one for client-side operation.');
    supabase = createClientComponentClient();
  }

  // Attempt to load from localStorage if no initial profile and on client side (as a quick cache)
  // This helps if Supabase calls are slow or fail, but DB/session is more authoritative.
  if (!effectiveUserProfile && typeof window !== 'undefined') {
    const localProfileStr = localStorage.getItem('user_profile');
    if (localProfileStr) {
      try {
        effectiveUserProfile = JSON.parse(localProfileStr);
        console.log('[getEffectiveProfile] Loaded profile from localStorage cache initially.');
      } catch (e) {
        console.warn('[getEffectiveProfile] Could not parse profile from localStorage', e);
      }
    }
  }
  
  // If we have a Supabase client, try to fetch/refresh the user's profile from the DB.
  // This is the most authoritative source if available.
  if (supabase) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[getEffectiveProfile] Error getting session:', sessionError.message);
      }

      if (session?.user) {
        console.log('[getEffectiveProfile] User session found, fetching profile from database for user:', session.user.id);
        const { data: dbProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found, which is not necessarily an "error" for this logic
          console.warn('[getEffectiveProfile] Error fetching profile from DB:', profileError.message);
        }
        
        if (dbProfile) {
          console.log('[getEffectiveProfile] Successfully fetched profile from DB:', dbProfile.id);
          effectiveUserProfile = dbProfile; // DB profile is the most authoritative
        } else if (!effectiveUserProfile) { 
          // No DB profile found, and no initial/local profile was sufficient,
          // so create a default profile associated with the authenticated user.
          console.log('[getEffectiveProfile] No DB profile found, creating default for session user.');
          effectiveUserProfile = {
            ...getDefaultProfile(), // getDefaultProfile should provide base default values
            id: session.user.id,    // Use session user's ID as the profile ID if creating new
            user_id: session.user.id,
            email: session.user.email,
          };
        } else {
          // Had an initial/local profile, but no DB profile, keep the initial/local one but ensure user_id is consistent
          if (effectiveUserProfile.user_id !== session.user.id) {
            console.warn('[getEffectiveProfile] Initial profile user_id mismatch with session user_id. Prioritizing session user.');
            effectiveUserProfile.user_id = session.user.id;
            effectiveUserProfile.id = session.user.id; // Align profile ID with user ID
          }
        }
      } else {
        console.log('[getEffectiveProfile] No active user session found via Supabase.');
        // If no session, we rely on initialProfileData or localStorage (already handled), or fallback to general default.
        // If effectiveUserProfile is still null here, it means no initial, no local, and no session.
      }
    } catch (e: any) {
      console.error('[getEffectiveProfile] Supabase operation failed:', e.message, e.stack);
      // If Supabase operations fail, we proceed with whatever profile (initial/local) we have, or default.
    }
  } else if (typeof window === 'undefined') {
    console.warn('[getEffectiveProfile] Executing in non-browser environment without a Supabase client provided. Profile data might be limited to initial input or defaults.');
  }

  // If profile is still null after all attempts (e.g., no session, no local storage, no initial data), use a general default.
  if (!effectiveUserProfile) {
    console.log('[getEffectiveProfile] No profile data resolved, using general default profile.');
    effectiveUserProfile = getDefaultProfile();
  }
  
  // --- Infer weight_unit if missing and weight seems like lbs ---
  if (effectiveUserProfile && effectiveUserProfile.weight && !effectiveUserProfile.weight_unit) {
    if (effectiveUserProfile.weight > 120) { // Common threshold to differentiate kg from lbs
      effectiveUserProfile.weight_unit = 'lb';
      console.log(`[getEffectiveProfile] Inferred weight_unit as 'lb' for weight: ${effectiveUserProfile.weight}`);
    } else {
      effectiveUserProfile.weight_unit = 'kg'; // Default to kg if not clearly lbs
      console.log(`[getEffectiveProfile] Defaulted weight_unit to 'kg' for weight: ${effectiveUserProfile.weight}`);
    }
  }

  // --- Infer height_unit if missing and height seems like inches ---
  if (effectiveUserProfile && effectiveUserProfile.height && !effectiveUserProfile.height_unit) {
    if (effectiveUserProfile.height > 40 && effectiveUserProfile.height < 96) { // Reasonable range for height in inches (e.g. > 3ft 4in, < 8ft)
      effectiveUserProfile.height_unit = 'in';
      console.log(`[getEffectiveProfile] Inferred height_unit as 'in' for height: ${effectiveUserProfile.height}`);
    } else {
      effectiveUserProfile.height_unit = 'cm'; // Default to cm
      console.log(`[getEffectiveProfile] Defaulted height_unit to 'cm' for height: ${effectiveUserProfile.height}`);
    }
  }
  // --- End Unit Inference ---

  // Enhance the resolved profile with calculated values, etc.
  const enhancedProfile = enhanceProfileWithDefaults(effectiveUserProfile);

  // Cache the final effective profile on window and localStorage (if client-side) for subsequent fast access
  if (typeof window !== 'undefined') {
    window._effectiveProfile = enhancedProfile; // For immediate in-memory cache
    try {
      localStorage.setItem('user_profile', JSON.stringify(enhancedProfile)); // For persistent cache
    } catch (e) {
      console.warn('[getEffectiveProfile] Could not save final profile to localStorage', e);
    }
  }

  return enhancedProfile;
};

// Add a synchronous version for immediate UI needs
export const getEffectiveProfileSync = () => {
  try {
    // Client-side only code
    if (typeof window !== 'undefined') {
      // Try to get from window cache first
      if (window._effectiveProfile && window._effectiveProfile.id) {
        return window._effectiveProfile;
      }
      
      // Check localStorage for cached profile
      const localProfile = localStorage.getItem('user_profile');
      if (localProfile) {
        try {
          const profileData = JSON.parse(localProfile);
          const enhancedProfile = enhanceProfileWithDefaults(profileData);
          window._effectiveProfile = enhancedProfile;
          return enhancedProfile;
        } catch (e) {
          console.log('Error parsing user_profile from localStorage', e);
        }
      }
      
      // Try several possible localStorage keys for resilience
      const localKeys = ['supabase.auth.token', 'cached_profile', 'effective_profile'];
      for (const key of localKeys) {
        const localData = localStorage.getItem(key);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (parsed && (parsed.id || parsed.user_id || (parsed.user && parsed.user.id))) {
              const profile = parsed.id ? parsed : 
                              parsed.user_id ? parsed : 
                              parsed.user ? { ...parsed.user, user_id: parsed.user.id } : 
                              null;
                              
              if (profile) {
                const enhancedProfile = enhanceProfileWithDefaults(profile);
                window._effectiveProfile = enhancedProfile;
                return enhancedProfile;
              }
            }
          } catch (e) {
            console.log(`Failed to parse localStorage key: ${key}`, e);
          }
        }
      }
    }
    
    // Fallback to default
    return getDefaultProfile();
  } catch (e) {
    console.error('Error in getEffectiveProfileSync:', e);
    return getDefaultProfile();
  }
};

// Get a default profile
export const getDefaultProfile = () => {
  return enhanceProfileWithDefaults({
    age: 35,
    gender: 'Male',
    height: 70, // inches
    height_unit: 'in',
    weight: 170, // pounds
    weight_unit: 'lb',
    activity_level: 'Moderate',
    goal: 'General Health'
  });
};

// Enhance a profile with defaults for any missing values
export const enhanceProfileWithDefaults = (profile: UserProfile | null): ExtendedUserProfile => {
  // Start with the global DEFAULT_PROFILE, then merge the provided profile if it exists
  const initialProfile = { ...DEFAULT_PROFILE, ...(profile || {}) };

  // Ensure core numeric fields from initialProfile are numbers, or use DEFAULT_PROFILE values directly.
  const age = typeof initialProfile.age === 'number' && initialProfile.age > 0 ? initialProfile.age : (DEFAULT_PROFILE.age as number);
  const gender = initialProfile.gender || (DEFAULT_PROFILE.gender as string);
  const activityLevel = initialProfile.activity_level || (DEFAULT_PROFILE.activity_level as string);
  const goal = initialProfile.goal || (DEFAULT_PROFILE.goal as string);

  let currentWeight = typeof initialProfile.weight === 'number' ? initialProfile.weight : (DEFAULT_PROFILE.weight as number);
  let currentHeight = typeof initialProfile.height === 'number' ? initialProfile.height : (DEFAULT_PROFILE.height as number);
  const weightUnit = initialProfile.weight_unit || (DEFAULT_PROFILE.weight_unit as 'kg' | 'lb');
  const heightUnit = initialProfile.height_unit || (DEFAULT_PROFILE.height_unit as 'cm' | 'in');

  const weightInKg: number = weightUnit === 'lb' ? currentWeight * 0.453592 : currentWeight;
  const heightInCm: number = heightUnit === 'in' ? currentHeight * 2.54 : currentHeight;

  let bmi: number | undefined;
  if (heightInCm > 0) { // Prevent division by zero
    bmi = weightInKg / ((heightInCm / 100) ** 2);
  }

  let bmr: number | undefined;
  if (gender.toLowerCase() === 'male') {
    bmr = 88.362 + (13.397 * weightInKg) + (4.799 * heightInCm) - (5.677 * age);
  } else { // Female or other
    bmr = 447.593 + (9.247 * weightInKg) + (3.098 * heightInCm) - (4.330 * age);
  }

  let tdee: number | undefined;
  if (bmr) {
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
      extra_active: 1.9, 
    };
    const multiplier = activityMultipliers[activityLevel.toLowerCase()] || 1.55;
    tdee = bmr * multiplier;
  }

  let targetCalories: number | undefined = tdee;
  if (tdee) {
    const goalLower = goal.toLowerCase();
    if (goalLower.includes('weight loss') || goalLower.includes('lose weight')) {
      targetCalories = tdee - 500;
    } else if (goalLower.includes('muscle gain') || goalLower.includes('gain muscle') || goalLower.includes('gain weight')) {
      targetCalories = tdee + 300;
    }
  }
  
  const finalProfile: ExtendedUserProfile = {
    ...initialProfile,
    age,
    gender,
    height: currentHeight,
    height_unit: heightUnit,
    weight: currentWeight,
    weight_unit: weightUnit,
    activity_level: activityLevel,
    goal,
    weightInKg,
    heightInCm,
    bmi,
    bmr,
    tdee,
    targetCalories,
  };

  return finalProfile;
};

/**
 * Get daily value percentages adjusted for a user's profile
 */
export function calculatePersonalizedDV(nutrient: any, profile: UserProfile | null): number {
  if (!profile || !nutrient || typeof nutrient.amount !== 'number') {
    return typeof nutrient.percentDailyValue === 'number' ? nutrient.percentDailyValue : 0;
  }
  
  // Use default values from DEFAULT_PROFILE if specific fields are missing
  const age = profile.age ?? DEFAULT_PROFILE.age;
  const gender = profile.gender ?? DEFAULT_PROFILE.gender;
  const weight = profile.weight ?? DEFAULT_PROFILE.weight;
  const weight_unit = profile.weight_unit ?? DEFAULT_PROFILE.weight_unit;
  const height = profile.height ?? DEFAULT_PROFILE.height;
  const height_unit = profile.height_unit ?? DEFAULT_PROFILE.height_unit;
  const activity_level = profile.activity_level ?? DEFAULT_PROFILE.activity_level;
  const goal = profile.goal ?? DEFAULT_PROFILE.goal;
  
  const nutrientName = nutrient.name.toLowerCase();
  const amount = nutrient.amount;
  
  // Convert weight to kg if needed
  const weightInKg = weight_unit === 'lb' ? weight / 2.20462 : weight;
  
  // Convert height to cm if needed
  const heightInCm = height_unit === 'in' ? height * 2.54 : height;
  
  // Get TDEE for calorie-based calculations
  const dailyCalories = calculateDailyCalories(profile);

  // RDA constants based on latest scientific guidelines
  let rda = 0;

  switch (nutrientName) {
    case 'protein':
      // Protein calculation based on weight and activity level
      let proteinRDAFactor = 0.8; // g per kg body weight (baseline RDA)
      
      if (activity_level) {
        const activity = activity_level.toLowerCase();
        if (activity.includes('very active') || activity.includes('athlete')) {
          proteinRDAFactor = 1.8; // Very active/athletes (1.6-2.2g/kg range)
        } else if (activity.includes('active')) {
          proteinRDAFactor = 1.4; // Active (1.2-1.7g/kg range)
        } else if (activity.includes('moderate')) {
          proteinRDAFactor = 1.2; // Moderately active
        }
      }
      
      if (goal) {
        const goalLower = goal.toLowerCase();
        if (goalLower.includes('muscle') || goalLower.includes('strength')) {
          proteinRDAFactor = Math.max(proteinRDAFactor, 1.8); // Muscle building goals (1.6-2.2g/kg)
        } else if (goalLower.includes('weight loss') || goalLower.includes('lose')) {
          proteinRDAFactor = Math.max(proteinRDAFactor, 1.6); // Weight loss goals (helps preserve muscle)
        }
      }
      
      rda = weightInKg * proteinRDAFactor;
      break;

    case 'carbohydrates':
    case 'carbs':
    case 'total carbohydrates':
      // Carbs based on total calories and activity level
      let carbPercentage = 0.5; // Default 50% of calories from carbs
      
      if (activity_level?.toLowerCase().includes('athlete') || 
          activity_level?.toLowerCase().includes('very active')) {
        carbPercentage = 0.6; // 60% for high activity
      }
      
      if (goal?.toLowerCase().includes('weight loss') ||
          goal?.toLowerCase().includes('lose')) {
        carbPercentage = 0.4; // 40% for weight loss
      }
      
      if (goal?.toLowerCase().includes('keto') ||
          goal?.toLowerCase().includes('low carb')) {
        carbPercentage = 0.1; // 10% for keto approach
      }
      
      const carbCalories = dailyCalories * carbPercentage;
      rda = carbCalories / 4; // 4 calories per gram of carbs
      break;

    case 'fat':
    case 'total fat':
      // Fat needs based on total calories and goals
      let fatPercentage = 0.3; // Default 30% of calories from fat
      
      if (goal?.toLowerCase().includes('keto') || goal?.toLowerCase().includes('low carb')) {
        fatPercentage = 0.7; // 70% for keto/low carb approaches
      } else if (goal?.toLowerCase().includes('heart health') || 
                goal?.toLowerCase().includes('cardiovascular')) {
        fatPercentage = 0.25; // 25% for heart-focused goals
      }
      
      const fatCalories = dailyCalories * fatPercentage;
      rda = fatCalories / 9; // 9 calories per gram of fat
      break;
      
    case 'fiber':
    case 'dietary fiber':
      // Fiber based on calories and gender
      rda = (dailyCalories / 1000) * 14; // 14g per 1000 calories
      rda = Math.max(rda, gender?.toLowerCase().includes('male') ? 38 : 25); // Minimum based on gender
      break;
      
    case 'vitamin a':
      rda = gender?.toLowerCase().includes('male') ? 900 : 700; // mcg RAE
      break;
      
    case 'vitamin c':
      rda = gender?.toLowerCase().includes('male') ? 90 : 75; // mg
      // Smokers need 35mg more
      break;
      
    case 'vitamin d':
      rda = 20; // mcg (800 IU) - higher than RDA of 15mcg for optimal benefits
      if (age && age > 70) rda = 25; // mcg, higher for older adults
      break;
      
    case 'calcium':
      if (age && age <= 18) rda = 1300;
      else if (age && age >= 51 && gender?.toLowerCase().includes('female')) rda = 1200;
      else if (age && age >= 71) rda = 1200;
      else rda = 1000; // mg
      break;
      
    case 'iron':
      if (gender?.toLowerCase().includes('female') && age && age <= 50) rda = 18;
      else rda = 8; // mg
      break;
      
    case 'magnesium':
      if (gender?.toLowerCase().includes('male')) {
        rda = age && age > 30 ? 420 : 400; // mg
      } else {
        rda = age && age > 30 ? 320 : 310; // mg
      }
      break;
      
    case 'potassium':
      rda = 4700; // mg
      break;
      
    case 'zinc':
      rda = gender?.toLowerCase().includes('male') ? 11 : 8; // mg
      break;
      
    case 'folate':
    case 'vitamin b9':
      rda = 400; // mcg DFE
      break;
      
    case 'vitamin b12':
      rda = 2.4; // mcg
      if (age && age > 50) rda = 2.6; // mcg, slightly higher for older adults
      break;
      
    case 'saturated fat':
      // Limit to <10% of daily calories
      rda = (dailyCalories * 0.1) / 9; // 9 calories per gram of fat
      break;
      
    case 'sodium':
      // Upper limit rather than target
      rda = 2300; // mg
      if (goal?.toLowerCase().includes('heart') || goal?.toLowerCase().includes('blood pressure')) {
        rda = 1500; // mg, lower for heart health
      }
      break;
      
    case 'cholesterol':
      // Upper limit rather than target
      rda = 300; // mg
      break;
      
    case 'sugar':
    case 'added sugar':
      // Limit to <10% of daily calories
      rda = (dailyCalories * 0.1) / 4; // 4 calories per gram of sugar
      break;
    
    default:
      // If we don't have special handling for this nutrient, return the original percentDailyValue
      return typeof nutrient.percentDailyValue === 'number' ? nutrient.percentDailyValue : 0;
  }

  if (rda > 0 && amount > 0) {
    // For limit nutrients like sodium, saturated fat, etc., show % of maximum
    const isLimitNutrient = ['sodium', 'saturated fat', 'cholesterol', 'sugar', 'added sugar'].includes(nutrientName);
    
    // Calculate percent of daily value
    const percentDV = Math.round((amount / rda) * 100);
    
    // Log for debugging
    console.log(`[DV%] ${nutrient.name}: ${amount}${nutrient.unit} = ${percentDV}% of ${rda.toFixed(1)}${nutrient.unit} daily ${isLimitNutrient ? 'limit' : 'target'}`);
    
    return percentDV;
  }
  
  // Use default values or API-provided values as fallback
  return typeof nutrient.percentDailyValue === 'number' ? nutrient.percentDailyValue : 0;
}

/**
 * Get the complete profile button options based on profile status
 */
export function getCompleteProfileButton(profile: UserProfile | null, missingFields: string[]): {
  text: string;
  variant: 'default' | 'primary' | 'warning' | 'danger';
  description: string;
} {
  if (!profile) {
    return {
      text: 'Create Profile',
      variant: 'danger',
      description: 'Create your profile to personalize your nutrition analysis'
    };
  }
  
  const fieldCount = missingFields.length;
  
  if (fieldCount === 0) {
    return {
      text: 'Profile Complete',
      variant: 'default',
      description: 'Your profile is complete and being used for personalized analysis'
    };
  }
  
  if (fieldCount <= 2) {
    return {
      text: `Complete Profile (${fieldCount} Field${fieldCount > 1 ? 's' : ''} Missing)`,
      variant: 'warning',
      description: `Add ${missingFields.join(', ')} to get fully personalized analysis`
    };
  }
  
  return {
    text: `Complete Profile (Missing ${fieldCount} Fields)`,
    variant: 'danger',
    description: 'Complete your profile to get personalized nutrition analysis'
  };
}

// Common descriptions for nutrients
export const NUTRIENT_DESCRIPTIONS: Record<string, string> = {
  'protein': 'Essential for building and repairing tissues, supports immune function and enzyme production.',
  'carbs': 'Primary energy source for the body, particularly important for brain function and physical activity.',
  'carbohydrates': 'Primary energy source for the body, particularly important for brain function and physical activity.',
  'fat': 'Provides energy, supports cell growth, protects organs, and helps absorb certain nutrients.',
  'fiber': 'Promotes digestive health, helps maintain bowel health, lowers cholesterol levels, and helps control blood sugar levels.',
  'sodium': 'Regulates fluid balance, nerve transmission, and muscle function. Excess intake may increase blood pressure in some individuals.',
  'calcium': 'Essential for bone and tooth health, muscle function, nerve transmission, and blood clotting.',
  'iron': 'Required for hemoglobin production, which carries oxygen in the blood. Supports immune function and cognitive performance.',
  'vitamin a': 'Important for vision, immune function, and cellular communication. Supports skin and mucous membrane health.',
  'vitamin c': 'Antioxidant that supports immune function and collagen production. Enhances iron absorption and wound healing.',
  'vitamin d': 'Crucial for calcium absorption and bone health. Supports immune function and cell growth regulation.',
  'vitamin e': 'Antioxidant that protects cells from damage. Supports immune function and prevents clot formation.',
  'vitamin k': 'Essential for blood clotting and bone metabolism. May help maintain bone health.',
  'thiamin': 'Helps convert nutrients into energy and is essential for nerve and muscle function.',
  'riboflavin': 'Important for energy production, cellular function, and metabolism of fats, drugs, and steroids.',
  'niacin': 'Helps convert food into energy and maintains healthy skin, nerves, and digestive system.',
  'vitamin b6': 'Involved in over 100 enzyme reactions, particularly protein metabolism. Supports immune and nervous system function.',
  'folate': 'Essential for DNA synthesis and repair. Particularly important during pregnancy for fetal development.',
  'vitamin b12': 'Vital for red blood cell formation, neurological function, and DNA synthesis.',
  'potassium': 'Regulates fluid balance, muscle contractions, and nerve signals. May help reduce blood pressure.',
  'phosphorus': 'Important for bone and tooth formation, energy production, and cell membrane structure.',
  'magnesium': 'Involved in over 300 biochemical reactions. Supports muscle and nerve function, energy production, and bone health.',
  'zinc': 'Essential for immune function, protein synthesis, wound healing, DNA synthesis, and cell division.',
  'selenium': 'Antioxidant that helps prevent cell damage. Supports immune function and thyroid health.',
  'copper': 'Helps form red blood cells, maintains nerve cells and immune function. Contributes to iron absorption.',
  'manganese': 'Cofactor for many enzymes involved in metabolism, bone formation, and antioxidant defenses.',
  'cholesterol': 'Important structural component of cell membranes. Used to make hormones and vitamin D.',
  'saturated fat': 'Type of fat found mainly in animal products. High intake may increase cholesterol levels in some individuals.',
  'trans fat': 'Artificial fat that can raise bad cholesterol and lower good cholesterol. Linked to increased heart disease risk.',
  'unsaturated fat': 'Healthy fat found in plant oils, nuts, seeds, and fish. May help improve cholesterol levels.',
  'omega-3': 'Type of essential fatty acid that supports heart and brain health, reduces inflammation, and supports cell membrane function.',
  'omega-6': 'Essential fatty acid important for brain function and growth and development. Works with omega-3 fatty acids.',
};

/**
 * Safely parse a number or return default
 */
function parseNumberOrDefault(value: any, defaultValue: number | null): number | null {
  if (value === null || value === undefined) return defaultValue;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Determine daily calorie needs based on profile
 */
export function calculateDailyCalories(profile: UserProfile): number {
  // Use default values if profile or specific fields are not complete
  const age = profile?.age ?? DEFAULT_PROFILE.age;
  const weight = profile?.weight ?? DEFAULT_PROFILE.weight;
  const height = profile?.height ?? DEFAULT_PROFILE.height;
  const gender = profile?.gender ?? DEFAULT_PROFILE.gender;
  const activityLevel = profile?.activity_level?.toLowerCase() ?? DEFAULT_PROFILE.activity_level.toLowerCase();
  const goal = profile?.goal?.toLowerCase() ?? DEFAULT_PROFILE.goal.toLowerCase();

  // Ensure units are consistent or convert, using defaults from DEFAULT_PROFILE if necessary
  const weightUnit = profile?.weight_unit ?? DEFAULT_PROFILE.weight_unit;
  const heightUnit = profile?.height_unit ?? DEFAULT_PROFILE.height_unit;

  const weightInKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
  const heightInCm = heightUnit === 'in' ? height * 2.54 : height;
  
  console.log(`[calculateDailyCalories] Input Profile - Age: ${age}, Weight: ${weight} ${weightUnit}, Height: ${height} ${heightUnit}, Gender: ${gender}, Activity: ${activityLevel}, Goal: ${goal}`);
  console.log(`[calculateDailyCalories] Converted values - Weight (kg): ${weightInKg}, Height (cm): ${heightInCm}`);

  let bmr;

  if (gender === 'Male') {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
  } else {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
  }
  
  // Activity multiplier
  let activityMultiplier = 1.2; // Sedentary
  if (activityLevel.includes('light')) activityMultiplier = 1.375;
  else if (activityLevel.includes('moderate')) activityMultiplier = 1.55;
  else if (activityLevel.includes('active')) activityMultiplier = 1.725;
  else if (activityLevel.includes('very')) activityMultiplier = 1.9;
  
  // Total daily energy expenditure
  const tdee = Math.round(bmr * activityMultiplier);
  
  // Adjust for goals
  let adjustedCalories = tdee;
  if (goal.includes('weight loss') || goal.includes('lose weight')) {
    adjustedCalories = Math.round(tdee * 0.8); // 20% deficit
  } else if (goal.includes('muscle gain') || goal.includes('gain muscle') || goal.includes('gain weight')) {
    adjustedCalories = Math.round(tdee * 1.1); // 10% surplus
  }
  
  return adjustedCalories;
}

/**
 * Calculate personalized macro targets based on profile
 */
export function calculateMacroTargets(profile: UserProfile): { protein: number, carbs: number, fat: number } {
  // Use default values if profile or specific fields are not complete
  const dailyCalories = calculateDailyCalories(profile); // Relies on defaults within calculateDailyCalories

  const goal = profile?.goal?.toLowerCase() ?? DEFAULT_PROFILE.goal.toLowerCase();
  const weight = profile?.weight ?? DEFAULT_PROFILE.weight;
  const weightUnit = profile?.weight_unit ?? DEFAULT_PROFILE.weight_unit;
  const weightInKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
  
  // Protein calculation
  let proteinPerKg = 1.6; // Default protein target
  if (goal.includes('muscle') || goal.includes('strength')) {
    proteinPerKg = 2.0; // Higher for muscle building
  } else if (goal.includes('endurance')) {
    proteinPerKg = 1.8; // Higher for endurance athletes
  } else if (goal.includes('weight loss')) {
    proteinPerKg = 2.2; // Higher for weight loss to preserve muscle
  }
  
  const proteinGrams = Math.round(weightInKg * proteinPerKg);
  const proteinCalories = proteinGrams * 4;
  
  // Fat calculation (at least 20% of calories)
  let fatPercentage = 0.25; // Default 25% of calories from fat
  if (goal.includes('keto') || goal.includes('low carb')) {
    fatPercentage = 0.7; // 70% for keto
  } else if (goal.includes('heart') || goal.includes('cholesterol')) {
    fatPercentage = 0.2; // 20% for heart health
  }
  
  const fatCalories = dailyCalories * fatPercentage;
  const fatGrams = Math.round(fatCalories / 9);
  
  // Remaining calories go to carbs
  const remainingCalories = dailyCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(remainingCalories / 4);
  
  return {
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams
  };
}

/**
 * Validates and normalizes nutrient data to ensure consistency
 * This is used to fix display inconsistencies across the application
 */
export function validateNutrientData(nutrients: any[], profile: UserProfile | null): any[] {
  if (!nutrients || !Array.isArray(nutrients)) return [];
  
  return nutrients.map(nutrient => {
    // Create a copy of the nutrient to avoid modifying the original
    const validatedNutrient = { ...nutrient };
    
    // Ensure nutrient has all required fields
    if (!validatedNutrient.name) validatedNutrient.name = 'Unknown Nutrient';
    if (typeof validatedNutrient.amount !== 'number') validatedNutrient.amount = 0;
    if (!validatedNutrient.unit) validatedNutrient.unit = 'g';
    
    // Calculate personalized DV if profile exists
    if (profile) {
      validatedNutrient.percentDailyValue = calculatePersonalizedDV(validatedNutrient, profile);
    } else if (typeof validatedNutrient.percentDailyValue !== 'number') {
      // Fallback to 0 if no percentDailyValue
      validatedNutrient.percentDailyValue = 0;
    }
    
    // Add status based on DV percentage
    if (validatedNutrient.percentDailyValue >= 50) {
      validatedNutrient.status = 'high';
    } else if (validatedNutrient.percentDailyValue >= 25) {
      validatedNutrient.status = 'adequate';
    } else {
      validatedNutrient.status = 'low';
    }
    
    return validatedNutrient;
  });
}

/**
 * Applies standard mapping to nutrient names for consistency
 */
export function standardizeNutrientName(name: string): string {
  if (!name) return '';
  
  const normalized = name.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Direct mapping for common variants
  const mappings: Record<string, string> = {
    'carbs': 'carbohydrates',
    'carb': 'carbohydrates',
    'total carbohydrates': 'carbohydrates',
    'total carbs': 'carbohydrates',
    'dietary fiber': 'fiber',
    'total fiber': 'fiber',
    'total fat': 'fat',
    'vitamin b1': 'thiamin',
    'vitamin b2': 'riboflavin',
    'vitamin b3': 'niacin',
    'total sugars': 'sugar',
    'added sugars': 'added sugar',
  };
  
  return mappings[normalized] || normalized;
}

/**
 * Calculate personalized daily nutrient targets based on user profile
 * Using evidence-based formulas from NIH, WHO, and sports nutrition research
 */
export const calculatePersonalizedDailyTargets = (profile: any) => {
  if (!profile) return null;
  
  // Extract and normalize profile data
  const gender = profile.gender?.toLowerCase() || 'male';
  const isMale = gender.includes('male') && !gender.includes('female');
  const age = profile.age || 35;
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const activityLevel = profile.activity_level?.toLowerCase() || 'moderate';
  const goal = profile.goal?.toLowerCase() || 'general health';
  
  // Convert measurements if needed
  const weightInKg = profile.weight_unit === 'lb' ? weight / 2.20462 : weight;
  const heightInCm = profile.height_unit === 'in' ? height * 2.54 : height;
  
  // Calculate BMR using Mifflin-St Jeor equation (more accurate than previous formula)
  let bmr = 0;
  if (isMale) {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
  } else {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
  }
  
  // Activity multipliers based on activity level
  const activityMultipliers = {
    'sedentary': 1.2,       // Little/no exercise
    'lightly active': 1.375, // Light exercise 1-3 days/week
    'light': 1.375,
    'moderate': 1.55,       // Moderate exercise 3-5 days/week
    'moderately active': 1.55,
    'active': 1.725,        // Hard exercise 6-7 days/week
    'very active': 1.9,     // Hard daily exercise & physical job
    'extra active': 2.05,   // Intense training 2x/day
    'athlete': 2.05
  };
  
  // Find best match for activity level
  let multiplier = 1.55; // Default to moderate
  for (const [key, value] of Object.entries(activityMultipliers)) {
    if (activityLevel.includes(key)) {
      multiplier = value;
      break;
    }
  }
  
  // Calculate TDEE (Total Daily Energy Expenditure)
  let tdee = Math.round(bmr * multiplier);
  
  // Special case for larger, very active users
  if (weightInKg > 90 && (activityLevel.includes('very') || activityLevel.includes('active'))) {
    const minCalories = 3200;
    tdee = Math.max(tdee, minCalories);
  }
  
  // Adjust based on goal
  let goalMultiplier = 1.0; // Default is maintenance
  if (goal.includes('loss') || goal.includes('cut')) {
    goalMultiplier = 0.80; // 20% deficit for weight loss (science-based deficit)
  } else if (goal.includes('gain') || goal.includes('bulk') || goal.includes('muscle')) {
    goalMultiplier = 1.10; // 10% surplus for muscle gain
  }
  
  const adjustedCalories = Math.round(tdee * goalMultiplier);
  
  // Macro distribution based on scientific recommendations
  // Protein: 1.6-2.2g/kg for active, 1.2-1.4g/kg for moderate, 0.8g/kg for sedentary
  // Fat: 0.5-1g/kg minimum for hormone function
  // Carbs: remaining calories
  
  let proteinInGrams = 0;
  let fatInGrams = 0;
  
  // Protein based on weight and activity level
  if (activityLevel.includes('very') || activityLevel.includes('athlete')) {
    proteinInGrams = Math.round(weightInKg * 1.8); // 1.8g/kg for very active
  } else if (activityLevel.includes('active')) {
    proteinInGrams = Math.round(weightInKg * 1.4); // 1.4g/kg for active
  } else if (activityLevel.includes('moderate')) {
    proteinInGrams = Math.round(weightInKg * 1.2); // 1.2g/kg for moderate
  } else {
    proteinInGrams = Math.round(weightInKg * 0.8); // 0.8g/kg for sedentary
  }
  
  // Adjust protein based on goals
  if (goal.includes('muscle') || goal.includes('strength')) {
    proteinInGrams = Math.max(proteinInGrams, Math.round(weightInKg * 2.0)); // 2.0g/kg for muscle gain
  } else if (goal.includes('weight loss') || goal.includes('cut')) {
    proteinInGrams = Math.max(proteinInGrams, Math.round(weightInKg * 1.8)); // 1.8g/kg for weight loss
  }
  
  // Minimum fat requirement
  const minFatInGrams = Math.round(weightInKg * 0.8); // 0.8g/kg minimum for hormone health
  
  // Determine fat based on goal and adjusted to be realistic
  if (goal.includes('keto') || goal.includes('low carb')) {
    // Keto: 70-75% calories from fat
    fatInGrams = Math.round((adjustedCalories * 0.70) / 9);
  } else if (goal.includes('heart') || goal.includes('cholesterol')) {
    // Heart health: 25-30% calories from fat, prioritizing unsaturated
    fatInGrams = Math.round((adjustedCalories * 0.27) / 9);
  } else {
    // Default: 30-35% calories from fat
    fatInGrams = Math.round((adjustedCalories * 0.33) / 9);
  }
  
  // Ensure minimum fat requirement is met
  fatInGrams = Math.max(fatInGrams, minFatInGrams);
  
  // Calculate protein and fat calories
  const proteinCalories = proteinInGrams * 4;
  const fatCalories = fatInGrams * 9;
  
  // Remaining calories go to carbs
  const remainingCalories = adjustedCalories - proteinCalories - fatCalories;
  const carbsInGrams = Math.max(Math.round(remainingCalories / 4), 50); // Ensure at least 50g of carbs
  
  // Calculate other important nutrients
  const fiberInGrams = Math.round(adjustedCalories / 1000 * 14); // 14g per 1000 calories
  const calciumInMg = isMale ? 1000 : (age > 50 ? 1200 : 1000);
  const ironInMg = isMale ? 8 : (age > 50 ? 8 : 18);
  const vitaminC = isMale ? 90 : 75; // mg
  const vitaminD = (age > 70) ? 20 : 15; // mcg
  const sodiumLimit = goal.includes('heart') ? 1500 : 2300; // mg
  const potassiumTarget = 4700; // mg
  
  // Return comprehensive targets
  return {
    calories: adjustedCalories,
    protein: proteinInGrams,
    fat: fatInGrams,
    carbohydrates: carbsInGrams,
    fiber: fiberInGrams,
    saturated_fat: Math.round((adjustedCalories * 0.07) / 9), // 7% limit
    calcium: calciumInMg,
    iron: ironInMg,
    vitamin_c: vitaminC,
    vitamin_d: vitaminD,
    sodium: sodiumLimit,
    potassium: potassiumTarget,
    water: Math.round(weightInKg * 0.033 * 1000) // ml, 33ml per kg
  };
};

// Helper function to convert calories to fiber needs
const caloriesToFiber = (calories: number, gender: string) => {
  // Based on 14g per 1000 calories, with adjustments for gender
  const baseFiber = (calories / 1000) * 14;
  return gender === 'male' ? Math.max(baseFiber, 38) : Math.max(baseFiber, 25);
};

// Categorize PDV (Percent Daily Value) into Low, Adequate, or High
// Updated with more specific ranges for better information
export const categorizePDV = (value: number, isLimitNutrient: boolean = false) => {
  if (isLimitNutrient) {
    // For nutrients to limit (like sodium, saturated fat)
    if (value > 100) return 'excessive';
    if (value > 75) return 'high';
    if (value > 50) return 'moderate';
    return 'good'; // Low levels of limit nutrients are good
  } else {
    // For nutrients to encourage
    if (value < 10) return 'very low';
    if (value < 25) return 'low';
    if (value >= 100) return 'excellent';
    if (value >= 75) return 'high';
    if (value >= 50) return 'good';
    return 'moderate';
  }
};

/**
 * Calculate percent daily value for a nutrient based on amount and FDA reference values
 * @param nutrientName The name of the nutrient
 * @param amount The amount of the nutrient
 * @param unit The unit of measurement (g, mg, mcg)
 * @returns The calculated percent daily value or 0 if reference not found
 */
export function calculateDVPercent(nutrientName: string, amount: number, unit: string): number {
  // Standardize the nutrient name for lookup
  const standardName = standardizeNutrientName(nutrientName);
  
  // Get reference value from FDA map
  const referenceData = FDA_DAILY_VALUES[standardName];
  
  if (!referenceData) {
    console.warn(`No reference daily value found for nutrient: ${standardName}`);
    return 0;
  }
  
  // Handle unit conversion
  let convertedAmount = amount;
  const refUnit = referenceData.unit;
  
  // Convert units if needed
  if (unit !== refUnit) {
    if (unit === 'g' && refUnit === 'mg') {
      convertedAmount *= 1000; // g to mg
    } else if (unit === 'g' && refUnit === 'mcg') {
      convertedAmount *= 1000000; // g to mcg
    } else if (unit === 'mg' && refUnit === 'g') {
      convertedAmount /= 1000; // mg to g
    } else if (unit === 'mg' && refUnit === 'mcg') {
      convertedAmount *= 1000; // mg to mcg
    } else if (unit === 'mcg' && refUnit === 'g') {
      convertedAmount /= 1000000; // mcg to g
    } else if (unit === 'mcg' && refUnit === 'mg') {
      convertedAmount /= 1000; // mcg to mg
    }
  }
  
  // Calculate percent
  const percent = (convertedAmount / referenceData.value) * 100;
  
  // Round to nearest integer for display purposes
  return Math.round(percent);
} 