'use client';

import { useEffect, useState } from 'react';

// Mock user data for development mode
const DEV_USER = {
  id: 'dev-test-user-123',
  email: 'dev-user@example.com',
  name: 'Dev Test User',
};

export default function DevModeAuth() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This only runs on the client side
    async function setupDevMode() {
      try {
        // CRITICAL FIX: Always force development mode to true
        // This ensures authentication bypass is always active
        console.log('[DevModeAuth] Forcing development mode ON');
        localStorage.setItem('dev_mode', 'true');
        
        // Set up auth data in various formats that might be used by the app
        
        // Format 1: Simple auth_user_id
        localStorage.setItem('auth_user_id', DEV_USER.id);
        localStorage.setItem('auth_user_email', DEV_USER.email);
        localStorage.setItem('auth_user_name', DEV_USER.name);
        
        // Format 2: Supabase session token
        const mockSupabaseSession = {
          provider_token: null,
          access_token: 'dev-mode-mock-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'dev-mode-mock-refresh-token',
          token_type: 'bearer',
          user: {
            id: DEV_USER.id,
            app_metadata: { provider: 'email' },
            user_metadata: { name: DEV_USER.name },
            aud: 'authenticated',
            email: DEV_USER.email,
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            role: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        };
        
        // Set the session in localStorage for Supabase client to find
        const supabaseKey = 'sb-cyrztlmzanhfybqsakgc-auth-token';
        const mockTokenPackage = {
          currentSession: mockSupabaseSession,
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
        };
        
        localStorage.setItem(supabaseKey, JSON.stringify(mockTokenPackage));
        localStorage.setItem('supabase.auth.token', JSON.stringify(mockTokenPackage));
        
        // Also set a flag to indicate dev mode authentication
        localStorage.setItem('snap2health_dev_auth', 'active');
        
        console.log('[DevModeAuth] Set up development auth data for user:', DEV_USER.id);
        
        // Try to fetch environment data for diagnostic purposes
        try {
          const response = await fetch('/api/test-env');
          if (response.ok) {
            const data = await response.json();
            console.log('[DevModeAuth] Environment data:', data);
          } else {
            console.warn('[DevModeAuth] Failed to fetch environment data, status:', response.status);
          }
        } catch (error) {
          console.error('[DevModeAuth] Failed to fetch environment data:', error);
        }
      } catch (error) {
        console.error('[DevModeAuth] Error setting up development auth:', error);
      } finally {
        setIsInitialized(true);
      }
    }

    setupDevMode();
  }, []);

  // This component doesn't render anything
  return null;
} 