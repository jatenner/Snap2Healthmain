import { cookies } from 'next/headers';

/**
 * Store data in the session
 * @param key The key to store the data under
 * @param value The data to store
 */
export async function storeInSession(key: string, value: any): Promise<void> {
  // In a real app, you would use a proper session management system
  // This is a simple implementation using cookies
  const cookieStore = cookies();
  cookieStore.set(key, JSON.stringify(value), {
    path: '/',
    maxAge: 60 * 60, // 1 hour
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

/**
 * Retrieve data from the session
 * @param key The key to retrieve the data from
 * @returns The data stored under the key, or null if not found
 */
export async function retrieveFromSession(key: string): Promise<any> {
  // In a real app, you would use a proper session management system
  // This is a simple implementation using cookies
  const cookieStore = cookies();
  const data = cookieStore.get(key);
  
  if (!data) {
    return null;
  }
  
  try {
    return JSON.parse(data.value);
  } catch (error) {
    console.error(`Error parsing session data for key ${key}:`, error);
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