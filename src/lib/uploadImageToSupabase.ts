import { getSupabaseClient } from './supabase-singleton';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/types/supabase';

/**
 * Uploads an image to Supabase Storage or creates a local blob URL in development mode
 * 
 * @param file - The image file to upload
 * @returns The public URL of the uploaded image
 */
export async function uploadImageToSupabase(file: File): Promise<string> {
  try {
    const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === 'development';
    const mockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
    
    // For development mode or when using mock auth, just return a blob URL
    if (isDevelopment || mockAuth) {
      console.log('Using mock storage in development mode');
      // Create a local blob URL
      return URL.createObjectURL(file);
    }
    
    // In production mode, upload to Supabase Storage using singleton client
    const supabase = getSupabaseClient();
    
    // Check if user is authenticated first to avoid 400 errors
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('User not authenticated, using local blob URL');
      return URL.createObjectURL(file);
    }
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `user-uploads/${fileName}`;
    
    // Add auth headers
    const headers = {
      'Authorization': `Bearer ${session.access_token}`
    };
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        duplex: 'half'  // Add this to fix certain upload issues
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      
      // Specific error handling
      if (error.message.includes('JWT')) {
        console.error('Authentication error during upload');
        // Fallback to local for auth errors
        return URL.createObjectURL(file);
      } else if (error.message.includes('permission')) {
        console.error('Permission denied when uploading to Supabase');
        // Fallback to local for permission errors
        return URL.createObjectURL(file);
      }
      
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    // Provide detailed error to the console
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Fallback to local blob URL in case of error
    return URL.createObjectURL(file);
  }
} 