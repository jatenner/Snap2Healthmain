import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AuthProvider } from '@/context/auth';
import { NavBar } from '@/components/NavBar';
import EnvLoader from './env-loader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Snap2Health - Food Nutrition Analysis',
  description: 'Upload food photos and get instant nutritional analysis and health insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Load environment variables */}
        <EnvLoader />
        
        <AuthProvider>
          <div className="flex flex-col min-h-screen relative z-10">
            <NavBar />
            <main className="flex-grow flex flex-col w-full">{children}</main>
            <footer className="bg-darkBlue-secondary/90 backdrop-blur-md border-t border-darkBlue-accent/30 py-4 text-center text-sm text-blue-100/70">
              © {new Date().getFullYear()} Snap2Health. All rights reserved.
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 