'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

export function DemoAccountWarning() {
  const { user, signOut } = useAuth();
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  useEffect(() => {
    // Check if the current user is a demo account
    if (user && user.email === 'demo@snap2health.com') {
      setIsDemoAccount(true);
    } else {
      setIsDemoAccount(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    // Clear local storage and cookies before signing out
    if (typeof window !== 'undefined') {
      localStorage.removeItem('use-local-auth');
      localStorage.removeItem('local-auth-user');
      localStorage.removeItem('auth-ready');
      document.cookie = "use-local-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "local-auth-user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    
    // Sign out
    await signOut();
  };

  if (!isDemoAccount) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            You are currently signed in as a demo user. Your data may not be saved permanently.
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              onClick={handleSignOut}
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300"
            >
              Switch to Real Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 