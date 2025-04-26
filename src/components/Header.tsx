'use client';

import React from 'react';
import Link from 'next/link';
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
      </div>
    </header>
  );
} 