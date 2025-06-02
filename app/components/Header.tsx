'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/auth';
import LoadingSpinner from './LoadingSpinner';

export default function Header() {
  const pathname = usePathname();
  const { user, signOut, isLoading } = useAuth();
  
  const isActive = (path: string) => {
    return pathname === path ? 'text-cyan-accent border-b-2 border-cyan-accent' : 'text-blue-100 hover:text-cyan-accent';
  };
  
  return (
    <header className="bg-darkBlue-primary/90 border-b border-darkBlue-accent/30 sticky top-0 z-10 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-accent to-blue-500 flex items-center justify-center text-darkBlue-primary font-bold text-lg">
              S2H
            </div>
            <span className="text-xl font-bold text-blue-100">Snap<span className="text-cyan-accent">2</span>Health</span>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`${isActive('/')} py-2 transition-colors`}
            >
              Home
            </Link>
            <Link 
              href="/meal-analysis" 
              className={`${isActive('/meal-analysis')} py-2 transition-colors`}
            >
              Meal Analysis
            </Link>
            <Link 
              href="/profile" 
              className={`${isActive('/profile')} py-2 transition-colors`}
            >
              Profile
            </Link>
          </nav>
          
          {/* Auth/Profile Button */}
          <div>
            {isLoading ? (
              <LoadingSpinner size="small" color="blue" text="" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/profile"
                  className="px-3 py-1.5 rounded-full text-sm bg-darkBlue-accent/20 text-cyan-accent hover:bg-darkBlue-accent/30 transition-colors"
                >
                  <span className="hidden sm:inline mr-1">My</span> Profile
                </Link>
                
                <button
                  onClick={() => signOut()}
                  className="text-blue-100/70 hover:text-blue-100 text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="px-4 py-1.5 rounded-md bg-gradient-to-r from-cyan-accent to-blue-500 text-darkBlue-primary font-medium hover:from-cyan-500 hover:to-blue-600 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 