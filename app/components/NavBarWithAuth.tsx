'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './client/ClientAuthProvider';
import { User, LogOut } from 'lucide-react';

export function NavBarWithAuth() {
  const { user, isAuthenticated, signOut, isLoading } = useAuth();

  return (
    <header className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-white text-2xl font-bold hover:text-blue-200 transition-colors">
              Snap2Health
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-white hover:text-blue-200 transition-colors">
              🏠 Home
            </Link>
            <Link href="/upload" className="text-white hover:text-blue-200 transition-colors">
              📤 Upload
            </Link>
            <Link href="/profile" className="text-white hover:text-blue-200 transition-colors">
              👤 Profile
            </Link>
            <Link href="/meal-history" className="text-white hover:text-blue-200 transition-colors">
              📊 History
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="text-white text-sm">Loading...</div>
            ) : isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm">
                    {user.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-green-400 text-sm">Signed In</span>
                </div>
                <button 
                  onClick={signOut}
                  className="text-white hover:text-blue-200 transition-colors text-sm flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="text-white hover:text-blue-200 transition-colors text-sm">
                  🔐 Sign In
                </Link>
                <Link href="/signup" className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-sm">
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