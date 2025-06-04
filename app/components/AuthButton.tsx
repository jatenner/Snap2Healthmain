'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './client/ClientAuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export function AuthButton() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Display username or email first part when signed in
  const displayName = user?.email ? user.email.split('@')[0] : 'User';
  
  if (isLoading) {
    return (
      <button
        className="px-3 py-2 text-sm font-medium rounded-md bg-gray-200 text-gray-400 dark:bg-gray-700"
        disabled
      >
        Loading...
      </button>
    );
  }
  
  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-green-600 py-1 px-3 rounded-lg flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-medium text-sm">{displayName}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="px-3 py-2 text-sm font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
        >
          Sign Out
        </button>
      </div>
    );
  }
  
  return (
    <Link
      href="/login"
      className="px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 inline-block"
    >
      Sign In
    </Link>
  );
} 