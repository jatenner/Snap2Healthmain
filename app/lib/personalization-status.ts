/**
 * Personalization Status Module
 *
 * Determines whether a user has a real profile or is running on defaults.
 * Every API that produces "personalized" output must call this and include
 * the result so the frontend can display honest labeling.
 */

// Single source of truth for system defaults when no user profile exists.
// This replaces the 5 inconsistent defaults that previously existed.
export const SYSTEM_DEFAULT_PROFILE = {
  gender: 'male' as const,
  age: 30,
  height: 70,          // inches
  height_unit: 'in' as const,
  weight: 170,         // lbs
  weight_unit: 'lb' as const,
  activity_level: 'moderate' as const,
  goal: 'General Wellness',
};

export interface PersonalizationStatus {
  isPersonalized: boolean;
  reason: string;
  missingFields: string[];
  defaultsApplied: Record<string, any>;
}

const REQUIRED_FIELDS = ['age', 'gender', 'weight', 'height'] as const;

/**
 * Determines personalization status from any profile-like object.
 * Works with Supabase user_metadata, profile table rows, or local profile objects.
 */
export function getPersonalizationStatus(profile: Record<string, any> | null | undefined): PersonalizationStatus {
  if (!profile) {
    return {
      isPersonalized: false,
      reason: 'No user profile found. Using system defaults.',
      missingFields: [...REQUIRED_FIELDS],
      defaultsApplied: { ...SYSTEM_DEFAULT_PROFILE },
    };
  }

  const missing: string[] = [];
  const defaultsApplied: Record<string, any> = {};

  for (const field of REQUIRED_FIELDS) {
    const value = profile[field];
    const isEmpty = value === null || value === undefined || value === '' || value === 0;
    if (isEmpty) {
      missing.push(field);
      defaultsApplied[field] = (SYSTEM_DEFAULT_PROFILE as any)[field];
    }
  }

  if (missing.length === 0) {
    return {
      isPersonalized: true,
      reason: 'Using your profile data.',
      missingFields: [],
      defaultsApplied: {},
    };
  }

  if (missing.length < REQUIRED_FIELDS.length) {
    return {
      isPersonalized: false,
      reason: `Profile incomplete — missing: ${missing.join(', ')}. Defaults used for those fields.`,
      missingFields: missing,
      defaultsApplied,
    };
  }

  return {
    isPersonalized: false,
    reason: 'No profile data available. Using system defaults for all fields.',
    missingFields: missing,
    defaultsApplied: { ...SYSTEM_DEFAULT_PROFILE },
  };
}

/**
 * Applies SYSTEM_DEFAULT_PROFILE values for any missing fields.
 * Returns the merged profile + the personalization status.
 */
export function applyDefaultsWithStatus(profile: Record<string, any> | null | undefined): {
  effectiveProfile: Record<string, any>;
  personalizationStatus: PersonalizationStatus;
} {
  const status = getPersonalizationStatus(profile);
  const effectiveProfile: Record<string, any> = {
    ...SYSTEM_DEFAULT_PROFILE,
    ...(profile || {}),
  };

  // Ensure missing fields get defaults (handles fields that exist but are empty/0)
  for (const [field, defaultValue] of Object.entries(status.defaultsApplied)) {
    effectiveProfile[field] = defaultValue;
  }

  return { effectiveProfile, personalizationStatus: status };
}
