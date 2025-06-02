import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image file to Supabase storage and returns the public URL
 * @param file - The file to upload
 * @param options - Optional configuration
 * @returns The public URL of the uploaded file
 */
export async function uploadImageToSupabase(
  file: File, 
  options?: { 
    bucket?: string; 
    path?: string;
    makePublic?: boolean;
  }
): Promise<string> {
  // For testing purposes, use a mock implementation
  // Using string comparison to avoid TypeScript errors with NODE_ENV
  const nodeEnv = process.env.NODE_ENV || '';
  if (nodeEnv !== 'production') {
    return mockUploadImageToSupabase(file, options);
  }
  
  // Set default options
  const bucket = options?.bucket || 'uploads';
  const basePath = options?.path || 'meals';
  const makePublic = options?.makePublic !== false; // Default to true
  
  try {
    // Generate a unique filename using UUID
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${basePath}/${fileName}`;
    
    console.log(`[uploadImageToSupabase] Uploading file to path: ${bucket}/${filePath}`);
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Use upsert to avoid conflicts with existing files
      });
    
    if (error) {
      console.error('[uploadImageToSupabase] Error uploading to primary bucket:', error);
      
      // Try with a different bucket name as fallback
      try {
        console.log('[uploadImageToSupabase] Trying alternate bucket "images"');
        const fallbackBucket = 'images';
        const { data: altData, error: altError } = await supabase.storage
          .from(fallbackBucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (altError) {
          console.error('[uploadImageToSupabase] Alternate bucket upload failed:', altError);
          throw new Error(`Failed to upload image: ${altError.message}`);
        }
        
        // Get public URL from alternate bucket
        const { data: { publicUrl } } = supabase.storage
          .from(fallbackBucket)
          .getPublicUrl(filePath);
        
        // Ensure the URL is absolute
        let finalUrl = publicUrl;
        if (!finalUrl.startsWith('http')) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          finalUrl = `${supabaseUrl}/storage/v1/object/public/${fallbackBucket}/${filePath}`;
        }
        
        console.log('[uploadImageToSupabase] Image uploaded to alternate bucket. URL:', finalUrl);
        
        // Save URL to localStorage for recovery
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`upload_url_${fileName}`, finalUrl);
          }
        } catch (e) {
          console.warn('[uploadImageToSupabase] Could not save URL to localStorage:', e);
        }
        
        return finalUrl;
      } catch (altErr) {
        throw new Error(`Failed to upload image to any bucket: ${error.message}`);
      }
    }
    
    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    // Make sure the URL is absolute
    let finalUrl = publicUrl;
    if (!finalUrl.startsWith('http')) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      finalUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
    }
    
    // Verify URL format - add storage/v1/object/public if needed
    if (!finalUrl.includes('/storage/v1/object/public/')) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (finalUrl.includes(supabaseUrl)) {
        // Fix URL structure if it's malformed
        const urlParts = finalUrl.split(supabaseUrl)[1];
        if (!urlParts.startsWith('/storage/v1/object/public/')) {
          finalUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
        }
      }
    }
    
    console.log('[uploadImageToSupabase] Image uploaded successfully. URL:', finalUrl);
    
    // Save URL to localStorage for recovery
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`upload_url_${fileName}`, finalUrl);
      }
    } catch (e) {
      console.warn('[uploadImageToSupabase] Could not save URL to localStorage:', e);
    }
    
    return finalUrl;
    
  } catch (error) {
    console.error('[uploadImageToSupabase] Error in upload function:', error);
    
    // Fallback for development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[uploadImageToSupabase] Development mode: Using object URL as fallback');
      
      // Store the blob URL in localStorage so it persists during the session
      try {
        const blobUrl = URL.createObjectURL(file);
        const tempId = uuidv4();
        localStorage.setItem(`temp_image_${tempId}`, blobUrl);
        console.log(`[uploadImageToSupabase] Saved blob URL to localStorage with key: temp_image_${tempId}`);
        
        // Return a URL that can be recognized by other parts of the system
        return `blob:${tempId}`;
      } catch (err) {
        console.error('[uploadImageToSupabase] Failed to create blob URL:', err);
      }
      return URL.createObjectURL(file);
    }
    throw error;
  }
}

/**
 * Mock implementation for testing purposes
 * Returns a placeholder URL instead of uploading to Supabase
 */
async function mockUploadImageToSupabase(
  file: File, 
  options?: { 
    bucket?: string; 
    path?: string;
    makePublic?: boolean;
  }
): Promise<string> {
  console.log('[mockUploadImageToSupabase] Using mock implementation');
  
  // Generate a UUID for the mock file
  const fileId = uuidv4();
  
  // Get file name and type for logging
  const fileName = file.name;
  const fileType = file.type;
  const fileSize = file.size;
  
  console.log(`[mockUploadImageToSupabase] Mock upload for "${fileName}" (${fileSize} bytes, ${fileType})`);
  
  // Simulate a delay for more realistic behavior
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Create a mock URL that looks similar to a Supabase URL
  const mockUrl = `https://test-supabase-url.com/storage/v1/object/public/test-bucket/${fileId}`;
  
  console.log(`[mockUploadImageToSupabase] Mock upload successful. URL: ${mockUrl}`);
  
  return mockUrl;
} 