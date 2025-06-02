'use client';

export const dynamic = 'force-dynamic';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../context/auth';
import ClientOnly from '@/src/components/ClientOnly';

const LoginPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirectTo') || '/upload';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | React.ReactElement>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, loading, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(redirectParam);
    }
  }, [user, router, redirectParam]);

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
      const { error: loginError } = await login({ email, password });
      
      if (loginError) {
        if (loginError.message.includes('Email not confirmed')) {
          setError(
            <div>
              <p className="font-semibold">📧 Email Not Confirmed</p>
              <p className="mt-1">Please check your email and click the confirmation link to verify your account before signing in.</p>
              <p className="mt-2 text-sm">Don't see the email? Check your spam folder or try signing up again.</p>
            </div>
          );
        } else {
          setError(loginError.message || 'Failed to sign in. Please check your credentials.');
        }
      } else {
        console.log("Login attempt successful, waiting for redirect via useEffect...");
      }
    } catch (err: any) {
      console.error('Login submission error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <Suspense fallback={<div className="flex flex-col min-h-screen items-center justify-center p-4 bg-gray-100 dark:bg-gray-950"><p>Loading page...</p></div>}> 
      <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-gray-100 dark:bg-gray-950">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl dark:bg-slate-900">
          <div className="text-center">
            <Image 
              src="/logo.svg"
              alt="Snap2Health Logo" 
              width={80}
              height={80} 
              className="mx-auto mb-4" 
            />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sign In</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Access your Snap2Health account</p>
          </div>

          {error && (
            <div role="alert" className="p-3 my-4 bg-red-100 border border-red-300 rounded-md text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                placeholder="you@example.com"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 sm:text-sm"
                disabled={isSubmitting || loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                placeholder="••••••••"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 sm:text-sm"
                disabled={isSubmitting || loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </Suspense>
  );
};

export default function LoginPage() {
  return (
    <ClientOnly fallback={<div className="flex flex-col min-h-screen items-center justify-center p-4 bg-gray-100 dark:bg-gray-950"><p>Loading Login...</p></div>}>
      <LoginPageContent />
    </ClientOnly>
  );
} 