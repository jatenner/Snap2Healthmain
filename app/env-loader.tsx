'use client';

import { useEffect } from 'react';

// This component loads environment variables from Next.js into the window object
// so they're accessible everywhere in the client-side code
export default function EnvLoader() {
  useEffect(() => {
    // Ensure window.ENV is defined
    if (!window.ENV) {
      window.ENV = {};
    }
    
    // Set environment variables from Next.js
    window.ENV.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    window.ENV.NEXT_PUBLIC_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH;
    window.ENV.NEXT_PUBLIC_AUTH_BYPASS = process.env.NEXT_PUBLIC_AUTH_BYPASS;
    window.ENV.NEXT_PUBLIC_APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;
    
    // Log for debugging
    console.log('Environment variables loaded to window.ENV');
  }, []);

  // This component doesn't render anything
  return null;
} 