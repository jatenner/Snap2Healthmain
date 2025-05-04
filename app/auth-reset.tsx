'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthReset() {
  const router = useRouter();
  
  useEffect(() => {
    // Clear all auth-related items from localStorage
    try {
      // Clear Supabase auth
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      
      // Clear custom auth
      localStorage.removeItem('use-local-auth');
      localStorage.removeItem('local-auth-user');
      
      // Clear any other potential auth data
      localStorage.removeItem('authSession');
      localStorage.removeItem('authUser');
      
      // Clear all session storage
      sessionStorage.clear();
      
      // Clear all cookies related to auth
      document.cookie.split(';').forEach(c => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      
      console.log('Auth data cleared successfully');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login?reset=true');
      }, 2000);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Authentication Reset</h1>
        <div className="text-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <p className="text-gray-600 mb-4">
          Clearing authentication data and resetting your session...
        </p>
        <p className="text-gray-500 text-sm">
          You will be redirected to the login page in a few seconds.
        </p>
      </div>
    </div>
  );
} 