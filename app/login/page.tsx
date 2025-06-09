'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/client/ClientAuthProvider';
import { createClient, shouldUseMockAuth } from '../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, isLoading, isAuthenticated } = useAuth();
  const useMockAuth = shouldUseMockAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/upload');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    if (!email || !password) {
      setError('Email and password are required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (useMockAuth) {
        // For development mode - simple demo credentials
        if (email === 'demo@snap2health.com' && password === 'demo123') {
          console.log('Development login successful for:', email);
          // Trigger a page refresh to update auth state
          window.location.href = '/upload';
        } else {
          setError('For demo mode, use: demo@snap2health.com / demo123');
        }
      } else {
        // Real Supabase authentication
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) {
          setError(authError.message);
        } else if (data.user) {
          console.log('Login successful:', data.user.email);
          router.push('/upload');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-xl border border-gray-700">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Sign In</h1>
          <p className="mt-2 text-gray-400">
            {useMockAuth ? 'Demo Mode - No Database Required' : 'Access your Snap2Health account'}
          </p>
        </div>

        {useMockAuth && (
          <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-md text-yellow-300 text-sm">
            <strong>Demo Mode:</strong> Use demo@snap2health.com / demo123
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm">
            <p className="mb-2">{error}</p>
            {error.includes('Invalid login credentials') && (
              <div className="mt-3 pt-3 border-t border-red-700">
                <p className="text-red-200 text-xs mb-2">This error can mean:</p>
                <ul className="text-red-200 text-xs space-y-1 list-disc list-inside">
                  <li>Wrong password</li>
                  <li>Email not verified yet</li>
                  <li>Account doesn't exist</li>
                </ul>
                <Link 
                  href={`/debug-auth?email=${encodeURIComponent(email)}`}
                  className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  🔍 Diagnose this issue
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={useMockAuth ? "demo@snap2health.com" : "you@example.com"}
              className="mt-1 block w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400 sm:text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={useMockAuth ? "demo123" : "••••••••"}
              className="mt-1 block w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400 sm:text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <button 
              type="submit" 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          {!useMockAuth && (
            <div className="text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError('Enter your email address first');
                    return;
                  }
                  try {
                    const supabase = createClient();
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`
                    });
                    if (error) {
                      setError(error.message);
                    } else {
                      setError('');
                      alert('Password reset email sent! Check your inbox.');
                    }
                  } catch (err) {
                    setError('Failed to send reset email. Please try again.');
                  }
                }}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-blue-400 hover:text-blue-300">
            Sign up
          </Link>
        </p>
        
        {/* Development Helper */}
        {useMockAuth && (
          <div className="mt-4 p-3 bg-gray-700 rounded-md text-center">
            <p className="text-xs text-gray-400 mb-2">Quick Demo Login</p>
            <button
              type="button"
              onClick={() => {
                setEmail('demo@snap2health.com');
                setPassword('demo123');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Fill Demo Credentials
            </button>
          </div>
        )}

        {!useMockAuth && (
          <div className="mt-4 p-3 bg-green-900/50 border border-green-700 rounded-md text-center">
            <p className="text-xs text-green-300">✅ Connected to Supabase</p>
          </div>
        )}
      </div>
    </div>
  );
} 