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

    // Generate a unique filename with timestamp - use current date in milliseconds
    const timestamp = new Date().getTime();
    console.log(`Using timestamp for filename: ${timestamp} (${new Date(timestamp).toISOString()})`);
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename
    const fileName = `${timestamp}-${cleanFileName}`;
    const filePath = `users/${userId}/${fileName}`;

    console.log(`Preparing to upload image to Supabase: ${filePath}`);
    console.log(`File type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
    
    // Ensure bucket exists before upload
    try {
      // Check if bucket exists first
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking buckets:', bucketsError);
      } else {
        const bucketExists = buckets.some(bucket => bucket.name === 'meal-images');
        
        if (!bucketExists) {
          console.log('Creating meal-images bucket...');
          const { error: createError } = await supabase.storage.createBucket('meal-images', {
            public: true
          });
          
          if (createError) {
            console.error('Error creating bucket:', createError);
          } else {
            console.log('Bucket created successfully');
          }
        } else {
          console.log('Bucket meal-images already exists');
        }
      }
    } catch (e) {
      console.warn('Error checking/creating bucket:', e);
      // Continue anyway as the bucket might already exist
    }
    
    // Skip bucket creation/updates - assume bucket exists and is configured properly
    console.log('Uploading to existing meal-images bucket');
    
    // Try upload with retry
    let uploadAttempt = 0;
    const maxAttempts = 3;
    let uploadError = null;
    let data = null;

    while (uploadAttempt < maxAttempts) {
      try {
        uploadAttempt++;
        console.log(`Upload attempt ${uploadAttempt}/${maxAttempts}`);
        
        const result = await supabase.storage
          .from('meal-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Overwrite if exists
          });
          
        data = result.data;
        uploadError = result.error;
        
        if (!uploadError) {
          console.log('Upload successful on attempt', uploadAttempt);
          break;
        }
        
        console.warn(`Upload attempt ${uploadAttempt} failed:`, uploadError.message);
        
        // Wait a bit before retrying
        if (uploadAttempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempt)); // Increasing wait time
        }
      } catch (e) {
        uploadError = e;
        console.warn(`Upload attempt ${uploadAttempt} failed with exception:`, e);
      }
    }

    if (uploadError) {
      console.error('All upload attempts failed:', uploadError);
      throw new Error(`Failed to upload image after ${maxAttempts} attempts: ${uploadError.message || JSON.stringify(uploadError)}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('meal-images')
      .getPublicUrl(filePath);

    // Verify URL is valid and accessible
    if (!urlData?.publicUrl) {
      console.error('Failed to generate public URL. URL data:', urlData);
      throw new Error('Failed to generate public URL for uploaded image');
    }

    console.log(`Generated public URL: ${urlData.publicUrl}`);
    
    // Add debugging info about the URL
    const urlParts = urlData.publicUrl.split('/');
    console.log('URL structure:', {
      domain: urlParts[2],
      path: urlParts.slice(3).join('/'),
      containsBucketName: urlData.publicUrl.includes('meal-images'),
      containsUserId: urlData.publicUrl.includes(userId)
    });

    // Make one final check that the URL is accessible
    try {
      console.log(`Verifying URL is accessible: ${urlData.publicUrl}`);
      const testFetch = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!testFetch.ok) {
        console.warn(`Warning: Image URL returned status ${testFetch.status} - it may not be accessible yet`);
      } else {
        console.log(`URL is accessible: ${testFetch.status} ${testFetch.statusText}`);
      }
    } catch (e) {
      console.warn('Warning: Could not verify URL is accessible:', e);
      // Don't throw here, it might just be a CORS issue
    }

    console.log(`Successfully uploaded image. Public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error in uploadMealImage:', error);
    throw error;
  }
}; 