/**
 * Enhanced Auth Client Fix Script v3
 * 
 * This script fixes issues with multiple GoTrueClient instances by:
 * 1. Aggressively clearing storage to reset auth state
 * 2. Setting flags to prevent redundant initialization
 * 3. Patching the GoTrueClient constructor
 * 4. Monitoring and cleaning up auth-related resources proactively
 * 5. Implementing last-resort protection at the global level
 * 6. Adding initialization delay to prevent race conditions
 */

(function() {
  console.log('🔒 Enhanced auth client fix script v3 loaded');
  
  // Global vars for tracking
  window.__supabaseClientCount = window.__supabaseClientCount || 0;
  window.__supabaseClientInstance = window.__supabaseClientInstance || null;
  window.__lastAuthCleanupTime = window.__lastAuthCleanupTime || 0;
  window.__authClientFixActive = true;
  window.__authInitialized = false;
  window.__authFixExecutionTimeMs = Date.now();
  
  // Add a special version flag to distinguish this version
  window.__authClientFixVersion = 3;
  
  // Check for flags indicating issues
  const hasMultipleInstances = window.localStorage.getItem('multiple-gotrue-instances') === 'true';
  const recentlyCleared = Date.now() - (parseInt(window.localStorage.getItem('auth-storage-cleared-time') || '0')) < 30000;
  
  // Function to clear auth-related storage
  function clearAuthStorage(force = false) {
    try {
      if (!force && recentlyCleared) {
        console.log('Auth storage was recently cleared, skipping duplicate clear');
        return false;
      }
      
      console.log('🧹 Clearing all auth-related data');
      
      // CRITICAL: Set special meta flag to prevent race conditions
      window.__authClientFixActive = true;
      
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
      localStorage.setItem('auth-client-fix-version', '3');
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
      window.__authInitialized = false;
      
      // Check if our global patch for GoTrueClient exists
      if (!window.__patchedGoTrueClient) {
        patchGoTrueClient();
      }
      
      // EMERGENCY: Force a full JS garbage collection if browser supports it
      if (window.gc) {
        try {
          window.gc();
          console.log('Forced garbage collection');
        } catch (e) {
          console.error('Error forcing GC:', e);
        }
      } else {
        // Alternative memory cleanup
        console.log('Performing alternative memory cleanup');
        const memoryHungryArray = [];
        for (let i = 0; i < 10000; i++) {
          memoryHungryArray.push(new ArrayBuffer(1024));
        }
        memoryHungryArray.length = 0;
      }
      
      // Trigger a manual reload if this is a repeated issue
      if (localStorage.getItem('auth-client-fix-reload-count')) {
        const reloadCount = parseInt(localStorage.getItem('auth-client-fix-reload-count')) + 1;
        
        if (reloadCount >= 3) {
          // Reset the counter
          localStorage.setItem('auth-client-fix-reload-count', '0');
          
          // Hard reload the page
          console.log('Multiple auth issues detected, forcing page reload');
          window.location.reload(true);
          
          // Prevent further execution
          return true;
        }
        
        localStorage.setItem('auth-client-fix-reload-count', reloadCount.toString());
      } else {
        localStorage.setItem('auth-client-fix-reload-count', '1');
      }
      
      return true;
    } catch (err) {
      console.error('Error clearing auth storage:', err);
      return false;
    }
  }
  
  // Enhanced version with timeout fix for race conditions
  function patchGoTrueClient() {
    try {
      // Look for GoTrueClient in global scope or in modules
      if (typeof GoTrueClient === 'function') {
        console.log('Found GoTrueClient in global scope, patching...');
        patchGoTrueClientClass(GoTrueClient);
      } else {
        // Attempt to find it in common module patterns
        console.log('Searching for GoTrueClient in modules...');
        
        // Set a flag to avoid double patching
        window.__patchedGoTrueClient = true;
        
        // Set up a property descriptor that will fire when GoTrueClient is accessed
        Object.defineProperty(window, '__gotrueClientPatcher', {
          set: function(newValue) {
            if (newValue && typeof newValue === 'function') {
              console.log('GoTrueClient class found dynamically, patching...');
              patchGoTrueClientClass(newValue);
            }
          },
          get: function() {
            return window.__gotruePatcherValue;
          }
        });
      }
      
      // Patch fetch to monitor auth-related requests
      if (!window.__originalFetch) {
        window.__originalFetch = window.fetch;
        window.fetch = function(input, init) {
          // Check if this is an auth-related request
          if (typeof input === 'string' && (
            input.includes('/auth/') || 
            input.includes('supabase') || 
            input.includes('gotrue')
          )) {
            console.log('Auth-related fetch detected:', input.substring(0, 50));
            
            // Add special headers for debugging
            if (!init) init = {};
            if (!init.headers) init.headers = {};
            init.headers['X-Auth-Client-Fix'] = 'v3';
            init.headers['X-Auth-Client-Fix-Time'] = window.__authFixExecutionTimeMs;
          }
          
          return window.__originalFetch(input, init);
        };
      }
      
      // Add a special delay to prevent race conditions during initialization
      // This is critical for fixing the multiple GoTrueClient instances issue
      if (!window.__authInitialDelayComplete) {
        window.__authInitialDelayComplete = true;
        
        // Delay initialization slightly to allow the page to fully load
        // This helps prevent race conditions with multiple modules creating clients
        setTimeout(() => {
          console.log('Auth client initialization delay complete');
          window.__authInitialized = true;
        }, 100);
      }
      
      console.log('GoTrueClient patching complete');
    } catch (err) {
      console.error('Error patching GoTrueClient:', err);
    }
  }
  
  // Function to patch the GoTrueClient class
  function patchGoTrueClientClass(GoTrueClass) {
    const originalConstructor = GoTrueClass.prototype.constructor;
    
    GoTrueClass.prototype.constructor = function(...args) {
      // Wait a tiny bit for initialization if we're in the page load phase
      if (!window.__authInitialized && window.__authFixExecutionTimeMs && (Date.now() - window.__authFixExecutionTimeMs < 2000)) {
        console.log('Delaying GoTrueClient creation to prevent race conditions');
        
        // Small sleep to allow other initialization to complete
        const start = Date.now();
        while (Date.now() - start < 50) {
          // Intentional tight loop to force a small delay
        }
      }
      
      console.log('GoTrueClient constructor called');
      
      // Check if we already have an instance
      if (window.__supabaseClientCount > 0) {
        console.warn('Multiple GoTrueClient instances detected. Using singleton pattern.');
        localStorage.setItem('multiple-gotrue-instances', 'true');
        
        // Return existing instance if we have one
        if (window.__supabaseClientInstance) {
          console.log('Returning existing GoTrueClient instance instead of creating a new one');
          return window.__supabaseClientInstance;
        }
        
        // Clear auth storage if it's been more than 30 seconds since last cleanup
        if (Date.now() - window.__lastAuthCleanupTime > 30000) {
          clearAuthStorage(true);
        }
      }
      
      // Increment counter
      window.__supabaseClientCount++;
      
      // Call original constructor
      const instance = originalConstructor.apply(this, args);
      
      // Store the instance for future reference
      if (!window.__supabaseClientInstance) {
        window.__supabaseClientInstance = instance;
      }
      
      return instance;
    };
  }
  
  // Auto-fix on load if needed
  if (hasMultipleInstances && !recentlyCleared) {
    console.log('Multiple GoTrueClient instances detected on previous page, clearing auth storage');
    clearAuthStorage();
    localStorage.removeItem('multiple-gotrue-instances');
  }
  
  // Advanced monitoring for auth-related errors
  window.addEventListener('error', function(event) {
    if (event.error && 
      ((event.error.message && 
        (event.error.message.includes('GoTrueClient') || 
         event.error.message.includes('auth') || 
         event.error.message.includes('token'))) ||
      (event.error.stack && event.error.stack.includes('auth')))
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
  
  // Set up MutationObserver to detect script loads
  try {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach(function(node) {
            if (node.tagName === 'SCRIPT' && node.src && 
                (node.src.includes('supabase') || 
                 node.src.includes('auth') ||
                 node.src.includes('gotrue'))) {
              console.log('Detected auth-related script loading:', node.src);
              
              // Wait for script to load
              setTimeout(function() {
                // Check for multiple GoTrueClient instantiations
                if (window.__supabaseClientCount > 1) {
                  console.warn('Multiple Supabase clients detected after script load, enforcing singleton');
                  localStorage.setItem('multiple-gotrue-instances', 'true');
                  // Clean up if more than 30 seconds since last cleanup
                  if (Date.now() - window.__lastAuthCleanupTime > 30000) {
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
  
  // Add a special retry mechanism for auth
  window.__retryAuthOperation = function(operation, maxRetries = 3) {
    let retries = 0;
    
    return new Promise((resolve, reject) => {
      function attempt() {
        operation()
          .then(resolve)
          .catch(error => {
            if (retries < maxRetries) {
              retries++;
              console.log(`Auth operation failed, retrying (${retries}/${maxRetries})...`);
              
              // Clear storage before retrying
              if (error.message && error.message.includes('GoTrueClient')) {
                clearAuthStorage(true);
              }
              
              // Wait a bit before retrying
              setTimeout(attempt, 200 * retries);
            } else {
              reject(error);
            }
          });
      }
      
      attempt();
    });
  };
  
  // Override console.warn to detect and fix GoTrueClient warnings
  const originalConsoleWarn = console.warn;
  console.warn = function() {
    const warningText = Array.from(arguments).join(' ');
    
    // Detect the multiple instances warning
    if (warningText && warningText.includes('Multiple GoTrueClient instances detected')) {
      console.log('🚨 Intercepted multiple GoTrueClient instances warning');
      
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
    console.log('Window loaded, auth-client-fix v3 is active and monitoring');
    window.__authInitialized = true;
    
    // Attempt to patch GoTrueClient
    patchGoTrueClient();
    
    // Set up last-resort protection
    setTimeout(function() {
      if (window.__supabaseClientCount > 1) {
        console.log('Multiple clients still detected after page load, applying emergency fix');
        clearAuthStorage(true);
      }
    }, 2000);
  });
  
  // Last-resort protection for navigation
  window.addEventListener('beforeunload', function() {
    // Note we detected multiple instances for the next page load
    if (window.__supabaseClientCount > 1) {
      localStorage.setItem('multiple-gotrue-instances', 'true');
    }
  });
  
  // CRITICAL: Initial call to patch
  patchGoTrueClient();
})();
    