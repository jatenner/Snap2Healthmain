/**
 * Profile Persistence Utility
 * Handles saving and loading profile data across browser sessions
 */

import { UserProfile } from './profile-context';

const STORAGE_KEYS = {
  PRIMARY: 'user_profile',
  BACKUP: 'profile_backup',
  LEGACY: 'snap2health_profile'
};

/**
 * Save profile data to multiple storage locations for redundancy
 */
export function saveProfileData(profile: UserProfile): void {
  if (!profile || !profile.id) {
    console.warn('[ProfilePersistence] Cannot save profile without ID');
    return;
  }

  try {
    const profileWithTimestamp = {
      ...profile,
      _lastSaved: Date.now(),
      updated_at: profile.updated_at || new Date().toISOString()
    };

    const profileJson = JSON.stringify(profileWithTimestamp);

    // Save to multiple keys for redundancy
    localStorage.setItem(STORAGE_KEYS.PRIMARY, profileJson);
    localStorage.setItem(STORAGE_KEYS.BACKUP, profileJson);
    
    // Also save to sessionStorage for current session
    sessionStorage.setItem('current_profile', profileJson);

    console.log('[ProfilePersistence] Profile saved successfully for user:', profile.id);
  } catch (error) {
    console.error('[ProfilePersistence] Error saving profile:', error);
  }
}

/**
 * Load profile data from storage, checking multiple locations
 */
export function loadProfileData(userId?: string): UserProfile | null {
  try {
    const storageKeys = [
      STORAGE_KEYS.PRIMARY,
      STORAGE_KEYS.BACKUP,
      STORAGE_KEYS.LEGACY
    ];

    for (const key of storageKeys) {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const profile = JSON.parse(storedData);
          
          // Validate the profile data
          if (profile && typeof profile === 'object' && profile.id) {
            // If userId is provided, ensure it matches
            if (userId && profile.id !== userId) {
              continue;
            }
            
            console.log(`[ProfilePersistence] Loaded profile from ${key} for user:`, profile.id);
            return profile;
          }
        }
      } catch (parseError) {
        console.warn(`[ProfilePersistence] Error parsing profile from ${key}:`, parseError);
        // Remove corrupted data
        localStorage.removeItem(key);
      }
    }

    // Check sessionStorage as fallback
    try {
      const sessionData = sessionStorage.getItem('current_profile');
      if (sessionData) {
        const profile = JSON.parse(sessionData);
        if (profile && profile.id && (!userId || profile.id === userId)) {
          console.log('[ProfilePersistence] Loaded profile from sessionStorage');
          return profile;
        }
      }
    } catch (sessionError) {
      console.warn('[ProfilePersistence] Error loading from sessionStorage:', sessionError);
    }

    console.log('[ProfilePersistence] No valid profile found in storage');
    return null;
  } catch (error) {
    console.error('[ProfilePersistence] Error loading profile:', error);
    return null;
  }
}

/**
 * Clear all profile data from storage
 */
export function clearProfileData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    sessionStorage.removeItem('current_profile');
    
    console.log('[ProfilePersistence] All profile data cleared');
  } catch (error) {
    console.error('[ProfilePersistence] Error clearing profile data:', error);
  }
}

/**
 * Check if profile data exists in storage
 */
export function hasProfileData(userId?: string): boolean {
  const profile = loadProfileData(userId);
  return profile !== null;
}

/**
 * Migrate old profile data to new format if needed
 */
export function migrateProfileData(): void {
  try {
    // Check for old format data and migrate if necessary
    const oldKeys = ['profile_data', 'userProfile', 'currentUserProfile'];
    
    for (const oldKey of oldKeys) {
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        try {
          const profile = JSON.parse(oldData);
          if (profile && profile.id) {
            console.log(`[ProfilePersistence] Migrating profile data from ${oldKey}`);
            saveProfileData(profile);
            localStorage.removeItem(oldKey);
          }
        } catch (error) {
          console.warn(`[ProfilePersistence] Error migrating from ${oldKey}:`, error);
          localStorage.removeItem(oldKey);
        }
      }
    }
  } catch (error) {
    console.error('[ProfilePersistence] Error during migration:', error);
  }
}

/**
 * Initialize profile persistence system
 */
export function initializeProfilePersistence(): void {
  console.log('[ProfilePersistence] Initializing profile persistence system');
  
  // Run migration on initialization
  migrateProfileData();
  
  // Set up storage event listener for cross-tab synchronization
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.PRIMARY && event.newValue) {
        try {
          const updatedProfile = JSON.parse(event.newValue);
          console.log('[ProfilePersistence] Profile updated in another tab');
          
          // Dispatch custom event for components to listen to
          window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: { profile: updatedProfile }
          }));
        } catch (error) {
          console.error('[ProfilePersistence] Error handling storage event:', error);
        }
      }
    });
  }
} 