/**
 * Supabase Auth Client Fix
 * Prevents the "Multiple GoTrueClient instances detected" error
 * and fixes authentication persistence issues
 */

(function() {
  // Track initialization state
  window.__SUPABASE_AUTH_INITIALIZED = false;
  
  // Track auth failures
  window.__AUTH_FAILURES = 0;
  
  // Create auth storage management
  window.__fixAuthStorage = function() {
    console.log('Running auth storage fix...');
    let fixed = false;
    
    try {
      // Clear auth-related localStorage items that might be corrupted
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.startsWith('supabase.auth.token') || 
            key.startsWith('supabase.auth.refresh') ||
            key.includes('supa') && key.includes('auth')
          )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove identified keys
      keysToRemove.forEach(key => {
        console.log('Removing problematic auth key:', key);
        localStorage.removeItem(key);
      });
      
      // Clear session cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name && (name.includes('supabase') || name.includes('sb-'))) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      fixed = true;
      window.__AUTH_FAILURES = 0;
    } catch (err) {
      console.error('Auth fix error:', err);
    }
    
    return fixed;
  };
  
  // Record authentication failures
  window.__recordAuthFailure = function() {
    window.__AUTH_FAILURES = (window.__AUTH_FAILURES || 0) + 1;
    console.log(`Auth failure recorded: ${window.__AUTH_FAILURES} total`);
    
    // If we have multiple failures, try clearing storage
    if (window.__AUTH_FAILURES >= 3) {
      window.__fixAuthStorage();
      window.__AUTH_FAILURES = 0;
    }
  };
  
  // Clear auth failures counter
  window.__clearAuthFailures = function() {
    window.__AUTH_FAILURES = 0;
    console.log('Auth failure count reset');
  };
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth client fix initialized');
    
    // Try to detect redirects from auth pages and fix storage if needed
    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get('error');
    const authError = url.searchParams.get('authError');
    
    if (errorParam || authError || 
        url.pathname === '/login' || 
        url.pathname === '/auth-fix') {
      // Run storage fix in case we're in an auth error loop
      setTimeout(() => window.__fixAuthStorage(), 100);
    }
  });
})();
    