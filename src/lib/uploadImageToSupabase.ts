import { supabase } from './supabaseClient';

/**
 * Uploads a meal image to Supabase storage and returns the public URL
 * @param file - The image file to upload
 * @param userId - The ID of the user uploading the image
 * @returns The public URL of the uploaded image
 */
export const uploadMealImage = async (file: File, userId: string): Promise<string> => {
  try {
    // Ensure we have proper input
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    if (!userId) {
      throw new Error('No user ID provided for upload');
    }
    
    // Validate user session is active to ensure auth.uid matches
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Confirm the userId matches the current authenticated user
    if (sessionData.session.user.id !== userId) {
      throw new Error('User ID mismatch. Cannot upload files for another user.');
    }
    
    // Check file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new Error(`File is too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB`);
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types are: ${allowedTypes.join(', ')}`);
    }

    // Generate a unique filename with timestamp and user ID to ensure uniqueness
    const timestamp = new Date().getTime();
    const extension = file.name.substring(file.name.lastIndexOf('.')) || '';
    const baseFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Format: timestamp-filename-userId.extension
    const fileName = `${timestamp}-${baseFileName}-${userId}${extension}`;
    
    // CRITICAL: Match exact path format from the RLS policy
    // Format: users/[userId]/[filename]
    const filePath = `users/${userId}/${fileName}`;

    console.log(`Preparing to upload image to Supabase: ${filePath}`);
    console.log(`File type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
    
    // Try upload with retry logic
    let uploadAttempt = 0;
    const maxAttempts = 3;
    let uploadError = null;
    let data = null;

    while (uploadAttempt < maxAttempts) {
      try {
        uploadAttempt++;
        console.log(`Upload attempt ${uploadAttempt}/${maxAttempts}`);
        
        // Upload with metadata that matches RLS policy expectations
        const result = await supabase.storage
          .from('meal-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Overwrite if exists
            contentType: file.type,
            // CRITICAL: Use 'user_id' key to match RLS policy requiring auth.uid() = metadata->>'user_id'
            metadata: {
              user_id: userId,
              timestamp: timestamp.toString(),
              filename: file.name
            }
          });
          
        data = result.data;
        uploadError = result.error;
        
        if (!uploadError) {
          console.log('Upload successful on attempt', uploadAttempt);
          break;
        }
        
        // Log detailed error info for debugging RLS issues
        if (uploadError) {
          console.error('Upload error details:', {
            message: uploadError.message,
            details: uploadError.details,
            hint: uploadError.hint,
            code: uploadError.code
          });
          
          // Handle RLS policy violations - usually no need to retry these
          if (uploadError.message?.includes('row-level security') || 
              uploadError.message?.includes('permission denied') ||
              uploadError.message?.includes('Unauthorized')) {
            console.error('Permission denied error. Check if:');
            console.error("1. Your RLS policy is properly configured to check metadata->>'user_id' = auth.uid()");
            console.error('2. The bucket "meal-images" exists');
            console.error('3. You are using the correct user auth session');
            console.error(`4. The path structure matches: users/${userId}/*`);
            break; // Don't retry permission errors
          }
        }
        
        console.warn(`Upload attempt ${uploadAttempt} failed:`, uploadError.message);
        
        // Wait before retrying with exponential backoff
        if (uploadAttempt < maxAttempts) {
          const backoffTime = Math.pow(2, uploadAttempt) * 500; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      } catch (e) {
        uploadError = e;
        console.warn(`Upload attempt ${uploadAttempt} failed with exception:`, e);
      }
    }

    if (uploadError) {
      console.error('All upload attempts failed:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message || JSON.stringify(uploadError)}`);
    }

    // Use signed URLs instead of public URLs to ensure policies are enforced
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('meal-images')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 day expiry
      
    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to generate signed URL:', signedUrlError);
      
      // Fall back to public URL if signed URL fails
      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(filePath);
        
      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate URL for uploaded image');
      }
      
      return urlData.publicUrl;
    }
    
    console.log(`Successfully uploaded image. Signed URL generated with 7 day expiry.`);
    return signedUrlData.signedUrl;
  } catch (error: any) {
    console.error('Error in uploadMealImage:', error);
    throw error;
  }
}; 