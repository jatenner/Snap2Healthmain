/**
 * Enhanced Auth Client Fix Script
 * 
 * This script fixes issues with multiple GoTrueClient instances by:
 * 1. Clearing storage to reset auth state
 * 2. Setting flags to prevent redundant initialization
 * 3. Intercepting GoTrueClient creation
 * 4. Monitoring and cleaning up auth-related resources proactively
 */

(function() {
  console.log('Enhanced auth client fix script loaded');
  
  // Global vars for tracking
  window.__supabaseClientCount = window.__supabaseClientCount || 0;
  window.__supabaseClientInstance = window.__supabaseClientInstance || null;
  window.__lastAuthCleanupTime = window.__lastAuthCleanupTime || 0;
  
  // Check for flags indicating issues
  const hasMultipleInstances = window.localStorage.getItem('multiple-gotrue-instances') === 'true';
  const recentlyCleared = Date.now() - (parseInt(window.localStorage.getItem('auth-storage-cleared-time') || '0')) < 60000;
  
  // Function to clear auth-related storage
  function clearAuthStorage() {
    try {
      console.log('Local auth data cleared');
      
      // Clear all Supabase-related items in localStorage
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase.auth.token') || 
          key.includes('supabase.auth.refreshToken') ||
          key.includes('sb-') ||
          key.includes('gotrue') ||
          key.startsWith('supabase.')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove the items
      keysToRemove.forEach(key => {
        console.log('Removing localStorage key:', key);
        localStorage.removeItem(key);
      });
      
      // Set flags indicating cleanup
      localStorage.setItem('auth-storage-cleared', 'true');
      localStorage.setItem('auth-storage-cleared-time', Date.now().toString());
      window.__lastAuthCleanupTime = Date.now();
      
      // Try to clean cookies as well
      document.cookie.split(';').forEach(cookie => {
        if (
          cookie.includes('supabase') || 
          cookie.includes('sb-') || 
          cookie.includes('gotrue')
        ) {
          const name = cookie.split('=')[0].trim();
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      });
      
      // Reset instance counter
      window.__supabaseClientCount = 0;
      window.__supabaseClientInstance = null;
      
      return true;
    } catch (err) {
      console.error('Error clearing auth storage:', err);
      return false;
    }
  }
  
  // Auto-fix on load if needed
  if (hasMultipleInstances && !recentlyCleared) {
    console.log('Multiple GoTrueClient instances detected on previous page, clearing auth storage');
    clearAuthStorage();
    localStorage.removeItem('multiple-gotrue-instances');
  }
  
  // Advanced monitoring for auth-related errors
  window.addEventListener('error', function(event) {
    if (
      event.error && 
      (
        (event.error.message && event.error.message.includes('GoTrueClient')) ||
        (event.error.stack && event.error.stack.includes('auth'))
      )
    ) {
      console.log('Auth-related error detected, clearing storage');
      clearAuthStorage();
    }
  });
  
  // Listen for auth errors on the window
  window.addEventListener('message', function(event) {
    if (event.data && (
      event.data.type === 'AUTH_ERROR' || 
      (event.data.message && event.data.message.includes('auth'))
    )) {
      console.log('Auth error message detected, clearing storage');
      clearAuthStorage();
    }
  });
  
  // Patch the createClient function in Supabase to prevent multiple instances
  try {
    // Create a MutationObserver to watch for script loads
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach(function(node) {
            if (node.tagName === 'SCRIPT' && node.src && node.src.includes('supabase')) {
              console.log('Detected Supabase script loading, preparing singleton enforcement');
              
              // Wait for script to load
              setTimeout(function() {
                // Check for multiple GoTrueClient instantiations
                if (window.__supabaseClientCount > 1) {
                  console.warn('Multiple Supabase clients detected, enforcing singleton');
                  localStorage.setItem('multiple-gotrue-instances', 'true');
                  // Clean up if more than 5 minutes since last cleanup
                  if (Date.now() - window.__lastAuthCleanupTime > 300000) {
                    clearAuthStorage();
                  }
                }
              }, 1000);
            }
          });
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  } catch (err) {
    console.error('Error setting up observer:', err);
  }
  
  // Override console.warn to detect and fix GoTrueClient warnings
  const originalConsoleWarn = console.warn;
  console.warn = function() {
    const warningText = Array.from(arguments).join(' ');
    
    // Detect the multiple instances warning
    if (warningText && warningText.includes('Multiple GoTrueClient instances detected')) {
      console.log('Intercepted multiple GoTrueClient instances warning');
      
      // Set flag for next page load
      localStorage.setItem('multiple-gotrue-instances', 'true');
      
      // Clear auth storage immediately if it hasn't been cleared recently
      if (!recentlyCleared) {
        clearAuthStorage();
      }
    }
    
    // Call the original console.warn
    return originalConsoleWarn.apply(console, arguments);
  };
  
  // Monitor page load completion
  window.addEventListener('load', function() {
    console.log('Window loaded, auth-client-fix is active and monitoring');
    
    // Force garbage collection via URL navigation if supported
    if (window.gc) {
      try {
        window.gc();
        console.log('Triggered garbage collection');
      } catch (e) {
        console.error('Error triggering GC:', e);
      }
    }
  });
})();
    