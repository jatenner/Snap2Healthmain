/**
 * API Helper Functions
 * 
 * Common utilities for API routes that handle safe progress updates,
 * authentication checks, and data validation.
 */

/**
 * Safely update upload progress without throwing errors in server context
 * Can be called from both client and server side code safely
 * @param message - The progress message to display
 * @param progress - Optional progress percentage (0-100)
 * @param error - Optional error message if there's a problem
 */
export function safeUpdateProgress(message: string | null, progress: number = 0, error: string | null = null): void {
  // First check if we're in a browser context
  if (typeof window !== 'undefined') {
    // Try the global setUploadProgress function first (from fix-upload-progress.js)
    if (typeof window.setUploadProgress === 'function') {
      try {
        window.setUploadProgress(message);
        return;
      } catch (e) {
        console.error('Error using global setUploadProgress:', e);
      }
    }
    
    // Try to find any progress elements on the page as fallback
    try {
      const progressElements = document.querySelectorAll('[data-upload-progress]');
      if (progressElements.length > 0) {
        progressElements.forEach(el => {
          (el as HTMLElement).innerText = message || '';
          (el as HTMLElement).style.display = message ? 'block' : 'none';
        });
      }
    } catch (e) {
      // Silently fail for DOM manipulations
    }
  } else {
    // Server-side: log progress but don't try to update UI
    if (message) {
      console.log(`[API] Progress: ${message}${progress ? ` (${progress}%)` : ''}${error ? ` - Error: ${error}` : ''}`);
    }
  }
}

/**
 * Helper to check if we're in browser context
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Helper to extract auth token from request headers
 */
export function extractAuthToken(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (!authHeader) return null;
  
  // Extract the token from 'Bearer <token>'
  const match = authHeader.match(/Bearer\s+(.+)/i);
  return match ? match[1] : null;
}

/**
 * Helper to safely parse JSON with fallback
 */
export function safeParseJson(jsonString: string, fallback: any = {}): any {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
}

/**
 * Helper to ensure a value is an array
 */
export function ensureArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

/**
 * Type declarations for global window object
 */
declare global {
  interface Window {
    setUploadProgress?: (message: string | null) => void;
    currentUserProfile?: {
      id?: string;
      full_name?: string;
      goal?: string;
      activity_level?: string;
      age?: number;
      gender?: string;
      height?: number;
      weight?: number;
      [key: string]: any;
    };
  }
}

/**
 * Creates a safe error handler for API routes
 */
export function createSafeApiHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      // Run the handler and return its result
      return await handler(...args);
    } catch (error) {
      // Log the error
      console.error('[API] Unhandled error in API handler:', error);
      
      // Return a graceful error response
      return new Response(
        JSON.stringify({
          error: 'An unexpected error occurred',
          message: error.message || 'Unknown error',
          success: false
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };
} 