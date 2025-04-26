import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SupabaseProvider } from '../context/SupabaseProvider';
import Header from '../components/Header';
// Import environment verification (only runs in development)
import '../lib/verifyEnv';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Snap2Health - Nutritional Analysis with AI',
  description: 'Upload food photos or describe meals for instant nutritional analysis powered by GPT-4o',
};

export default function RootLayout({
  children,
}: {
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
      </body>
    </html>
  );
} 