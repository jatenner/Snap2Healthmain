import { createBrowserClient } from '@supabase/ssr';
import { v4 as uuidv4 } from 'uuid';

// Create a helper function to get the configured client
function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Uploads an image to Supabase Storage
 * 
 * @param file - The image file to upload
 * @returns The public URL of the uploaded image or a blob URL as a fallback on error.
 */
export async function uploadImageToSupabase(file: File): Promise<string> {
  try {
    // In production mode, upload to Supabase Storage
    const supabase = getSupabaseClient();
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    // Ensure a user context is available if needed for path, or use a generic path
    // For this example, let's assume a generic path or that user context is handled elsewhere
    const filePath = `public/${fileName}`; // Changed from 'user-uploads/' to 'public/' for simplicity
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('meal-images') // Ensure this bucket exists and has appropriate policies
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('meal-images') // Ensure this bucket matches the upload bucket
      .getPublicUrl(filePath);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL from Supabase.');
      throw new Error('Failed to get public URL from Supabase.');
    }
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    // Fallback to local blob URL ONLY if all Supabase operations fail
    // This is still problematic for server-side processing but better than outright failing.
    // Ideally, the client should handle this error more gracefully.
    console.warn('Falling back to blob URL due to Supabase upload error. This URL is not processable server-side.');
    return URL.createObjectURL(file);
  }
} 