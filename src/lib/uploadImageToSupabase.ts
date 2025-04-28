import { supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    
    // Check if we're in auth bypass mode
    const isAuthBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
    
    // Only validate user session if not in auth bypass mode
    if (!isAuthBypass) {
      // Validate user session is active to ensure auth.uid matches
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Confirm the userId matches the current authenticated user
      if (sessionData.session.user.id !== userId) {
        throw new Error('User ID mismatch. Cannot upload files for another user.');
      }
    } else {
      console.log('[uploadMealImage] Auth bypass mode - skipping user ID validation');
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    // Create different path structure for bypass mode to avoid RLS issues
    let filePath;
    if (isAuthBypass) {
      // For auth bypass mode, use a test folder instead of user folders
      filePath = `test/${timestamp}-${randomId}.${fileExt}`;
    } else {
      // Regular user path with proper RLS checks
      filePath = `users/${userId}/${timestamp}-${randomId}.${fileExt}`;
    }

    console.log(`Preparing to upload image to Supabase: ${filePath}`);
    console.log(`File type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
    
    // Enhanced retry logic with better error handling
    let uploadAttempt = 0;
    const maxAttempts = 3;
    let uploadError = null;
    let data = null;
    const retryableErrors = [
      'timeout', 
      'network error', 
      'connection', 
      'socket', 
      'ETIMEDOUT', 
      'ECONNREFUSED', 
      'ECONNRESET',
      'fetch failed',
      'Failed to fetch'
    ];
    
    // Track both error type and details for better diagnostics
    const errors = [];

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
            // Add appropriate metadata based on mode
            metadata: isAuthBypass 
              ? {
                  test_mode: 'true',
                  timestamp: timestamp.toString(),
                  filename: file.name
                }
              : {
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
        
        // Keep track of all errors for detailed reporting
        const errorDetails = {
          attempt: uploadAttempt,
          message: uploadError.message,
          details: uploadError.details,
          hint: uploadError.hint,
          code: uploadError.code,
          timestamp: new Date().toISOString()
        };
        errors.push(errorDetails);
        
        // Log detailed error info for debugging RLS issues
        console.error(`Upload attempt ${uploadAttempt} failed:`, errorDetails);
        
        // Determine if we should retry based on error type
        const isRetryableError = retryableErrors.some(errType => 
          uploadError.message?.toLowerCase().includes(errType.toLowerCase())
        );
        
        // Don't retry permission errors or non-retryable errors
        if (!isRetryableError || 
            uploadError.message?.includes('row-level security') || 
            uploadError.message?.includes('permission denied') ||
            uploadError.message?.includes('Unauthorized')) {
            
          if (uploadError.message?.includes('row-level security') || 
              uploadError.message?.includes('permission denied') ||
              uploadError.message?.includes('Unauthorized')) {
            console.error('Permission denied error. Check if:');
            console.error("1. Your RLS policy is properly configured to check metadata->>'user_id' = auth.uid()");
            console.error('2. The bucket "meal-images" exists');
            console.error('3. You are using the correct user auth session');
            console.error(`4. The path structure matches: users/${userId}/*`);
          } else {
            console.error(`Not retrying due to non-retryable error: ${uploadError.message}`);
          }
          
          break; // Don't retry these types of errors
        }
        
        // Wait longer between retries to handle network issues
        if (uploadAttempt < maxAttempts) {
          const backoffTime = 2000 * uploadAttempt; // 2s, 4s, 6s - fixed increasing delay
          console.log(`Waiting ${backoffTime}ms before retry ${uploadAttempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      } catch (e: any) {
        // Handle unexpected exceptions during upload
        const errorDetails = {
          attempt: uploadAttempt,
          message: e.message || 'Unknown error',
          stack: e.stack,
          timestamp: new Date().toISOString()
        };
        errors.push(errorDetails);
        uploadError = e;
        console.warn(`Upload attempt ${uploadAttempt} failed with exception:`, errorDetails);
        
        // Wait before retrying after exception
        if (uploadAttempt < maxAttempts) {
          const backoffTime = 2000 * uploadAttempt;
          console.log(`Waiting ${backoffTime}ms before retry ${uploadAttempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    // Handle all upload attempts failing
    if (uploadError) {
      console.error('All upload attempts failed:', errors);
      
      // Create user-friendly error message based on error type
      let userMessage = 'Failed to upload image.';
      
      if (uploadError.message?.includes('row-level security') || 
          uploadError.message?.includes('permission denied') ||
          uploadError.message?.includes('Unauthorized')) {
        userMessage = 'Permission denied. You may not have access to upload to this location.';
      } else if (retryableErrors.some(errType => 
        uploadError.message?.toLowerCase().includes(errType.toLowerCase())
      )) {
        userMessage = 'Network issue detected. Please check your internet connection and try again.';
      } else if (uploadError.message?.includes('already exists')) {
        userMessage = 'A file with this name already exists. Please try again with a different file.';
      }
      
      throw new Error(`${userMessage} (Error: ${uploadError.message || JSON.stringify(uploadError)})`);
    }

    // Use signed URLs instead of public URLs to ensure policies are enforced
    // Also add retry logic for getting the signed URL
    let urlAttempt = 0;
    const maxUrlAttempts = 2;
    let signedUrlData = null;
    let signedUrlError = null;
    
    while (urlAttempt < maxUrlAttempts) {
      try {
        urlAttempt++;
        console.log(`Getting signed URL, attempt ${urlAttempt}/${maxUrlAttempts}`);
        
        const result = await supabase.storage
          .from('meal-images')
          .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 day expiry
          
        signedUrlData = result.data;
        signedUrlError = result.error;
        
        if (!signedUrlError && signedUrlData?.signedUrl) {
          console.log(`Successfully got signed URL: ${signedUrlData.signedUrl}`);
          break;
        }
        
        if (urlAttempt < maxUrlAttempts) {
          console.log(`Retrying signed URL generation in 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e) {
        signedUrlError = e;
        console.warn(`Failed to get signed URL on attempt ${urlAttempt}:`, e);
        
        if (urlAttempt < maxUrlAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
      
    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to generate signed URL, falling back to public URL:', signedUrlError);
      
      // Fall back to public URL if signed URL fails
      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(filePath);
        
      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate any URL for the uploaded image');
      }
      
      console.log(`Using public URL instead: ${urlData.publicUrl}`);

      // Validate the URL before returning it
      try {
        new URL(urlData.publicUrl);
        console.log('Public URL is valid');
      } catch (e) {
        console.error('Generated an invalid public URL:', e);
      }
      
      return urlData.publicUrl;
    }
    
    // Validate the URL before returning it
    try {
      new URL(signedUrlData.signedUrl);
      console.log('Signed URL is valid');
    } catch (e) {
      console.error('Generated an invalid signed URL:', e);
    }
    
    console.log(`Successfully uploaded image. Signed URL generated with 7 day expiry.`);
    return signedUrlData.signedUrl;
  } catch (error: any) {
    console.error('Error in uploadMealImage:', error);
    // Make sure we throw a clean Error object with a user-friendly message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to upload image: ${error?.message || JSON.stringify(error)}`);
    }
  }
}; 