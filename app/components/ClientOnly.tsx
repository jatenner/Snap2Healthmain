'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ClientOnly({ 
  children, 
  fallback = null
}: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);
  
  // Set mounted to true after first render on client
  useEffect(() => {
    // Use a longer timeout (50ms) to ensure client hydration is complete
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Only render children on the client
  if (!mounted) {
    return fallback;
  }
  
  return children;
}
