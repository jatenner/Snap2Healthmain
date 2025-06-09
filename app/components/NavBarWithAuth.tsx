'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './client/ClientAuthProvider';
import { User, LogOut, Home, Upload, BarChart3 } from 'lucide-react';

export function NavBarWithAuth() {
  const { user, isAuthenticated, signOut, isLoading } = useAuth();

  return (
    <header className="bg-blue-600 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-white text-2xl font-bold hover:text-blue-200 transition-colors">
              Snap2Health
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex space-x-6">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link 
              href="/upload" 
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            <Link 
              href="/profile" 
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
            <Link 
              href="/meal-history" 
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              <BarChart3 className="w-4 h-4" />
              <span>History</span>
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
                  className="text-white hover:text-blue-200 transition-colors text-sm flex items-center px-3 py-2 rounded-md"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/login" 
                  className="text-white hover:text-blue-200 transition-colors text-sm px-3 py-2 rounded-md"
                >
                  🔐 Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm"
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