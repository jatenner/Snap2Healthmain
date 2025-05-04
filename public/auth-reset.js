
/**
 * auth-reset.js
 * 
 * This script clears all authentication-related data from your browser.
 */
(function() {
  console.log('🔐 Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.removeItem('use-local-auth');
  localStorage.removeItem('local-auth-user');
  localStorage.removeItem('auth-ready');
  localStorage.removeItem('supabase.auth.token');
  
  // Clear cookies
  document.cookie.split(';').forEach(function(c) {
    document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
  });
  
  console.log('✅ Authentication data cleared');
  console.log('Please sign in again with your real Supabase account');
  
  // Redirect to login
  window.location.href = '/login';
})();
