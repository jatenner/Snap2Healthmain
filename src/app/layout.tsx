import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AuthProvider } from '@/context/auth';
import { NavBar } from '@/components/NavBar';
import EnvLoader from '@/components/EnvLoader';

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
      <head>
        <EnvLoader />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen relative z-10">
            <header className="bg-darkBlue-secondary/80 backdrop-blur-sm shadow-lg border-b border-darkBlue-accent/30">
              <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold text-cyan-accent">Snap2Health</h1>
              </div>
            </header>
            <main className="flex-grow">{children}</main>
            <footer className="bg-darkBlue-secondary/80 backdrop-blur-sm border-t border-darkBlue-accent/30 py-4 text-center text-sm text-blue-100/70">
              © {new Date().getFullYear()} Snap2Health. All rights reserved.
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 