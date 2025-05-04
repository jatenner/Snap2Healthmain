'use client';

import { useEffect } from 'react';

export default function DisableAuthBypass() {
  useEffect(() => {
    // Override the environment variables through window.ENV
    if (typeof window !== 'undefined') {
      window.ENV = window.ENV || {};
      window.ENV.NEXT_PUBLIC_MOCK_AUTH = 'false';
      window.ENV.NEXT_PUBLIC_AUTH_BYPASS = 'false';
      
      // Store in localStorage for persistence
      localStorage.setItem('MOCK_AUTH', 'false');
      localStorage.setItem('AUTH_BYPASS', 'false');
      
      console.log('Auth bypass disabled via client-side override');
    }
  }, []);
  
  return null;
} 