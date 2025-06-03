import React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientAuthProvider } from './components/client/ClientAuthProvider';
import { ProfileProvider } from './lib/profile-context';
import NavBar from './components/NavBar';

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Force fresh build - Updated: 2025-06-02T23:00:00Z

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Snap2Health',
  description: 'Your personal nutrition assistant',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head></head>
      <body className={`${inter.className} bg-gray-900 text-gray-200`}>
        <ClientAuthProvider>
          <ProfileProvider>
            <div className="min-h-screen bg-gray-900 text-white">
              <NavBar />
              <main className="container mx-auto px-4 pt-16 pb-8">
                {children}
              </main>
            </div>
          </ProfileProvider>
        </ClientAuthProvider>
      </body>
    </html>
  );
} 