import { NextRequest } from 'next/server';
import { createClient } from './supabase/server';

/**
 * Extract the authenticated user ID from the Supabase session.
 * Returns { userId, error } -- userId is null if not authenticated.
 */
export async function getUserIdFromSession(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { userId: null, error: error?.message || 'Not authenticated' };
    }

    return { userId: user.id, error: null };
  } catch (err) {
    return { userId: null, error: 'Failed to verify authentication' };
  }
}
