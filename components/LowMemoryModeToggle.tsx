'use client';

import { useState, useEffect } from 'react';

interface LowMemoryModeToggleProps {
  className?: string;
}

// Add global window property declaration
declare global {
  interface Window {
    LOW_MEMORY_MODE?: boolean;
  }
}

export default function LowMemoryModeToggle({ className = '' }: LowMemoryModeToggleProps) {
  const [isLowMemoryMode, setIsLowMemoryMode] = useState(true);
  
  // Always enforce low memory mode
  useEffect(() => {
    localStorage.setItem('LOW_MEMORY_MODE', 'true');
    sessionStorage.setItem('LOW_MEMORY_MODE', 'true');
    window.LOW_MEMORY_MODE = true;
    setIsLowMemoryMode(true);
  }, []);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className="px-2 py-1 text-xs rounded-md bg-amber-600 text-white flex items-center"
        title="Currently in Low Memory Mode to improve stability"
      >
        <span className="mr-1">🔋</span>
        Low Memory Mode Active
      </div>
      
      <p className="mt-1 text-xs text-gray-500/70 max-w-xs text-center">
        Optimized for stability on low-memory systems
      </p>
    </div>
  );
} 