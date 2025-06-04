'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth';
import ProfileForm from '../../../components/ProfileForm';
import { createClient } from '../../lib/supabase/client';
import type { Database } from '../../../lib/database.types';

export default function ProfileEditPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/signin?redirectTo=%2Fprofile%2Fedit');
    }
  }, [user, loading, router]);
  
  // Handle profile form submission
  const handleProfileSubmit = async (profileData: any) => {
    if (!user || !user.id) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Update the user's metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          username: `${profileData.firstName} ${profileData.lastName}`.trim() || user.email?.split('@')[0],
          age: profileData.age,
          gender: profileData.gender,
          height: profileData.height,
          weight: profileData.weight,
          activityLevel: profileData.activityLevel,
          defaultGoal: profileData.defaultGoal
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Also update the profiles table if you're using it
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          username: profileData.username || user.email?.split('@')[0],
          updated_at: new Date().toISOString(),
          age: profileData.age ? Number(profileData.age) : null,
          gender: profileData.gender,
          height: profileData.height ? Number(profileData.height) : null,
          weight: profileData.weight ? Number(profileData.weight) : null
        });
      
      // Success - redirect to profile page
      router.push('/profile');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSaveError(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Profile...</h1>
          <div className="w-24 h-24 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // If no user, show placeholder while redirecting
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-lg">Redirecting to login...</p>
      </div>
    );
  }
  
  // Extract profile data from user metadata
  const profile = {
    firstName: user.user_metadata?.firstName || '',
    lastName: user.user_metadata?.lastName || '',
    gender: user.user_metadata?.gender || 'neutral',
    age: user.user_metadata?.age || '',
    weight: user.user_metadata?.weight || '',
    height: user.user_metadata?.height || '',
    activityLevel: user.user_metadata?.activityLevel || 'moderate',
    defaultGoal: user.user_metadata?.defaultGoal || 'General Wellness'
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Edit Your Profile</h1>
      
      {saveError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {saveError}
        </div>
      )}
      
      <ProfileForm 
        profile={profile} 
        onSubmit={handleProfileSubmit} 
        loading={isSaving} 
      />
      
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/profile')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none mr-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 