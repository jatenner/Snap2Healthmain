'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './client/ClientAuthProvider';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();

  // Function to determine if a link is active
  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center text-blue-400 font-bold text-xl">
              Snap2Health
            </Link>
            <nav className="ml-6 flex items-center space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 text-sm font-medium ${isActive('/') ? 'text-blue-400' : 'text-white hover:text-blue-200'}`}
              >
                Home
              </Link>
              <Link 
                href="/upload" 
                className={`px-3 py-2 text-sm font-medium ${isActive('/upload') ? 'text-blue-400' : 'text-white hover:text-blue-200'}`}
              >
                Upload
              </Link>
              <Link 
                href="/analysis" 
                className={`px-3 py-2 text-sm font-medium ${isActive('/analysis') ? 'text-blue-400' : 'text-white hover:text-blue-200'}`}
              >
                Analysis
              </Link>
              <Link 
                href="/meal-history" 
                className={`px-3 py-2 text-sm font-medium ${isActive('/meal-history') ? 'text-blue-400' : 'text-white hover:text-blue-200'}`}
              >
                History
              </Link>
              <Link 
                href="/profile" 
                className={`px-3 py-2 text-sm font-medium ${isActive('/profile') ? 'text-blue-400' : 'text-white hover:text-blue-200'}`}
              >
                Profile
              </Link>
            </nav>
          </div>

          <div className="flex items-center">
            {isLoading ? (
              <div className="text-gray-400">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm">
                  {user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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