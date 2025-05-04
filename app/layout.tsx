import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/auth';
import EnvLoader from './env-loader';
import { cn } from '@/lib/utils';
import ProfileSetupPrompt from '@/components/ProfileSetupPrompt';
import { NavBar } from '@/components/NavBar';
import { DemoAccountWarning } from '@/components/DemoAccountWarning';
import CacheMonitor from '@/components/CacheMonitor';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Snap2Health - Your AI Nutrition Guide',
  description: 'Analyze your meals with AI for personalized nutrition insights.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://snap2health.vercel.app'),
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  pragma: 'no-cache',
  expires: '0'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate a version string for cache busting
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString();
  const version = `v-${buildTimestamp.replace(/[^0-9]/g, '')}`; 
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production';
  
  return (
    <html lang="en" className="dark" suppressHydrationWarning data-version={version}>
      <head>
        {/* Metadata */}
        <meta name="version" content={version} />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Apply immediate dark theme to prevent flash */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { 
            background-color: #020e2c !important;
            color: #ffffff !important;
            min-height: 100vh;
          }
          body {
            background-image: 
              radial-gradient(circle at 20% 35%, #0a2053 0%, transparent 25%),
              radial-gradient(circle at 75% 65%, #1e3a7b 0%, transparent 25%) !important;
          }
          .loading-overlay { display: none !important; }
        `}} />
      </head>
      <body 
        className={cn(
          "min-h-[100dvh] bg-background font-sans antialiased",
          inter.className
        )}
        data-version={version}
        data-env={isProduction ? 'production' : 'development'}
      >
        {/* Environment variables loader */}
        <EnvLoader />
        
        {/* Authentication provider */}
        <AuthProvider>
          {/* Demo account warning banner */}
          <DemoAccountWarning />
          
          {/* Always show navigation */}
          <NavBar />
          
          {/* Main content */}
          <main className="flex-1">{children}</main>
          
          {/* Profile setup prompt */}
          <ProfileSetupPrompt />
          
          {/* Client-side cache monitor */}
          <CacheMonitor />
        </AuthProvider>
      </body>
    </html>
  );
} 