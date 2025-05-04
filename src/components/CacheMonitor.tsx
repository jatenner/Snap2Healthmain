'use client';

import { useEffect } from 'react';
import { runCacheMaintenance, isStorageNearlyFull, clearAllCaches } from '@/lib/cache-manager';

/**
 * CacheMonitor Component
 * 
 * A client-side component that monitors browser cache usage and automatically 
 * cleans up caches when necessary to prevent QuotaExceededError.
 * 
 * This component doesn't render anything visible, it just works in the background.
 */
export default function CacheMonitor() {
  useEffect(() => {
    // Run initial cache maintenance on component mount
    const initCaches = async () => {
      try {
        await runCacheMaintenance();
        
        // Set up periodic cache check - less frequent to reduce resource usage
        const interval = setInterval(async () => {
          try {
            const storageFull = await isStorageNearlyFull();
            
            // If storage is nearly full, perform aggressive cleanup
            if (storageFull) {
              console.log('Storage usage high - performing emergency cleanup');
              await clearAllCaches();
            } 
          } catch (error) {
            console.error('Error in cache monitor:', error);
          }
        }, 5 * 60 * 1000); // Check every 5 minutes
        
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error in cache monitor initialization:', error);
      }
    };
    
    initCaches();
    
    // Handle storage errors by clearing caches
    const handleStorageError = () => {
      console.warn('Storage error detected, running emergency cache cleanup');
      clearAllCaches().catch(err => console.error('Failed to clear caches:', err));
    };
    
    // Listen for storage error events
    window.addEventListener('error', (event) => {
      if (
        event.message?.includes('quota') || 
        event.message?.includes('storage') ||
        event.message?.includes('QuotaExceededError')
      ) {
        handleStorageError();
      }
    });
    
    // Also listen for unhandled promise rejections related to storage
    window.addEventListener('unhandledrejection', (event) => {
      const errorMsg = event.reason?.message || event.reason?.toString() || '';
      if (
        errorMsg.includes('quota') || 
        errorMsg.includes('storage') ||
        errorMsg.includes('QuotaExceededError')
      ) {
        handleStorageError();
      }
    });
    
  }, []);

  // This component doesn't render anything visible
  return null;
} 