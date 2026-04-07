'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { AuthProvider } from '../context/auth';
import LoadingSpinner from './LoadingSpinner';
import { useRouter, usePathname } from 'next/navigation';

interface ClientShellProps {
  children: ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-white">Loading application...</p>
      </div>
    </div>
  );
}

export default function ClientShell({ children }: ClientShellProps) {
  const [mounted, setMounted] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const SafeWrap = useCallback(({ children }: { children: ReactNode }) => {
    return mounted ? <>{children}</> : <div className="min-h-screen bg-gray-900"></div>;
  }, [mounted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    const handleError = (e: ErrorEvent) => {
      if (e.message?.includes('Supabase') || e.message?.includes('auth')) {
        console.error('[ClientShell] Auth initialization error:', e.message);
        setAuthFailed(true);
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isPublicRoute = ['/login', '/signup', '/'].includes(pathname);

    if (authFailed && !isPublicRoute) {
      console.log('[ClientShell] Auth failed, redirecting to login');
      router.push('/login');
    }
  }, [mounted, pathname, authFailed, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-opacity-50">Loading application...</div>
      </div>
    );
  }

  if (authFailed) {
    // Auth failed — redirect to login instead of using fake auth
    return (
      <SafeWrap>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-lg font-medium">Authentication Error</p>
            <p className="mt-2 text-gray-400">Please <a href="/login" className="text-blue-400 underline">sign in</a> to continue.</p>
          </div>
        </div>
      </SafeWrap>
    );
  }

  return (
    <SafeWrap>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SafeWrap>
  );
}
