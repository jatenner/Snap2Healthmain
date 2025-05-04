'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';

export function UserStatusBanner() {
  const { user } = useAuth();
  const router = useRouter();
  
  if (!user) return null;
  
  const profileComplete = user.user_metadata?.height && 
                         user.user_metadata?.weight && 
                         user.user_metadata?.age && 
                         user.user_metadata?.gender;
  
  return (
    <div className="w-full bg-gradient-to-r from-green-600 to-green-700 shadow-md">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold">
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            {profileComplete ? (
              <span className="bg-white text-green-700 text-xs font-bold px-2 py-1 rounded">
                PROFILE COMPLETE
              </span>
            ) : (
              <button 
                onClick={() => router.push('/profile')}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1 rounded border border-white/40"
              >
                Complete Profile
              </button>
            )}
            
            <button
              onClick={() => router.push('/profile')}
              className="bg-white text-green-700 text-xs font-medium px-3 py-1 rounded"
            >
              My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 