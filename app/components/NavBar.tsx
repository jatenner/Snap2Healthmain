'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';

export function NavBar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMockAuth, setIsMockAuth] = useState(false);
  
  // Use this wrapped version of useAuth to avoid errors during server rendering
  const auth = (() => {
    try {
      return useAuth();
    } catch (error) {
      // Return a fallback object with the same shape as the real auth context
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        signIn: async () => ({ error: new Error('Auth not initialized') }),
        signUp: async () => ({ error: new Error('Auth not initialized') }),
        signOut: async () => {},
        setMockUser: () => {}
      };
    }
  })();
  
  useEffect(() => {
    setIsClient(true);
    setIsAuthenticated(auth.isAuthenticated);
    
    // Check if we're in test/mock mode
    const mockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
    const authBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
    setIsMockAuth(mockAuth || authBypass);
  }, [auth.isAuthenticated]);
  
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMockSignIn = () => {
    if (auth.setMockUser) {
      auth.setMockUser();
    }
  };

  return (
    <nav className="bg-darkBlue-secondary/80 backdrop-blur-sm shadow-lg border-b border-darkBlue-accent/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-cyan-accent">
            Snap2Health
          </Link>
          
          <div className="flex space-x-4 items-center">
            <Link href="/" className="text-white hover:text-cyan-accent">
              Home
            </Link>
            
            <Link href="/history" className="text-white hover:text-cyan-accent">
              History
            </Link>
            
            {isMockAuth && !isAuthenticated && (
              <button 
                onClick={handleMockSignIn}
                className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-medium"
              >
                Mock Sign In
              </button>
            )}
            
            {(isClient && isAuthenticated) ? (
              <>
                <Link href="/profile" className="text-white hover:text-cyan-accent">
                  Profile
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="px-3 py-1 rounded-md bg-darkBlue-accent/60 hover:bg-darkBlue-accent text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              !isMockAuth && (
                <Link 
                  href="/login"
                  className="px-3 py-1 rounded-md bg-cyan-accent hover:bg-cyan-accent/90 text-gray-900 font-medium"
                >
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 