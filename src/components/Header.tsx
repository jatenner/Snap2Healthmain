'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '../context/auth';

export default function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // The redirect is handled in the AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="font-bold text-xl text-green-600">
            Snap2Health
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-green-600">
              Home
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-green-600">
                  Dashboard
                </Link>
                <Link href="/analyze" className="text-gray-700 hover:text-green-600">
                  Analyze Meal
                </Link>
              </>
            ) : (
              <Link href="/about" className="text-gray-700 hover:text-green-600">
                About
              </Link>
            )}
          </nav>
          
          <div>
            {user ? (
              <button 
                onClick={handleSignOut}
                className="text-gray-700 hover:text-green-600"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex space-x-4">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-green-600"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 