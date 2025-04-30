'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth';

// Add TypeScript declaration for window.ENV
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      NEXT_PUBLIC_MOCK_AUTH?: string;
      NEXT_PUBLIC_AUTH_BYPASS?: string;
      NEXT_PUBLIC_APP_ENV?: string;
    };
  }
}

// Define the auth context type
interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error } | undefined>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: Error } | undefined>;
  signOut: () => Promise<void>;
  setMockUser?: () => void;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authBypass, setAuthBypass] = useState(false);

  // Check if authentication bypass is enabled
  useEffect(() => {
    const bypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true' || 
                  window?.ENV?.NEXT_PUBLIC_AUTH_BYPASS === 'true';
    
    console.log('Login page - AUTH_BYPASS:', bypass ? 'enabled' : 'disabled');
    setAuthBypass(bypass);
  }, []);

  const handleDevLogin = () => {
    console.log('Using development login');
    // Store a flag in localStorage to enable mock auth
    window.localStorage.setItem('MOCK_AUTH', 'true');
    // Redirect to home page
    window.location.href = '/';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic form validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting sign in with:', email);
      
      // Test login shortcut for demo purposes
      if (email === 'test@example.com' && password === 'password') {
        console.log('Using test credentials, bypassing auth');
        window.localStorage.setItem('MOCK_AUTH', 'true');
        router.push('/');
        return;
      }
      
      // Attempt to sign in using auth context
      const result = await signIn(email, password);
      
      if (result?.error) {
        throw result.error;
      }
      
      // Get redirect path from search params, default to home page
      const redirectPath = searchParams.get('redirect') || '/';
      console.log('Login successful, redirecting to:', redirectPath);
      
      // Use window.location for a full page refresh
      window.location.href = redirectPath;
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-darkBlue-secondary">
      <div className="w-full max-w-md p-8 space-y-8 bg-darkBlue-accent/10 backdrop-blur-sm rounded-xl border border-darkBlue-accent/30">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-accent">Snap2Health</h1>
          <h2 className="mt-6 text-xl text-blue-100">Sign in to your account</h2>
        </div>
        
        {authBypass && (
          <div className="pt-2">
            <Button
              onClick={handleDevLogin}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Development Login (No Auth)
            </Button>
            <p className="mt-2 text-xs text-center text-blue-100/70">
              Auth bypass is enabled. Click above to skip authentication.
            </p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-darkBlue-secondary/60 border-darkBlue-accent/40 text-blue-100"
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-darkBlue-secondary/60 border-darkBlue-accent/40 text-blue-100"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 text-sm bg-red-900/30 border border-red-800/50 text-red-200 rounded">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? <Spinner className="mr-2" size="sm" /> : null}
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link 
                href="/signup" 
                className="text-cyan-accent hover:text-cyan-accent/80"
              >
                Create account
              </Link>
            </div>
            <div className="text-sm">
              <Link 
                href="/" 
                className="text-cyan-accent hover:text-cyan-accent/80"
              >
                Back to home
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 