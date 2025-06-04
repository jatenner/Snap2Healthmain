import { cookies } from 'next/headers';

/**
 * Store data in the session
 */
export async function storeInSession(key: string, data: any): Promise<void> {
  try {
    const serializedData = JSON.stringify(data);
    
    cookies().set({
      name: key,
      value: serializedData,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });
    
    console.log(`Successfully stored ${key} in session`);
  } catch (error) {
    console.error(`Error storing ${key} in session:`, error);
    throw error;
  }
} 