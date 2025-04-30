'use client';

import React from 'react';
import Link from 'next/link';

export function NavBarSimple() {
  return (
    <nav className="bg-darkBlue-secondary/80 backdrop-blur-sm shadow-lg border-b border-darkBlue-accent/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-cyan-accent">
            Snap2Health
          </Link>
          
          <div className="flex space-x-4 items-center">
            <Link href="/" className="text-white hover:text-cyan-accent">
              Home
            </Link>
            
            <Link href="/history" className="text-white hover:text-cyan-accent">
              History
            </Link>
            
            <Link href="/profile" className="text-white hover:text-cyan-accent">
              Profile
            </Link>
            
            <Link 
              href="/login"
              className="px-3 py-1 rounded-md bg-cyan-accent hover:bg-cyan-accent/90 text-gray-900 font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 