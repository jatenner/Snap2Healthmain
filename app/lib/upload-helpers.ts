/**
 * Upload Helpers
 * 
 * Shared utilities for file uploads and authentication handling 
 * that work on both client and server
 */

// Default safe progress update function that works in any context
export const safeUpdateProgress = (message: string | null, setProgressFn?: any) => {
  // Log progress to console in all environments
  console.log(`[Upload] Progress: ${message}`);
  
  // If we have a setter function and we're in the browser, use it
  if (typeof setProgressFn === 'function' && typeof window !== 'undefined') {
    try {
      setProgressFn(message);
    } catch (e) {
      console.error('[Upload] Error updating progress state:', e);
    }
  }
};

// Get authentication info from various sources (works in both client/server)
export const getAuthInfo = () => {
  // Server-side won't have localStorage
  if (typeof window === 'undefined') {
    return { userId: null, isAuthenticated: false };
  }
  
  // Try to get user ID from multiple sources
  const userId = 
    // Check data attributes first (set by middleware)
    document.body?.getAttribute('data-auth-user-id') ||
    // Check global variables
    (window.currentUserProfile && window.currentUserProfile.id) ||
    // Check localStorage
    localStorage.getItem('auth_user_id') ||
    // Check cookies
    getCookieValue('supabase-auth-user-id');
    
  return {
    userId,
    isAuthenticated: !!userId
  };
};

// Helper to get cookie values (client-side only)
export const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

// Add authentication headers to requests
export const addAuthHeaders = (headers: Headers = new Headers()): Headers => {
  const auth = getAuthInfo();
  
  if (auth.userId) {
    headers.set('x-auth-user-id', auth.userId);
    headers.set('x-authenticated', 'true');
  }
  
  return headers;
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}; 