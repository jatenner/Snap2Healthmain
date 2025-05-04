// This script runs immediately to override environment variables and handle authentication
(function() {
  if (typeof window !== 'undefined') {
    console.log('Auth override script running - enabling local auth');
    
    // Create or update the ENV object
    window.ENV = window.ENV || {};
    window.ENV.NEXT_PUBLIC_MOCK_AUTH = 'true';
    window.ENV.NEXT_PUBLIC_AUTH_BYPASS = 'true';
    
    // Clear any existing auth bypass flags in localStorage and set new ones
    try {
      // Set explicit 'true' values to enable bypass auth
      localStorage.setItem('MOCK_AUTH', 'true');
      localStorage.setItem('AUTH_BYPASS', 'true');
      localStorage.setItem('use-local-auth', 'true');
      
      console.log('Auth bypass enabled via script injection');
    } catch (e) {
      console.error('Could not write to localStorage', e);
    }
  }
})();

// Create a sample user for demo purposes
const mockUser = {
  id: 'mock-user-id-' + Date.now(),
  email: 'demo@snap2health.com',
  name: 'Demo User',
  avatar: '/avatar-placeholder.png',
  avatar_url: '/avatar-placeholder.png',
  profile_completed: true,
  user_metadata: {
    username: 'Demo User',
    defaultGoal: 'General Wellness',
    height: '70',
    weight: '180',
    age: '35',
    gender: 'Male',
    activityLevel: 'Moderate'
  }
};

// CRITICAL FIX: Force local auth to be enabled immediately, before any React rendering
localStorage.setItem('use-local-auth', 'true');
document.cookie = "use-local-auth=true; path=/; max-age=86400";
localStorage.setItem('local-auth-user', JSON.stringify(mockUser));
document.cookie = `local-auth-user=true; path=/; max-age=86400`;

// CRITICAL FIX: Apply these settings immediately to elements on the page to force UI rendering
setTimeout(() => {
  // Force dark theme
  document.documentElement.classList.add('dark-theme');
  document.body.classList.add('dark-theme');
  
  // Unhide any content that might be waiting for auth
  document.querySelectorAll('.loading-overlay, [data-loading="true"]').forEach(el => {
    el.style.display = 'none';
  });
  
  document.querySelectorAll('[data-waiting-for-auth="true"]').forEach(el => {
    el.style.display = 'block';
  });
  
  // If we're still seeing a loading message after 2 seconds, force a reload
  setTimeout(() => {
    if (document.body.innerText.includes('Loading') || 
        document.body.innerText.includes('Preparing') || 
        document.querySelector('.animate-pulse')) {
      console.log('Still showing loading screen after delay, forcing reload');
      window.location.reload();
    }
  }, 2000);
}, 100);

console.log('Local auth and mock user have been set up');

// Force reload if we're on the login page to redirect to home
if (window.location.pathname.includes('/login')) {
  window.location.href = '/';
} 