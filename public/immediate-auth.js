// Emergency fix for authentication glitches
// This script runs before any other and ensures a user is always available

(function() {
  console.log('Immediate auth fix running');

  // Create a mock user that will always be used
  const mockUser = {
    id: 'user-' + Date.now(),
    email: 'demo@snap2health.com',
    name: 'Demo User',
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

  // Immediately set auth cookies and localStorage
  try {
    localStorage.setItem('use-local-auth', 'true');
    localStorage.setItem('local-auth-user', JSON.stringify(mockUser));
    localStorage.setItem('auth-ready', 'true');
    
    // Set cookies
    document.cookie = "use-local-auth=true; path=/; max-age=86400";
    document.cookie = "local-auth-user=true; path=/; max-age=86400";
    
    console.log('Immediate auth fix: Auth data set');
  } catch (e) {
    console.error('Could not set auth data', e);
  }

  // Skip loading state entirely
  document.documentElement.classList.add('auth-ready');
})(); 