'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function AuthTestPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  
  // Check auth status on mount
  useEffect(() => {
    async function getSession() {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          setUser(session.user);
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setError(err.message || 'Authentication error');
      } finally {
        setLoading(false);
      }
    }
    
    getSession();
  }, [supabase]);
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Error signing out');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {user ? (
        <div>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">✅ Authenticated</p>
            <p>User ID: {user.id}</p>
            <p>Email: {user.email}</p>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={handleSignOut}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p>Not authenticated</p>
          </div>
          
          <div className="flex flex-col space-y-2 mt-4">
            <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-center">
              Go to Login
            </Link>
            <Link href="/signup" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-center">
              Create Account
            </Link>
          </div>
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold mb-2">Navigation Test</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/dashboard" className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded text-center">
            Dashboard (Protected)
          </Link>
          <Link href="/profile" className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded text-center">
            Profile (Protected)
          </Link>
          <Link href="/" className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded text-center">
            Home (Public)
          </Link>
          <Link href="/test-image" className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded text-center">
            Test Image (Public)
          </Link>
        </div>
      </div>
    </div>
  );
} 