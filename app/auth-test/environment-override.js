// This script runs immediately to override environment variables
(function() {
  if (typeof window !== 'undefined') {
    // Create or update the ENV object
    window.ENV = window.ENV || {};
    window.ENV.NEXT_PUBLIC_MOCK_AUTH = 'false';
    window.ENV.NEXT_PUBLIC_AUTH_BYPASS = 'false';
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem('MOCK_AUTH', 'false');
      localStorage.setItem('AUTH_BYPASS', 'false');
      console.log('Auth bypass disabled via script injection');
    } catch (e) {
      console.error('Could not write to localStorage', e);
    }
  }
})(); 