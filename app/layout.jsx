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
  // Generate a unique cache-busting version for this page load
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
        <meta name="auth-fix-version" content="4" />
        
        {/* Force early initialization */}
        <Script
          id="auth-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Clear auth storage immediately on page load
                if (window.localStorage) {
                  // Clear any stale instances flag
                  window.localStorage.removeItem('multiple-gotrue-instances');
                  window.localStorage.setItem('auth-init-time', Date.now().toString());
                  
                  // Force cache refresh
                  const cacheParam = '?v=' + Date.now();
                  window.__cacheBustingParam = cacheParam;
                }
              } catch (e) {
                console.error('Auth init error:', e);
              }
            `
          }}
        />
        
        {/* Preload auth fix script with highest priority */}
        <link 
          rel="preload" 
          href={`/auth-client-fix.js?v=${version}&t=${timestamp}`} 
          as="script" 
          importance="high" 
          priority="high"
          fetchpriority="high"
          crossOrigin="anonymous"
        />
        
        {/* Load auth fix script as early as possible with forced no-cache */}
        <Script
          id="auth-client-fix"
          src={`/auth-client-fix.js?v=${version}&t=${timestamp}`}
          strategy="beforeInteractive"
          fetchPriority="high"
          onLoad={() => {
            // Add a global marker that the script has loaded
            if (typeof window !== 'undefined') {
              window.__authFixLoaded = true;
              
              // Clear any previous instances flag to ensure clean state
              try {
                if (window.localStorage) {
                  window.localStorage.setItem('auth-fix-loaded-at', Date.now().toString());
                }
              } catch (e) {
                console.error('Error setting auth fix load timestamp:', e);
              }
            }
          }}
        />
        
        {/* Clear browser caches on load - helps prevent stale auth data */}
        <Script
          id="cache-invalidator"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Clear stale caches that might affect auth
                if ('caches' in window) {
                  caches.keys().then(keyList => {
                    return Promise.all(keyList.map(key => {
                      if (key.includes('auth') || key.includes('supabase')) {
                        return caches.delete(key);
                      }
                    }));
                  });
                }
                
                // Service worker cleanup if needed
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (let registration of registrations) {
                      if (registration.scope.includes(window.location.origin)) {
                        // Unregister any service workers that might be caching auth data
                        registration.unregister();
                      }
                    }
                  });
                }
                
                // Set a flag to indicate cache was cleared
                if (window.sessionStorage) {
                  window.sessionStorage.setItem('cache-cleared', 'true');
                  window.sessionStorage.setItem('cache-cleared-at', new Date().toISOString());
                }
              } catch (e) {
                console.error('Cache invalidation error:', e);
              }
            `
          }}
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