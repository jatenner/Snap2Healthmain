'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { usePathname, useRouter } from 'next/navigation';
import { shouldUseLocalAuth, updateLocalUser } from '@/app/(auth)/login/auth-workaround';

export default function ProfileSetupPrompt() {
  const { user, reloadUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Only show prompt if:
    // 1. User is logged in
    // 2. Not already on the profile page
    // 3. Not in the auth routes
    // 4. Profile isn't already completed
    // 5. User hasn't dismissed the prompt in this session
    if (
      user && 
      !pathname.includes('/profile') && 
      !pathname.includes('/login') && 
      !pathname.includes('/signup') && 
      !user.profile_completed &&
      !dismissed
    ) {
      // Check if the username is empty or is just the email prefix
      const username = user.user_metadata?.username || '';
      const emailPrefix = user.email?.split('@')[0] || '';
      
      // If username is missing or equals the email prefix, show the prompt
      if (!username || username === emailPrefix || username === 'Demo User') {
        setShowPrompt(true);
      }
    } else {
      setShowPrompt(false);
    }
  }, [user, pathname, dismissed]);
  
  const handleComplete = () => {
    router.push('/profile?setup=true');
  };
  
  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    
    // Mark as completed in local storage to avoid future prompts in this session
    if (shouldUseLocalAuth()) {
      updateLocalUser({
        profile_completed: true
      });
      reloadUser();
    }
  };
  
  if (!showPrompt) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-5 w-80 border border-blue-300 animate-pulse-subtle">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-bold">Complete Your Profile</h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <p className="text-white/90 mb-3">
        <strong>For the most personalized results</strong>, please complete your health profile. Your diet recommendations will be customized based on your health data.
      </p>
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-sm text-white/80 hover:text-white border border-white/30 rounded"
        >
          Later
        </button>
        <button
          onClick={handleComplete}
          className="px-4 py-1.5 text-sm bg-white text-blue-700 rounded-md font-medium hover:bg-blue-50"
        >
          Set Up Now
        </button>
      </div>
    </div>
  );
} 