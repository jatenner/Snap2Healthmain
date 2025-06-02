/**
 * API Helper Utilities
 * Safe functions for handling API operations across server/client contexts
 */

/**
 * Safely updates upload progress without causing errors on the server
 * This function works in both client and server contexts
 */
export function safeUpdateProgress(message: string): void {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.safeUpdateProgress) {
      // Use the client-side function if available
      window.safeUpdateProgress(message);
    } else {
      // Server-side logging fallback
      console.log(`[API Progress] ${message}`);
    }
  } catch (e) {
    // Silently handle any errors - this function should never throw
    console.error('[API] Error updating progress:', e);
  }
}

/**
 * Type definition for the global window object with our custom functions
 */
declare global {
  interface Window {
    safeUpdateProgress: (message: string) => void;
    uploadProgressHandlers?: {
      register: (id: string, callback: (message: string) => void) => string;
      update: (id: string | null, message: string) => void;
      unregister: (id: string) => void;
      handlers: Record<string, (message: string) => void>;
    }
  }
}

/**
 * Safely handle JSONB fields that might be stored as strings
 */
export function parseJsonField<T>(value: any): T | null {
  if (!value) return null;
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.error('[API] Error parsing JSON field:', e);
      return null;
    }
  }
  
  return value as T;
} 