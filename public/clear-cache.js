/**
 * Emergency cache clearing script
 * This script unregisters service workers and clears browser caches
 */
(function() {
  console.log('[Cache Reset] Script started');
  
  // Add version timestamp to document
  document.documentElement.dataset.cacheResetTime = Date.now().toString();
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('[Cache Reset] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      console.log('[Cache Reset] All caches cleared');
    }).catch(function(err) {
      console.error('[Cache Reset] Cache clear error:', err);
    });
  }
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(registration) {
        registration.unregister();
        console.log('[Cache Reset] ServiceWorker unregistered');
      });
    }).catch(function(err) {
      console.error('[Cache Reset] ServiceWorker unregister error:', err);
    });
  }
  
  // Force cache-busting for all resources
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach(function(link) {
    const url = new URL(link.href);
    url.searchParams.set('_v', Date.now().toString());
    link.href = url.toString();
  });
  
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(function(script) {
    const url = new URL(script.src);
    url.searchParams.set('_v', Date.now().toString());
    script.src = url.toString();
  });
  
  console.log('[Cache Reset] Cache busting applied to all resources');
})();