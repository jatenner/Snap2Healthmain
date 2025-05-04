import { cookies } from 'next/headers';

/**
 * Store data in the session
 * @param key The key to store the data under
 * @param data The data to store
 */
export async function storeInSession(key: string, data: any): Promise<void> {
  try {
    // Convert data to string
    const serializedData = JSON.stringify(data);
    
    // Store in cookie with appropriate settings
    cookies().set({
      name: key,
      value: serializedData,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });
    
    console.log(`Successfully stored ${key} in session, data size: ${serializedData.length} bytes`);
  } catch (error) {
    console.error(`Error storing ${key} in session:`, error);
    throw error;
  }
}

/**
 * Retrieve data from the session
 * @param key The key to retrieve the data from
 * @returns The data stored under the key, or null if not found
 */
export async function getFromSession(key: string): Promise<any> {
  try {
    // Get cookie by name
    const value = cookies().get(key)?.value;
    
    // Return null if cookie doesn't exist
    if (!value) {
      console.log(`No ${key} found in session`);
      return null;
    }
    
    // Parse the cookie value
    const parsedValue = JSON.parse(value);
    console.log(`Successfully retrieved ${key} from session`);
    return parsedValue;
  } catch (error) {
    console.error(`Error getting ${key} from session:`, error);
    return null;
  }
}

/**
 * Remove data from the session
 */
export async function removeFromSession(key: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(key);
}

// Alternative method: store just the ID and then look up data from server store
export async function storeSessionKey(data: any): Promise<string> {
  // Generate a unique ID for this session
  const sessionId = Math.random().toString(36).substring(2, 15);
  
  // We would typically store this in a database or cache like Redis
  // For now, just log it
  console.log(`Would store data with session ID ${sessionId} in database`);
  
  // Store just the ID in the cookie
  cookies().set({
    name: 'session_id',
    value: sessionId,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
  });
  
  return sessionId;
} 