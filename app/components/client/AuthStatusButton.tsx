'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth';
import { Button } from '../ui/button';

export default function AuthStatusButton() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <button
        className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-sm font-medium"
        disabled
      >
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      </button>
    );
  }

  if (user) {
    return (
      <div className="relative group">
        <button 
          className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="max-w-[100px] truncate">{user.email || 'Signed In'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 hidden group-hover:block">
          <div className="py-1">
            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
              My Profile
            </Link>
            <Link href="/history" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
              Meal History
            </Link>
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href="/login" className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-sm font-medium">
      Sign In
    </Link>
  );
} 