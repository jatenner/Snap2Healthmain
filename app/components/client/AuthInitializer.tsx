'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

/**
 * AuthInitializer component
 * 
 * This component ensures that authentication is properly initialized before rendering the app.
 * It checks the auth session status and ensures cookies are properly set.
 */
export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    // Check auth status
    const checkAuthStatus = async () => {
      try {
        console.log('[AuthInitializer] Checking auth status...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthInitializer] Auth error:', error);
          setAuthError(error.message);
          return;
        }
        
        // If we have a session, ensure user ID is accessible
        if (data.session) {
          console.log('[AuthInitializer] Authenticated as:', data.session.user.id);
          
          // Check if cookies are properly set
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            console.error('[AuthInitializer] User retrieval error:', userError);
            // Try to refresh session
            await supabase.auth.refreshSession();
          }
          
          // Update user data in localStorage for backup purposes
          try {
            localStorage.setItem('userProfile', JSON.stringify({
              id: data.session.user.id,
              email: data.session.user.email,
              lastUpdated: new Date().toISOString()
            }));
          } catch (e) {
            console.warn('[AuthInitializer] Could not update localStorage:', e);
          }
        } else {
          console.log('[AuthInitializer] No active session');
        }
        
        setAuthInitialized(true);
      } catch (e) {
        console.error('[AuthInitializer] Unexpected error:', e);
        setAuthError('Authentication initialization failed');
      }
    };
    
    checkAuthStatus();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthInitializer] Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('[AuthInitializer] User signed in');
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthInitializer] User signed out');
        router.refresh();
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);
  
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-white">Initializing application...</div>
      </div>
    );
  }
  
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-red-800/50 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-red-200">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
} 