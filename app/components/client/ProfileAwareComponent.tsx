'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth';
import { createBrowserClient } from '@supabase/ssr';
import { getEffectiveProfile, isProfileComplete, UserProfile, ExtendedUserProfile, getMissingProfileFields } from '../../../src/utils/profile-manager';

interface ProfileAwareComponentProps {
  children: (props: {
    profile: ExtendedUserProfile | null;
    isLoading: boolean;
    isComplete: boolean;
    missingFields: string[];
  }) => React.ReactNode;
}

/**
 * Client Component for Profile-Aware Rendering
 * This component handles profile data loading and passes it to its children
 * Ensures consistency and prevents hydration errors
 */
export default function ProfileAwareComponent({ children }: ProfileAwareComponentProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [effectiveProfile, setEffectiveProfile] = useState<ExtendedUserProfile | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch profile data
  useEffect(() => {
    // Don't run this on the server
    if (typeof window === 'undefined') return;
    if (!user) {
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }
    
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile data:', error);
          // Try to get from localStorage as backup
          try {
            const storedProfile = localStorage.getItem('profile_backup');
            if (storedProfile) {
              setProfileData(JSON.parse(storedProfile));
            }
          } catch (e) {
            console.error('Error reading profile from localStorage:', e);
          }
        } else {
          setProfileData(data);
          // Store in localStorage for backup
          try {
            localStorage.setItem('profile_backup', JSON.stringify(data));
          } catch (e) {
            console.error('Error storing profile backup:', e);
          }
        }
      } catch (e) {
        console.error('Unexpected error fetching profile:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user, supabase]);

  // Process profile data
  useEffect(() => {
    // Don't run this on the server
    if (typeof window === 'undefined') return;
    
    // Process profile data
    const processProfile = () => {
      // Get effective profile with defaults for missing values
      const processedProfile = getEffectiveProfile(profileData);
      setEffectiveProfile(processedProfile);
      
      // Check if profile is complete
      const profileComplete = processedProfile ? isProfileComplete(processedProfile) : false;
      setIsComplete(profileComplete);
      
      // Get missing fields if any
      const missing = processedProfile ? 
        getMissingProfileFields(processedProfile) : 
        ['age', 'gender', 'height', 'weight', 'goal', 'activity_level'];
      setMissingFields(missing);
      
      // Mark as initialized
      setIsInitialized(true);
    };
    
    // Process profile data
    processProfile();
    
    // Force refresh if profile data changes
    const handleProfileChange = () => {
      console.log('[ProfileAwareComponent] Profile change detected, refreshing');
      processProfile();
    };
    
    window.addEventListener('profile-updated', handleProfileChange);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileChange);
    };
  }, [profileData]);

  // Show loading state until profile is processed
  if (!isInitialized) {
    return children({ 
      profile: null, 
      isLoading: true, 
      isComplete: false, 
      missingFields: [] 
    });
  }

  // Render children with profile data
  return children({ 
    profile: effectiveProfile, 
    isLoading: isLoading || authLoading, 
    isComplete, 
    missingFields 
  });
} 