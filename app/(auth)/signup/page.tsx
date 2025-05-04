'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';

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
        setStatus({ type: 'success', message: 'Account created successfully!' });
        // Redirect to profile setup instead of homepage
        setTimeout(() => router.push('/profile?setup=true'), 1500);
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
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
              {status.message}
              <p className="mt-1">You'll be redirected to complete your profile...</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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