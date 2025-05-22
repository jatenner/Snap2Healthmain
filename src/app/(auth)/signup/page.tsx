'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
<<<<<<< HEAD
import { useAuth } from '@/context/auth';
=======
import { useAuth } from '../../../context/AuthContext';
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Improved error handling function to make error messages more user-friendly
  const getUserFriendlyError = (error: any): string => {
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('already registered')) {
      return 'This email is already registered. Please sign in or use a different email.';
    }
    else if (errorMessage.includes('weak password')) {
      return 'Your password is too weak. Please use at least 6 characters with numbers and special characters.';
    }
    else if (errorMessage.includes('rate limit')) {
      return 'Too many signup attempts. Please try again in a moment.';
    }
    else if (errorMessage.includes('Too many requests')) {
      return 'Too many requests. Please try again later.';
    }
    
    // Default fallback
    return 'Unable to create your account. Please check your information and try again.';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await signUp(email, password, username);
      setSuccess('Account created! Please check your email to confirm your account before signing in. (Check your spam folder if you don\'t see it)');
      // Don't redirect immediately, let the user see the success message
    } catch (err: any) {
      setError(getUserFriendlyError(err));
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-indigo-600">Snap2Health</h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Create your account</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="rounded-md shadow-sm space-y-3">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (min. 6 characters)"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm bg-red-50 border border-red-200 text-red-600 p-3 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="text-sm bg-green-50 border border-green-200 text-green-600 p-3 rounded-md">
              {success}
              <div className="mt-2">
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Go to Sign In
                </Link>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !!success}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${success ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? 'Creating Account...' : success ? 'Account Created' : 'Sign up'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 