/**
 * Auth Client Fix Script
 * This script fixes issues with multiple GoTrueClient instances by clearing storage
 * and setting flags to prevent redundant initialization
 */

(function() {
  console.log('Auth client fix script loaded');
  
  // Check for multiple instances flag
  const hasMultipleInstances = window.localStorage.getItem('multiple-gotrue-instances') === 'true';
  
  // Function to clear auth-related storage
  function clearAuthStorage() {
    try {
      // Clear specific Supabase keys to reset auth state
      const keysToRemove = [];
      
      // Find all Supabase auth-related items in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase.auth.token') || 
          key.includes('supabase.auth.refreshToken') ||
          key.includes('sb-') ||
          key.includes('gotrue')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove the items
      keysToRemove.forEach(key => {
        console.log('Removing localStorage key:', key);
        localStorage.removeItem(key);
      });
      
      // Set the flag to indicate we've cleared storage
      localStorage.setItem('auth-storage-cleared', 'true');
      localStorage.setItem('auth-storage-cleared-time', new Date().toISOString());
      
      console.log('Auth storage cleared successfully');
      return true;
    } catch (err) {
      console.error('Error clearing auth storage:', err);
      return false;
    }
  }
  
  // Listen for auth errors on the window
  window.addEventListener('message', function(event) {
    // Check if this is our custom auth error message
    if (event.data && event.data.type === 'AUTH_ERROR') {
      console.log('Auth error detected, clearing storage');
      clearAuthStorage();
    }
  });
  
  // If we've detected multiple instances, clear auth storage
  if (hasMultipleInstances) {
    console.log('Multiple GoTrueClient instances detected previously, clearing auth storage');
    clearAuthStorage();
    localStorage.removeItem('multiple-gotrue-instances');
  }
  
  // Watch for console warnings about multiple GoTrueClient instances
  const originalConsoleWarn = console.warn;
  console.warn = function() {
    // Convert arguments to a string to check content
    const warningText = Array.from(arguments).join(' ');
    
    // Check if this is the multiple instances warning
    if (warningText && warningText.includes('Multiple GoTrueClient instances detected')) {
      console.log('Detected multiple GoTrueClient instances warning');
      
      // Set flag for next page load
      localStorage.setItem('multiple-gotrue-instances', 'true');
      
      // Clear auth storage immediately
      clearAuthStorage();
    }
    
    // Call the original console.warn with all arguments
    return originalConsoleWarn.apply(console, arguments);
  };
  
  // Add window load event handler
  window.addEventListener('load', function() {
    console.log('Window loaded, auth-client-fix is active');
  });
})();
    