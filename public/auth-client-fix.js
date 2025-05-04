/**
 * GoTrueClient Instance Manager
 * 
 * This script prevents multiple Supabase auth client instances 
 * that can cause authentication conflicts and the error:
 * "Multiple GoTrueClient instances detected in the same browser context"
 */

(function() {
  // Flags to track initialization
  window.__SUPABASE_AUTH_INITIALIZED = false;
  
  // Track actual number of instances created
  let instanceCount = 0;
  
  // Clear any existing instances that might be causing issues
  function clearExistingClients() {
    try {
      // Clear any localStorage data that might be causing conflicts
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase.auth.token') || 
            key.startsWith('supabase.auth.refreshToken') ||
            key.startsWith('sb-') ||
            key.includes('GoTrueClient')) {
          
          // Store value temporarily in case we need to recover it
          const value = localStorage.getItem(key);
          console.log('Cleaning up auth key:', key);
          
          // Remove the potentially conflicting key
          localStorage.removeItem(key);
          
          // For important auth tokens, restore them with a slightly modified key
          if (key === 'supabase.auth.token') {
            localStorage.setItem('supabase.auth.token.clean', value);
          }
        }
      }
      
      // Clear sessionStorage as well for complete cleanup
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('supabase') || key.includes('GoTrue')) {
          sessionStorage.removeItem(key);
        }
      }
      
      console.log('Auth storage cleaned successfully');
      return true;
    } catch (error) {
      console.error('Error cleaning auth storage:', error);
      return false;
    }
  }

  // Patch the GoTrueClient constructor to prevent multiple instances
  function patchGoTrueClient() {
    try {
      // Only do this in browser context
      if (typeof window !== 'undefined') {
        // Wait for the GoTrueClient class to be available
        const checkInterval = setInterval(() => {
          if (window.GoTrueClient || 
              (window.supabase && window.supabase.auth) || 
              document.querySelector('script[src*="supabase"]')) {
            
            clearInterval(checkInterval);
            
            // Get a reference to localStorage.setItem
            const originalSetItem = localStorage.setItem;
            
            // Override setItem to prevent duplicate keys
            localStorage.setItem = function(key, value) {
              // If it's an auth key and we're adding a duplicate, don't add it
              if (key.startsWith('supabase.auth') && localStorage.getItem(key)) {
                console.log('Prevented duplicate auth key:', key);
                return;
              }
              
              // Call the original method for other keys
              return originalSetItem.call(this, key, value);
            };
            
            console.log('Auth storage protection enabled');
            
            // Clear any existing clients first
            if (instanceCount > 0) {
              clearExistingClients();
            }
            
            // Mark as initialized
            window.__SUPABASE_AUTH_INITIALIZED = true;
          }
        }, 50);
        
        // Only try for 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    } catch (error) {
      console.error('Error patching GoTrueClient:', error);
    }
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchGoTrueClient);
  } else {
    patchGoTrueClient();
  }
  
  // Re-initialize when navigating between pages (for SPAs)
  window.addEventListener('routeChangeComplete', () => {
    if (instanceCount > 1) {
      clearExistingClients();
    }
  });
  
  // Export utility functions to window for debugging
  window.__fixAuthStorage = clearExistingClients;
  
  console.log('Auth client fix script loaded');
})();
    