'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from './client/ClientAuthProvider';
import { useProfile } from '../lib/profile-context';

export default function HomeWelcome() {
  const { user, isLoading } = useAuth();
  const { profile } = useProfile();
  const [userName, setUserName] = React.useState('');
  
  // Extract user name from profile, not from meal data
  React.useEffect(() => {
    // Debug: Log the current profile data
    console.log('HomeWelcome: Profile data:', profile);
    console.log('HomeWelcome: Latest meal data:', localStorage.getItem('last_meal_analysis'));
    
    // Only extract name from profile data, never from meal data
    if (profile?.full_name) {
      setUserName(profile.full_name);
    } else if (user?.email) {
      // Fallback to email username if profile not loaded
      const emailParts = user.email.split('@');
      const emailName = emailParts[0] || user.email;
      setUserName(emailName);
    }
  }, [profile, user]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="text-center mb-8">
      <div className="inline-block bg-blue-900/30 text-blue-300 px-4 py-2 rounded-full text-sm">
        {userName ? (
          <span className="font-medium">Welcome back, {userName}!</span>
        ) : (
          <span className="font-medium">Welcome back!</span>
        )} You're signed in and ready to analyze meals.
      </div>
    </div>
  );
} 