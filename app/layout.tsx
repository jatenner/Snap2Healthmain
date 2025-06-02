import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/auth';
import { ProfileProvider } from './lib/profile-context';
import SimpleNavBar from './components/SimpleNavBar';

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Snap2Health - AI-Powered Meal Analysis',
  description: 'Transform any meal into actionable nutrition insights with our AI-powered analysis',
  keywords: 'nutrition, meal analysis, AI, health, food tracking',
  authors: [{ name: 'Snap2Health Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-white min-h-screen`}>
        <AuthProvider>
          <ProfileProvider>
            <div className="min-h-screen flex flex-col">
              <SimpleNavBar />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 