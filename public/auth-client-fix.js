/**
 * Enhanced Auth Client Fix Script v4
 * 
 * This script fixes issues with multiple GoTrueClient instances by:
 * 1. Implementing a global factory pattern for GoTrueClient
 * 2. Monkey patching both direct and dynamic imports
 * 3. Aggressively monitoring for duplicate instances
 * 4. Proactively preventing race conditions during initialization
 * 5. Adding initialization delay to harmonize component loading
 */

(function() {
  console.log('🔒 Enhanced auth client fix script v4 loaded');
  
  // Global vars for tracking and control
  window.__authClientFixVersion = 4;
  window.__authFixStartTime = Date.now();
  window.__originalGoTrueClient = null;
  window.__goTrueClientInstance = null;
  window.__goTrueClientCount = 0;
  window.__supabaseClientCount = 0;
  window.__authClientFixActive = true;
  window.__authInitialized = false;
  window.__lastAuthCleanupTime = 0;
  window.__authFixIsMonkeyPatching = false;
  
  // Set a flag in localStorage to track script execution
  try {
    window.localStorage.setItem('auth-client-fix-loaded', 'true');
    window.localStorage.setItem('auth-client-fix-version', '4');
    window.localStorage.setItem('auth-client-fix-time', Date.now().toString());
  } catch (e) {
    console.error('Error setting localStorage flags:', e);
  }

  // Clear all auth-related storage on initial load
  clearAuthStorage(true);
  
  // Implement aggressive monkey patching for GoTrueClient
  monkeyPatchGoTrueClient();

  /**
   * Clear all auth-related data from storage
   * @param {boolean} force - Force clear even if recently cleared
   */
  function clearAuthStorage(force = false) {
    try {
      // Check if we recently cleared storage (within last 30 seconds)
      const lastClearTime = parseInt(window.localStorage.getItem('auth-storage-cleared-time') || '0');
      const recentlyCleared = Date.now() - lastClearTime < 30000;
      
      if (!force && recentlyCleared) {
        console.log('Auth storage was recently cleared, skipping');
        return false;
      }
      
      console.log('🧹 Clearing all auth-related storage (forced:', force, ')');
      
      // Track clear time
      window.localStorage.setItem('auth-storage-cleared-time', Date.now().toString());
      window.localStorage.setItem('auth-storage-cleared', 'true');
      window.__lastAuthCleanupTime = Date.now();
      
      // Clear all Supabase-related localStorage items
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
      
      // Remove the items in a second pass to avoid messing up the iterator
      keysToRemove.forEach(key => {
        console.log('Removing localStorage key:', key);
        localStorage.removeItem(key);
      });
      
      // Remove all auth-related cookies
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
      
      // Clean session storage too
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (
            key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('gotrue')
          )) {
            sessionStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error('Error clearing sessionStorage:', e);
      }
      
      // Reset counters
      window.__goTrueClientCount = 0;
      window.__supabaseClientCount = 0;
      window.__goTrueClientInstance = null;
      
      return true;
    } catch (err) {
      console.error('Error clearing auth storage:', err);
      return false;
    }
  }
  
  /**
   * Monkey patch the GoTrueClient to implement singleton pattern
   */
  function monkeyPatchGoTrueClient() {
    // Prevent recursion
    if (window.__authFixIsMonkeyPatching) return;
    window.__authFixIsMonkeyPatching = true;
    
    try {
      console.log('Setting up GoTrueClient interception');
      
      // First approach: Intercept global GoTrueClient
      if (typeof GoTrueClient === 'function') {
        console.log('Found GoTrueClient, patching directly');
        patchGoTrueClientClass(GoTrueClient);
      }
      
      // Second approach: Hook into module loading system
      // We need to intercept both direct imports and dynamic imports
      
      // Method 1: Patch window.require if it exists (some bundlers expose this)
      if (typeof window.require === 'function') {
        const originalRequire = window.require;
        window.require = function(mod) {
          const result = originalRequire.apply(this, arguments);
          
          // Check if this module contains GoTrueClient
          if (result && result.GoTrueClient) {
            console.log('Intercepted GoTrueClient via require:', mod);
            patchGoTrueClientClass(result.GoTrueClient);
          }
          
          return result;
        };
      }
      
      // Method 2: Intercept dynamic imports
      const originalImport = window.import;
      if (typeof originalImport === 'function') {
        window.import = function(specifier) {
          return originalImport.apply(this, arguments).then(module => {
            if (module && module.GoTrueClient) {
              console.log('Intercepted GoTrueClient via import:', specifier);
              patchGoTrueClientClass(module.GoTrueClient);
            }
            return module;
          });
        };
      }
      
      // Method 3: Define a property getter that will fire when modules access it
      // This is our most reliable approach
      monitorObjectProperty(window, 'GoTrueClient');
      
      // Monitor common global object names that might contain the client
      if (window.supabase) monitorSupabaseObject(window.supabase);
      if (window.Supabase) monitorSupabaseObject(window.Supabase);
      
      // Set up a global interceptor for when Supabase is loaded
      Object.defineProperty(window, 'supabase', {
        get: function() { return window.__supabaseObj; },
        set: function(val) {
          window.__supabaseObj = val;
          if (val) monitorSupabaseObject(val);
        },
        configurable: true
      });
      
      // Also monitor the document for scripts being loaded
      // This helps us catch dynamically loaded scripts
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
              if (node.tagName === 'SCRIPT') {
                if (node.src && (
                  node.src.includes('supabase') || 
                  node.src.includes('gotrue')
                )) {
                  console.log('Detected new auth-related script:', node.src);
                  // Script is loading, we need to patch again once it loads
                  node.addEventListener('load', function() {
                    setTimeout(function() {
                      monkeyPatchGoTrueClient();
                    }, 50);
                  });
                }
              }
            });
          }
        });
      });
      
      // Start observing
      observer.observe(document, {
        childList: true,
        subtree: true
      });
      
      // Force another patching attempt after a delay
      // This helps catch late-loading modules
      setTimeout(function() {
        window.__authFixIsMonkeyPatching = false;
        monkeyPatchGoTrueClient();
      }, 500);
      
    } catch (err) {
      console.error('Error setting up GoTrueClient patching:', err);
    } finally {
      window.__authFixIsMonkeyPatching = false;
    }
  }
  
  /**
   * Monitor a Supabase object for GoTrueClient
   * @param {Object} obj - The object to monitor
   */
  function monitorSupabaseObject(obj) {
    if (!obj) return;
    
    // Look for GoTrueClient directly
    if (obj.GoTrueClient) {
      console.log('Found GoTrueClient in Supabase object');
      patchGoTrueClientClass(obj.GoTrueClient);
    }
    
    // Monitor the property in case it's added later
    monitorObjectProperty(obj, 'GoTrueClient');
    
    // Also check auth namespace which is common
    if (obj.auth && obj.auth.GoTrueClient) {
      console.log('Found GoTrueClient in Supabase.auth');
      patchGoTrueClientClass(obj.auth.GoTrueClient);
    }
    
    // Monitor the auth property
    monitorObjectProperty(obj, 'auth');
  }
  
  /**
   * Monitor an object property for changes
   * @param {Object} obj - Object to monitor
   * @param {string} prop - Property name to monitor
   */
  function monitorObjectProperty(obj, prop) {
    if (!obj) return;
    
    // Store the original value
    let value = obj[prop];
    
    // If it's already a GoTrueClient, patch it
    if (prop === 'GoTrueClient' && typeof value === 'function') {
      patchGoTrueClientClass(value);
    }
    
    // Set up the property descriptor
    Object.defineProperty(obj, prop, {
      get: function() { return value; },
      set: function(newValue) {
        value = newValue;
        
        // If this is a GoTrueClient, patch it
        if (prop === 'GoTrueClient' && typeof newValue === 'function') {
          console.log('Detected GoTrueClient being set');
          patchGoTrueClientClass(newValue);
        }
        
        // If this is an auth object, monitor it
        if (prop === 'auth' && newValue && typeof newValue === 'object') {
          console.log('Detected auth object being set');
          if (newValue.GoTrueClient) patchGoTrueClientClass(newValue.GoTrueClient);
          monitorObjectProperty(newValue, 'GoTrueClient');
        }
      },
      configurable: true
    });
  }
  
  /**
   * Patch the GoTrueClient class to use a singleton pattern
   * @param {Function} GoTrueClass - The GoTrueClient class to patch
   */
  function patchGoTrueClientClass(GoTrueClass) {
    if (!GoTrueClass || typeof GoTrueClass !== 'function') return;
    
    // Don't patch if already patched
    if (GoTrueClass.__patched) return;
    
    // Store original constructor
    const originalConstructor = GoTrueClass.prototype.constructor;
    window.__originalGoTrueClient = originalConstructor;
    
    // Mark as patched
    GoTrueClass.__patched = true;
    
    console.log('Patching GoTrueClient constructor');
    
    // Replace constructor with our singleton version
    GoTrueClass.prototype.constructor = function(...args) {
      // Check if we already have an instance
      if (window.__goTrueClientCount > 0) {
        console.warn('Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.');
        
        // Store flag in localStorage
        try {
          localStorage.setItem('multiple-gotrue-instances', 'true');
          localStorage.setItem('multiple-gotrue-instances-time', Date.now().toString());
        } catch (e) {}
        
        // Return existing instance to prevent duplication
        if (window.__goTrueClientInstance) {
          return window.__goTrueClientInstance;
        }
      }
      
      // Creating new instance
      window.__goTrueClientCount++;
      
      // Log detailed diagnostic info
      console.log(`Creating GoTrueClient (instance ${window.__goTrueClientCount})`);
      
      // Delay creation slightly to prevent race conditions
      if (!window.__authInitialized) {
        const start = Date.now();
        while (Date.now() - start < 20) {
          // Tiny sleep
        }
        window.__authInitialized = true;
      }
      
      // Call original constructor
      const instance = originalConstructor.apply(this, args);
      
      // Store the instance globally
      window.__goTrueClientInstance = instance;
      
      return instance;
    };
  }
  
  // Add a special cleanup interval to monitor for memory leaks
  setInterval(function() {
    // If we have multiple instances detected, perform cleanup
    if (window.__goTrueClientCount > 1 || window.__supabaseClientCount > 1) {
      console.warn(`Auth leak detected: ${window.__goTrueClientCount} GoTrueClient instances, ${window.__supabaseClientCount} Supabase instances`);
      
      // Clean only if it's been more than 30 seconds since last cleanup
      if (Date.now() - window.__lastAuthCleanupTime > 30000) {
        clearAuthStorage(false);
      }
    }
  }, 20000);
  
  // Initialize after a slight delay to allow the page to stabilize
  setTimeout(function() {
    window.__authInitialized = true;
    console.log('Auth client fix initialized');
  }, 100);
})();
    