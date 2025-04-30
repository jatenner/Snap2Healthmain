import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
    
    // In production mode, upload to Supabase Storage
    const supabase = createClientComponentClient<Database>();
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `user-uploads/${fileName}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    // Fallback to local blob URL in case of error
    return URL.createObjectURL(file);
  }
} 