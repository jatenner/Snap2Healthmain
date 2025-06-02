'use client';

import React from 'react';
import Script from 'next/script';
import { useEffect } from 'react';

/**
 * ClientScripts component loads essential client-side scripts
 * This helps fix issues with environment variables and API keys
 */
export default function ClientScripts() {
  useEffect(() => {
    // Initialize any client-side functionality here
    console.log('[ClientScripts] Initializing client-side scripts');
    
    // Force profile data to be recognized if already in localStorage
    if (typeof window !== 'undefined') {
      try {
        // Check if profile data exists in localStorage
        const profileData = localStorage.getItem('profile_backup');
        if (profileData) {
          const profile = JSON.parse(profileData);
          console.log('[ClientScripts] Found profile data in localStorage:', profile);
          
          // Set as global variable to ensure components can access it
          window._forcedProfileData = profile;
          
          // Set data attribute on body to indicate profile is available
          document.body.setAttribute('data-profile-fixed', 'true');
        }
      } catch (error) {
        console.error('[ClientScripts] Error processing profile data:', error);
      }
    }
  }, []);
  
  return (
    <>
      {/* Environment variable check script */}
      <Script
        id="env-check-script"
        src="/env-check.js"
        strategy="beforeInteractive"
      />

      {/* Fix OpenAI model issues - ensure gpt-4o is used instead of deprecated models */}
      <Script
        id="fix-openai-model-script"
        src="/fix-openai-model.js"
        strategy="beforeInteractive"
      />
      
      {/* Fix OpenAI API key issues - handle line breaks and formatting */}
      <Script
        id="fix-openai-key-script" 
        src="/fix-openai-key.js"
        strategy="beforeInteractive"
      />
      
      {/* General environment variable debugging and fixes */}
      <Script
        id="debug-env-vars-script"
        src="/debug-env-vars.js"
        strategy="afterInteractive"
      />
    </>
  );
} 