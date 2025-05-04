/**
 * Cache invalidation script for Snap2Health
 * 
 * This script helps ensure that service worker caches are properly managed
 * and handles edge cases that can cause "Failed to execute 'addAll' on 'Cache'" errors
 */

(function() {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    // Create a more robust cache clearing function
    async function clearCaches() {
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          let clearPromises = cacheNames.map(async cacheName => {
            try {
              console.log(`Attempting to delete cache: ${cacheName}`);
              const success = await caches.delete(cacheName);
              return { cacheName, success };
            } catch (err) {
              console.error(`Error deleting cache ${cacheName}:`, err);
              return { cacheName, success: false, error: err };
            }
          });
          
          // Wait for all cache deletion attempts
          const results = await Promise.all(clearPromises);
          
          // Check if any deletions failed
          const failedCaches = results.filter(result => !result.success);
          if (failedCaches.length > 0) {
            console.warn(`Failed to delete ${failedCaches.length} caches. Trying alternative approach...`);
            
            // Alternative approach - try to open and clear each cache
            for (const { cacheName } of failedCaches) {
              try {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                for (const request of requests) {
                  await cache.delete(request);
                }
                console.log(`Cleared content from cache: ${cacheName}`);
              } catch (err) {
                console.error(`Alternative clearing for ${cacheName} failed:`, err);
              }
            }
          } else {
            console.log('All caches cleared successfully');
          }
        }
      } catch (error) {
        console.error('Cache clearing error:', error);
        // Fallback - notify the user and suggest a manual clear
        document.body.setAttribute('data-cache-error', 'true');
      }
    }

    // Listen for the load event to ensure the page is fully loaded
    window.addEventListener('load', async function() {
      try {
        console.log('Cache buster initializing');
        
        // First, try to unregister any existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          try {
            await registration.unregister();
            console.log('Service worker unregistered successfully');
          } catch (err) {
            console.error('Error unregistering service worker:', err);
          }
        }
        
        // Clear caches using our robust function
        await clearCaches();
        
        // Add a timestamp parameter to bypass browser cache for fresh resources
        const timestamp = new Date().getTime();
        document.body.dataset.cacheTimestamp = timestamp;
        
        // Mark as completed successfully
        document.body.dataset.cacheInvalidated = "true";
        
        console.log('Cache invalidation completed successfully');
        
        // Reload the page after a short delay if there was a previous cache error
        if (localStorage.getItem('hadCacheError') === 'true') {
          localStorage.removeItem('hadCacheError');
          console.log('Reloading page after previous cache error');
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (error) {
        console.error('Cache invalidation error:', error);
        localStorage.setItem('hadCacheError', 'true');
        
        // Add error information to the document for potential UI handling
        document.body.dataset.cacheError = "true";
      }
    });
  } else {
    console.log('Service workers not supported in this browser');
  }
})(); 