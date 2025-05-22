import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
<<<<<<< HEAD
import Link from 'next/link';
import { AuthProvider } from '@/context/auth';
import EnvLoader from '@/components/EnvLoader';
=======
import { AuthProvider } from '../context/AuthContext';
import { SupabaseProvider } from '../context/SupabaseProvider';
import Header from '../components/Header';
// Import environment verification (only runs in development)
import '../lib/verifyEnv';
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
<<<<<<< HEAD
  title: 'Snap2Health - Food Nutrition Analysis',
  description: 'Upload food photos and get instant nutritional analysis and health insights',
=======
  title: 'Snap2Health - Nutritional Analysis with AI',
  description: 'Upload food photos or describe meals for instant nutritional analysis powered by GPT-4o',
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
};

export default function RootLayout({
  children,
}: {
<<<<<<< HEAD
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <EnvLoader />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen relative z-10">
            <header className="bg-darkBlue-secondary/80 backdrop-blur-sm shadow-lg border-b border-darkBlue-accent/30">
              <div className="container mx-auto p-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="text-2xl font-bold text-cyan-accent flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Snap2Health</span>
                  </Link>
                  
                  <nav className="flex items-center gap-6">
                    <Link href="/" className="text-blue-100 hover:text-cyan-accent text-sm font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span>Home</span>
                    </Link>
                    
                    <Link href="/history" className="text-blue-100 hover:text-cyan-accent text-sm font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span>History</span>
                    </Link>
                    
                    <Link href="/profile" className="text-blue-100 hover:text-cyan-accent text-sm font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Profile</span>
                    </Link>
                    
                    <div className="h-6 w-px bg-darkBlue-accent/30 mx-1"></div>
                    
                    <div className="bg-darkBlue-accent/20 px-3 py-1 rounded-full text-xs text-cyan-accent border border-darkBlue-accent/40">
                      Demo User
                    </div>
                  </nav>
                </div>
              </div>
            </header>
            <main className="flex-grow">{children}</main>
            <footer className="bg-darkBlue-secondary/80 backdrop-blur-sm border-t border-darkBlue-accent/30 py-4 text-center text-sm text-blue-100/70">
              © {new Date().getFullYear()} Snap2Health. All rights reserved.
            </footer>
          </div>
        </AuthProvider>
=======
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">{children}</main>
              <footer className="bg-gray-100 py-4 text-center text-sm text-gray-600">
                &copy; {new Date().getFullYear()} Snap2Health. All rights reserved.
              </footer>
            </div>
          </AuthProvider>
        </SupabaseProvider>
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
      </body>
    </html>
  );
} 