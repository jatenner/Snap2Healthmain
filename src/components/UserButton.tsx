'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/auth';

export default function UserButton() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // If no user, don't render anything
  if (!user) return null;

  // Get first letter of email for avatar
  const avatarText = user.email ? user.email[0].toUpperCase() : 'U';

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    // Use window.location to ensure a clean redirect
    window.location.href = '/login';
  };

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
          {avatarText}
        </div>
        <span className="hidden md:inline text-sm text-gray-700">
          {user.user_metadata?.username || user.email}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.user_metadata?.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          
          <a 
            href="/profile" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Your Profile
          </a>
          
          <a 
            href="/dashboard" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Meal History
          </a>
          
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 