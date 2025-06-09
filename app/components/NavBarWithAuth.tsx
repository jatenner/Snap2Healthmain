'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './client/ClientAuthProvider';
import { User, LogOut, Home, Upload, BarChart3, Menu, X } from 'lucide-react';

export function NavBarWithAuth() {
  const { user, isAuthenticated, signOut, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-blue-600 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-white text-xl sm:text-2xl font-bold hover:text-blue-200 transition-colors touch-target"
              onClick={closeMobileMenu}
            >
              Snap2Health
            </Link>
          </div>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex space-x-6">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md touch-target"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link 
              href="/upload" 
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md touch-target"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            <Link 
              href="/profile" 
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md touch-target"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
            <Link 
              href="/meal-history" 
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md touch-target"
            >
              <BarChart3 className="w-4 h-4" />
              <span>History</span>
            </Link>
          </nav>

          {/* Desktop User Section */}
          <div className="hidden lg:flex items-center space-x-4">
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
                  className="text-white hover:text-blue-200 transition-colors text-sm flex items-center px-3 py-2 rounded-md touch-target"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/login" 
                  className="text-white hover:text-blue-200 transition-colors text-sm px-3 py-2 rounded-md touch-target"
                >
                  🔐 Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm touch-target"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-blue-200 transition-colors p-2 touch-target"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-blue-700 border-t border-blue-500">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/" 
                className="flex items-center space-x-3 text-white hover:text-blue-200 hover:bg-blue-600 px-3 py-3 rounded-md text-base font-medium touch-target mobile-text"
                onClick={closeMobileMenu}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link 
                href="/upload" 
                className="flex items-center space-x-3 text-white hover:text-blue-200 hover:bg-blue-600 px-3 py-3 rounded-md text-base font-medium touch-target mobile-text"
                onClick={closeMobileMenu}
              >
                <Upload className="w-5 h-5" />
                <span>Upload Meal</span>
              </Link>
              <Link 
                href="/profile" 
                className="flex items-center space-x-3 text-white hover:text-blue-200 hover:bg-blue-600 px-3 py-3 rounded-md text-base font-medium touch-target mobile-text"
                onClick={closeMobileMenu}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <Link 
                href="/meal-history" 
                className="flex items-center space-x-3 text-white hover:text-blue-200 hover:bg-blue-600 px-3 py-3 rounded-md text-base font-medium touch-target mobile-text"
                onClick={closeMobileMenu}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Meal History</span>
              </Link>
              
              {/* Mobile User Section */}
              <div className="border-t border-blue-500 pt-3 mt-3">
                {isLoading ? (
                  <div className="text-white text-base px-3 py-2 mobile-text">Loading...</div>
                ) : isAuthenticated && user ? (
                  <>
                    <div className="flex items-center space-x-3 px-3 py-2 text-white mobile-text">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-base font-medium">
                          {user.email?.split('@')[0] || 'User'}
                        </div>
                        <div className="text-green-400 text-sm">Signed In</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        signOut();
                        closeMobileMenu();
                      }}
                      className="flex items-center space-x-3 text-white hover:text-blue-200 hover:bg-blue-600 px-3 py-3 rounded-md text-base font-medium w-full text-left touch-target mobile-text"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="flex items-center space-x-3 text-white hover:text-blue-200 hover:bg-blue-600 px-3 py-3 rounded-md text-base font-medium touch-target mobile-text"
                      onClick={closeMobileMenu}
                    >
                      🔐 <span>Sign In</span>
                    </Link>
                    <Link 
                      href="/signup" 
                      className="flex items-center justify-center bg-blue-800 hover:bg-blue-900 text-white px-3 py-3 rounded-md text-base font-medium mt-2 mx-3 touch-target mobile-text"
                      onClick={closeMobileMenu}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 