
// Fix for Multiple GoTrueClient instances detected
(function() {
  try {
    // Check if we've already initialized
    const initialized = localStorage.getItem('gotrue-initialized');
    
    if (initialized) {
      // Clear any conflicting auth data
      const now = Date.now();
      const initTime = parseInt(initialized, 10);
      const timeSinceInit = now - initTime;
      
      if (timeSinceInit < 60000) { // If less than a minute ago
        console.log('[Auth] Multiple instances detected, clearing storage');
        
        // Clear all Supabase and GoTrue related items
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('gotrue') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }
    }
    
    // Set current timestamp
    localStorage.setItem('gotrue-initialized', Date.now().toString());
  } catch (e) {
    console.error('[Auth] Error fixing client conflict:', e);
  }
})();
    