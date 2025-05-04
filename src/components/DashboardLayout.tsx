'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="font-bold text-xl text-green-600">
            Snap2Health
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-green-600">
              Dashboard
            </Link>
            <Link href="/analyze" className="text-gray-700 hover:text-green-600">
              Analyze Meal
            </Link>
            <Link href="/profile" className="text-gray-700 hover:text-green-600">
              Profile
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Snap2Health. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 