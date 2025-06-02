'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase/client';
import { useAuth } from '../context/auth';
import { saveProfileData, loadProfileData, initializeProfilePersistence } from './profile-persistence';

// Profile interface
export interface UserProfile {
  id: string;
  full_name?: string;
  age?: number;
  gender?: string;
  height?: number;
  height_unit?: string;
  weight?: number;
  weight_unit?: string;
  goal?: string;
  activity_level?: string;
  created_at?: string;
  updated_at?: string;
}

// Context type
interface ProfileContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

// Create context with default values
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Initialize persistence system
  useEffect(() => {
    initializeProfilePersistence();
  }, []);

  // Load profile data
  const loadProfile = async () => {
    if (!user?.id) {
      console.log('[ProfileContext] No authenticated user, clearing profile');
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[ProfileContext] Loading profile for user:', user.id);
      
      // First check localStorage for immediate loading
      const cachedProfile = loadProfileData(user.id);
      if (cachedProfile) {
        console.log('[ProfileContext] Found cached profile, loading immediately');
        setProfile(cachedProfile);
        setLoading(false);
        
        // Continue to check API in background for updates
        checkApiForUpdates(cachedProfile);
        return;
      }
      
      // No cached data, try API
      await loadFromApi();
      
    } catch (err) {
      console.error('[ProfileContext] Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Check API for profile updates
  const checkApiForUpdates = async (currentProfile: UserProfile) => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.profile && data.profile.updated_at !== currentProfile.updated_at) {
          console.log('[ProfileContext] Found newer profile data from API');
          setProfile(data.profile);
          saveProfileData(data.profile);
        }
      }
    } catch (error) {
      console.warn('[ProfileContext] Background API check failed:', error);
    }
  };

  // Load profile from API
  const loadFromApi = async () => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ProfileContext] API response:', data);
        
        if (data.profile) {
          console.log('[ProfileContext] Successfully loaded profile from API');
          setProfile(data.profile);
          saveProfileData(data.profile);
          return;
        } else if (data.message === 'Profile not found') {
          console.log('[ProfileContext] Profile not found in database, creating minimal profile');
          await createMinimalProfile();
          return;
        }
      } else {
        console.warn('[ProfileContext] API profile fetch failed with status:', response.status);
      }
    } catch (apiError) {
      console.error('[ProfileContext] API error:', apiError);
    }
    
    // If API fails, create minimal profile
    await createMinimalProfile();
  };

  // Create minimal profile
  const createMinimalProfile = async () => {
    if (!user?.id) return;
    
    const minimalProfile: UserProfile = {
      id: user.id,
      full_name: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setProfile(minimalProfile);
    saveProfileData(minimalProfile);
    
    // Try to save to database in background
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(minimalProfile),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.profile) {
          setProfile(result.profile);
          saveProfileData(result.profile);
        }
      }
    } catch (error) {
      console.warn('[ProfileContext] Failed to save minimal profile to database:', error);
    }
  };

  // Function to update profile data
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user?.id) {
        throw new Error('Authentication required to update profile');
      }
      
      // Merge with existing profile data
      const updatedProfile = {
        ...profile,
        ...profileData,
        id: user.id,
        updated_at: new Date().toISOString()
      };
      
      // Update local state immediately for responsive UI
      setProfile(updatedProfile);
      
      // Save to localStorage immediately for persistence
      saveProfileData(updatedProfile);
      console.log('[ProfileContext] Profile saved locally');
      
      // Try to update via API in background
      try {
        const response = await fetch('/api/profile/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProfile),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          console.warn('[ProfileContext] API update failed:', result.error);
          // Don't throw error here - localStorage save was successful
        } else {
          console.log('[ProfileContext] Profile successfully saved to database');
          // Update with the response data in case there were server-side changes
          if (result.profile) {
            setProfile(result.profile);
            saveProfileData(result.profile);
          }
        }
      } catch (apiError) {
        console.warn('[ProfileContext] API update error:', apiError);
        // Don't throw error here - localStorage save was successful
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('[ProfileContext] Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      };
    }
  };

  // Load profile when user changes
  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  // Listen for profile updates from other tabs
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedProfile = event.detail.profile;
      if (updatedProfile.id === user?.id) {
        console.log('[ProfileContext] Profile updated from another tab');
        setProfile(updatedProfile);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
  }, [user?.id]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        loading,
        error,
        refreshProfile: loadProfile,
        updateProfile
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

// Custom hook to use the profile context
export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
} 