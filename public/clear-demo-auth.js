/**
 * clear-demo-auth.js
 * 
 * This script clears any local mock authentication data to ensure
 * the app uses real Supabase authentication instead of the demo account.
 */

(function() {
  console.log('🔐 Clearing demo authentication...');
  
  try {
    // Clear localStorage items
    localStorage.removeItem('use-local-auth');
    localStorage.removeItem('local-auth-user');
    localStorage.removeItem('auth-ready');
    
    // Clear cookies
    document.cookie = "use-local-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "local-auth-user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    console.log('✅ Demo authentication cleared. Redirecting to login page...');
    
    // Add a small delay before redirecting
    setTimeout(function() {
      // Check if we're already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      } else {
        // If already on login page, just reload
        window.location.reload();
      }
    }, 500);
  } catch (error) {
    console.error('❌ Error clearing demo authentication:', error);
  }
})(); 