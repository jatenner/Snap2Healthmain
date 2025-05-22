'use client';

import React from 'react';
import Link from 'next/link';
<<<<<<< HEAD
import { useAuth } from '@/context/auth';

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
=======
import UserButton from './UserButton';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          Snap2Health
        </Link>

        <nav className="flex items-center space-x-4">
          <a 
            href="/upload" 
            className="text-gray-700 hover:text-indigo-600 cursor-pointer"
          >
            Analyze Food
          </a>
          
          {!loading && (
            <>
              {user ? (
                <>
                  <a 
                    href="/dashboard" 
                    className="text-gray-700 hover:text-indigo-600 cursor-pointer"
                  >
                    Meal History
                  </a>
                  <UserButton />
                </>
              ) : (
                <>
                  <a 
                    href="/login" 
                    className="text-gray-700 hover:text-indigo-600 cursor-pointer"
                  >
                    Login
                  </a>
                  <a
                    href="/signup"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 cursor-pointer"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </>
          )}
        </nav>
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
      </div>
    </header>
  );
} 