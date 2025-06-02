'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../context/auth';

// Simplified sign-up component for the mock/demo
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Get auth from context
  const { signUp, loading } = useAuth();
  
  // Check if we already have a user, redirect to home if we do
  useEffect(() => {
    // If we can check if there's a user, redirect if logged in
    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('user');
        if (user) {
          router.push('/');
        }
      } catch (err) {
        // Ignore error, we'll just show the signup form
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const result = await signUp(email, password, name);
      
      if (result.success) {
        // Check if user needs email confirmation
        if (result.data?.user && !result.data.user.email_confirmed_at) {
          setStatus({ 
            type: 'success', 
            message: 'Account created! Please check your email and click the confirmation link to complete your signup.' 
          });
          // Don't redirect immediately - wait for email confirmation
        } else {
          setStatus({ type: 'success', message: 'Account created successfully!' });
          // Redirect to profile setup if email is already confirmed
          setTimeout(() => router.push('/profile?setup=true'), 1500);
        }
      } else {
        setStatus({ type: 'error', message: result.error || 'Unknown error' });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setStatus({ type: 'error', message: error.message || 'Failed to sign up' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <Image 
              src="/logo.svg" 
              alt="Snap2Health Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">Create an Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          )}
          
          {status.type === 'success' && (
            <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-lg relative" role="alert">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-green-800">Account Created Successfully!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p className="font-semibold">📧 Important: Please check your email</p>
                    <p className="mt-1">We've sent a confirmation link to <strong>{email}</strong></p>
                    <p className="mt-1">You must click the confirmation link in your email before you can sign in.</p>
                  </div>
                  <div className="mt-3 p-3 bg-green-100 rounded border border-green-300">
                    <p className="text-xs text-green-800">
                      <strong>Next steps:</strong><br/>
                      1. Check your email inbox (and spam folder)<br/>
                      2. Click the confirmation link<br/>
                      3. Return here to sign in
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {status.type === 'error' && status.message && !error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              {status.message}
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Create a password"
            />
          </div>
          
          <div>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isSubmitting || loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>📧 Email Confirmation Required:</strong> After creating your account, you'll need to check your email and click the confirmation link before you can sign in.
            </p>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account? <Link href="/login" className="text-indigo-600 hover:text-indigo-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 