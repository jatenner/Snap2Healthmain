import './globals.css';
import { AuthProvider } from '@/src/context/auth';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata = {
  title: 'Snap2Health - Your AI Nutrition Assistant',
  description: 'Get personalized nutrition analysis from photos of your meals',
  manifest: '/manifest.json'
};

// Generate a cache-busting version ID with timestamp to ensure latest version
const getVersionId = () => {
  return process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || 
         process.env.VERCEL_GIT_COMMIT_SHA || 
         Date.now().toString();
};

export default function RootLayout({ children }) {
  // Generate a unique cache-busting version
  const version = getVersionId();
  const timestamp = Date.now();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent caching to avoid stale assets */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Add version for debugging */}
        <meta name="app-version" content={version} />
        <meta name="app-timestamp" content={timestamp} />
        
        {/* Preload auth fix script */}
        <link 
          rel="preload" 
          href={`/auth-client-fix.js?v=${version}&t=${timestamp}`} 
          as="script" 
          importance="high" 
          crossOrigin="anonymous"
        />
        
        {/* Load auth fix script as early as possible with forced no-cache */}
        <Script
          id="auth-client-fix"
          src={`/auth-client-fix.js?v=${version}&t=${timestamp}`}
          strategy="beforeInteractive"
          fetchPriority="high"
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 