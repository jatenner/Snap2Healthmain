// Local authentication workaround
// This file provides a simplified authentication mechanism that bypasses Supabase auth
// when there are persistent issues with authentication

import { setCookie, getCookie, deleteCookie } from 'cookies-next';

// Simplified mock user with minimal data to reduce memory usage
const mockUser = {
  id: 'local-user-id',
  email: 'demo@snap2health.com',
  name: 'Local User',
  created_at: new Date().toISOString(),
  user_metadata: {
    username: 'Local User',
    defaultGoal: 'General Wellness'
  }
};

/**
 * Set up local authentication
 * @param email User's email
 * @returns User object
 */
export const setLocalAuth = (email: string) => {
  try {
    // Create a simplified user with the provided email - using minimal data
    const localUser = {
      ...mockUser,
      email: email,
      name: email.split('@')[0],
      user_metadata: {
        ...mockUser.user_metadata,
        username: email.split('@')[0]
      }
    };
    
    // Try multiple storage mechanisms for redundancy
    try {
      // Store in cookies to ensure it's available everywhere
      setCookie('use-local-auth', 'true', {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax'
      });
      
      const compactUser = JSON.stringify(localUser);
      
      // Store in localStorage with try/catch to handle quota issues
      try {
        localStorage.setItem('use-local-auth', 'true');
        localStorage.setItem('local-auth-user', compactUser);
      } catch (storageErr) {
        console.warn('Failed to save to localStorage, falling back to cookies only:', storageErr);
      }
      
      setCookie('local-auth-user', compactUser, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax'
      });
      
      // Set a fallback in case both fail
      setCookie('auth-fallback', 'active', {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax'
      });
      
    } catch (cookieErr) {
      console.error('Failed to set cookies, trying localStorage only:', cookieErr);
      
      // Last resort - try localStorage only
      try {
        localStorage.setItem('use-local-auth', 'true');
        localStorage.setItem('local-auth-user', JSON.stringify(localUser));
      } catch (finalErr) {
        console.error('All storage mechanisms failed:', finalErr);
        return null;
      }
    }
    
    console.log('Local auth enabled for', email);
    return localUser;
  } catch (error) {
    console.error('Failed to set local auth:', error);
    return null;
  }
};

/**
 * Get the local user if local auth is enabled
 * @returns Local user or null
 */
export const getLocalUser = () => {
  try {
    // First check if local auth is enabled - try multiple mechanisms
    const useLocalAuth = 
      getCookie('use-local-auth') === 'true' || 
      getCookie('auth-fallback') === 'active' ||
      localStorage.getItem('use-local-auth') === 'true';
    
    if (!useLocalAuth) {
      return null;
    }
    
    // Try to get the user from multiple storage locations
    let localUserString = null;
    
    // Try cookies first
    try {
      localUserString = getCookie('local-auth-user') as string;
      if (localUserString) {
        return JSON.parse(localUserString);
      }
    } catch (cookieErr) {
      console.warn('Failed to get user from cookies:', cookieErr);
    }
    
    // Fall back to localStorage
    try {
      localUserString = localStorage.getItem('local-auth-user');
      if (localUserString) {
        return JSON.parse(localUserString);
      }
    } catch (storageErr) {
      console.warn('Failed to get user from localStorage:', storageErr);
    }
    
    // If all storage methods failed but auth is enabled, create a default user
    if (useLocalAuth) {
      console.warn('Creating fallback user as storage retrieval failed');
      return {
        ...mockUser,
        email: 'recovered@user.com',
        name: 'Recovered User'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get local user:', error);
    
    // Last resort fallback - return a minimal user to prevent complete authentication failure
    return {
      id: 'fallback-user',
      email: 'fallback@snap2health.com',
      name: 'Emergency Fallback',
      user_metadata: {
        defaultGoal: 'General Wellness'
      }
    };
  }
}

/**
 * Clear local authentication
 */
export const clearLocalAuth = () => {
  try {
    // Clear localStorage with error handling
    try {
      localStorage.removeItem('use-local-auth');
      localStorage.removeItem('local-auth-user');
    } catch (storageErr) {
      console.warn('Failed to clear localStorage:', storageErr);
    }
    
    // Clear cookies with error handling
    try {
      deleteCookie('use-local-auth');
      deleteCookie('local-auth-user');
      deleteCookie('auth-fallback');
    } catch (cookieErr) {
      console.warn('Failed to clear cookies:', cookieErr);
    }
    
    console.log('Local auth cleared');
  } catch (error) {
    console.error('Failed to clear local auth:', error);
  }
};

/**
 * Check if we should use local auth
 * @returns Boolean indicating if local auth should be used
 */
export const shouldUseLocalAuth = () => {
  try {
    // Try multiple methods for better reliability
    const cookieFlag = getCookie('use-local-auth');
    const fallbackFlag = getCookie('auth-fallback');
    const storageFlag = localStorage.getItem('use-local-auth');
    
    return cookieFlag === 'true' || fallbackFlag === 'active' || storageFlag === 'true';
  } catch (error) {
    console.error('Error checking local auth status:', error);
    return false;
  }
};

/**
 * Update local user's metadata
 * @param userData User data to update
 * @returns Boolean indicating success
 */
export const updateLocalUser = (userData: any): boolean => {
  try {
    // Get the current user
    const currentUser = getLocalUser();
    if (!currentUser) {
      return false;
    }

    // Only store essential fields to reduce memory usage
    const essentialData = {
      username: userData.username || currentUser.user_metadata?.username,
      defaultGoal: userData.defaultGoal || currentUser.user_metadata?.defaultGoal
    };

    // Update the user with minimal data
    const updatedUser = {
      ...currentUser,
      name: essentialData.username || currentUser.name,
      user_metadata: essentialData
    };

    // Try to save to both storage mechanisms with error handling
    let success = false;
    
    try {
      setCookie('local-auth-user', JSON.stringify(updatedUser), { 
        maxAge: 60 * 60 * 24, // 1 day (reduced from 7)
        path: '/',
        sameSite: 'strict'
      });
      success = true;
    } catch (cookieErr) {
      console.warn('Failed to update user in cookies:', cookieErr);
    }
    
    try {
      localStorage.setItem('local-auth-user', JSON.stringify(updatedUser));
      success = true;
    } catch (storageErr) {
      console.warn('Failed to update user in localStorage:', storageErr);
    }

    return success;
  } catch (error) {
    console.error('Error updating local user:', error);
    return false;
  }
}; 