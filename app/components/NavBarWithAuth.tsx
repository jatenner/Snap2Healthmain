'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './client/ClientAuthProvider';
import { User, LogOut, Home, Upload, BarChart3, Menu, X, TrendingUp, Beaker, Settings, ChevronDown, Heart, Camera, Clock } from 'lucide-react';

export function NavBarWithAuth() {
  const { user, isAuthenticated, signOut, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navLinkClass = (href: string) =>
    `flex items-center space-x-2 px-3 py-2 rounded-md transition-colors touch-target ${
      isActive(href)
        ? 'bg-blue-700 text-white font-semibold border-b-2 border-white'
        : 'text-blue-100 hover:text-white hover:bg-blue-500/30'
    }`;

  const mobileNavLinkClass = (href: string) =>
    `flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium touch-target mobile-text transition-colors ${
      isActive(href)
        ? 'bg-blue-600 text-white font-semibold'
        : 'text-white hover:text-blue-200 hover:bg-blue-600'
    }`;

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
          <nav className="hidden lg:flex space-x-2">
            <Link href="/" className={navLinkClass('/')}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link href="/upload" className={navLinkClass('/upload')}>
              <Camera className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            <Link href="/body" className={navLinkClass('/body')}>
              <Heart className="w-4 h-4" />
              <span>Body</span>
            </Link>
            <Link href="/trends" className={navLinkClass('/trends')}>
              <TrendingUp className="w-4 h-4" />
              <span>Trends</span>
            </Link>
            <Link href="/experiments" className={navLinkClass('/experiments')}>
              <Beaker className="w-4 h-4" />
              <span>Insights</span>
            </Link>
            <Link href="/meal-history" className={navLinkClass('/meal-history')}>
              <Clock className="w-4 h-4" />
              <span>History</span>
            </Link>
          </nav>

          {/* Desktop User Section — Profile lives here */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoading ? (
              <div className="text-white text-sm">Loading...</div>
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-white hover:bg-blue-500/30 px-3 py-2 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">{user.email?.split('@')[0] || 'User'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Profile & Settings
                    </Link>
                    <div className="border-t border-slate-700 my-1" />
                    <button
                      onClick={() => { setIsUserMenuOpen(false); signOut(); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-slate-700 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4 text-gray-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="text-white hover:text-blue-200 transition-colors text-sm px-3 py-2 rounded-md">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm">
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
              <Link href="/" className={mobileNavLinkClass('/')} onClick={closeMobileMenu}>
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link href="/upload" className={mobileNavLinkClass('/upload')} onClick={closeMobileMenu}>
                <Camera className="w-5 h-5" />
                <span>Upload</span>
              </Link>
              <Link href="/body" className={mobileNavLinkClass('/body')} onClick={closeMobileMenu}>
                <Heart className="w-5 h-5" />
                <span>Body</span>
              </Link>
              <Link href="/trends" className={mobileNavLinkClass('/trends')} onClick={closeMobileMenu}>
                <TrendingUp className="w-5 h-5" />
                <span>Trends</span>
              </Link>
              <Link href="/experiments" className={mobileNavLinkClass('/experiments')} onClick={closeMobileMenu}>
                <Beaker className="w-5 h-5" />
                <span>Insights</span>
              </Link>
              <Link href="/meal-history" className={mobileNavLinkClass('/meal-history')} onClick={closeMobileMenu}>
                <Clock className="w-5 h-5" />
                <span>History</span>
              </Link>

              {/* Mobile User Section */}
              <div className="border-t border-blue-500 pt-3 mt-3">
                {isLoading ? (
                  <div className="text-white text-base px-3 py-2">Loading...</div>
                ) : isAuthenticated && user ? (
                  <>
                    <Link href="/profile" className={mobileNavLinkClass('/profile')} onClick={closeMobileMenu}>
                      <Settings className="w-5 h-5" />
                      <span>Profile & Settings</span>
                    </Link>
                    <button
                      onClick={() => { closeMobileMenu(); signOut(); }}
                      className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-red-200 hover:bg-red-600/30 w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 px-3">
                    <Link href="/login" onClick={closeMobileMenu} className="text-white text-base py-2">Sign In</Link>
                    <Link href="/signup" onClick={closeMobileMenu} className="bg-blue-800 text-white text-base py-2 px-4 rounded text-center">Sign Up</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
