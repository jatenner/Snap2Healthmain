'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './client/ClientAuthProvider';
import { User, LogOut, Home, Menu, X, TrendingUp, Beaker, Settings, ChevronDown, Heart, Camera, Clock, MessageCircle, Repeat } from 'lucide-react';

export function NavBarWithAuth() {
  const { user, isAuthenticated, signOut, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const navLink = (href: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(href) ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const mobileLink = (href: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
      isActive(href) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="text-lg font-bold text-gray-900" onClick={closeMobileMenu}>
            Snap2Health
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className={navLink('/')}><Home className="w-4 h-4" /> Home</Link>
            <Link href="/upload" className={navLink('/upload')}><Camera className="w-4 h-4" /> Upload</Link>
            <Link href="/habits" className={navLink('/habits')}><Repeat className="w-4 h-4" /> Habits</Link>
            <Link href="/body" className={navLink('/body')}><Heart className="w-4 h-4" /> Body</Link>
            <Link href="/trends" className={navLink('/trends')}><TrendingUp className="w-4 h-4" /> Trends</Link>
            <Link href="/experiments" className={navLink('/experiments')}><Beaker className="w-4 h-4" /> Insights</Link>
            <Link href="/chat" className={navLink('/chat')}><MessageCircle className="w-4 h-4" /> Chat</Link>
            <Link href="/meal-history" className={navLink('/meal-history')}><Clock className="w-4 h-4" /> Timeline</Link>
          </nav>

          {/* User menu */}
          <div className="hidden md:block">
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                    <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings className="w-4 h-4 text-gray-400" /> Profile & Settings
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={() => { setIsUserMenuOpen(false); signOut(); }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                      <LogOut className="w-4 h-4 text-gray-400" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : !isLoading ? (
              <div className="flex gap-2">
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Sign In</Link>
                <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">Sign Up</Link>
              </div>
            ) : null}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-600">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1">
            <Link href="/" className={mobileLink('/')} onClick={closeMobileMenu}><Home className="w-5 h-5" /> Home</Link>
            <Link href="/upload" className={mobileLink('/upload')} onClick={closeMobileMenu}><Camera className="w-5 h-5" /> Upload</Link>
            <Link href="/habits" className={mobileLink('/habits')} onClick={closeMobileMenu}><Repeat className="w-5 h-5" /> Habits</Link>
            <Link href="/body" className={mobileLink('/body')} onClick={closeMobileMenu}><Heart className="w-5 h-5" /> Body</Link>
            <Link href="/trends" className={mobileLink('/trends')} onClick={closeMobileMenu}><TrendingUp className="w-5 h-5" /> Trends</Link>
            <Link href="/experiments" className={mobileLink('/experiments')} onClick={closeMobileMenu}><Beaker className="w-5 h-5" /> Insights</Link>
            <Link href="/chat" className={mobileLink('/chat')} onClick={closeMobileMenu}><MessageCircle className="w-5 h-5" /> Chat</Link>
            <Link href="/meal-history" className={mobileLink('/meal-history')} onClick={closeMobileMenu}><Clock className="w-5 h-5" /> Timeline</Link>
            <hr className="border-gray-200 my-2" />
            {isAuthenticated ? (
              <>
                <Link href="/profile" className={mobileLink('/profile')} onClick={closeMobileMenu}><Settings className="w-5 h-5" /> Profile</Link>
                <button onClick={() => { closeMobileMenu(); signOut(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 w-full">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-4">
                <Link href="/login" onClick={closeMobileMenu} className="flex-1 text-center py-2 text-gray-700 border border-gray-200 rounded-lg">Sign In</Link>
                <Link href="/signup" onClick={closeMobileMenu} className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
