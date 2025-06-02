import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verifies that essential database tables exist
 * @returns Object with status of each required table
 */
export const verifyDatabaseTables = async () => {
  const results = {
    meal_history: { exists: false, message: '' }
  };

  try {
    // Check meal_history table
    const { error: mealsError } = await supabase
      .from('meal_history')
      .select('id')
      .limit(1);

    if (mealsError) {
      if (mealsError.message.includes('does not exist')) {
        results.meal_history.exists = false;
        results.meal_history.message = 'Table does not exist. Please run the migration files in your Supabase project.';
      } else {
        results.meal_history.exists = false;
        results.meal_history.message = `Error checking table: ${mealsError.message}`;
      }
    } else {
      results.meal_history.exists = true;
      results.meal_history.message = 'Table exists';
    }
  } catch (err) {
    console.error('Error verifying database tables:', err);
  }

  return results;
};

/**
 * Ensures the required storage buckets exist with proper permissions
 */
export const verifyStorageBuckets = async () => {
  try {
    // Check if meal-images bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    const mealImagesBucket = buckets?.find(bucket => bucket.name === 'meal-images');
    
    if (!mealImagesBucket) {
      console.log('Creating meal-images bucket...');
      // Create bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket('meal-images', {
        public: true, // Make bucket public
        fileSizeLimit: 10485760, // 10MB max file size
      });
      
      if (createError) {
        console.error('Error creating meal-images bucket:', createError);
      } else {
        console.log('meal-images bucket created successfully');
        
        // Add public access policy
        const { error: policyError } = await supabase.storage
          .from('meal-images')
          .createSignedUrl('dummy.jpg', 60);
          
        if (policyError && !policyError.message.includes('not found')) {
          console.error('Error setting bucket policy:', policyError);
        }
      }
    } else {
      console.log('meal-images bucket exists');
    }
  } catch (err) {
    console.error('Error verifying storage buckets:', err);
  }
};

// Skip verification in auth bypass mode or SSR
const shouldRunVerification = typeof window !== 'undefined' && 
  process.env.NODE_ENV === 'development' && 
  process.env.NEXT_PUBLIC_AUTH_BYPASS !== 'true';

if (shouldRunVerification) {
  setTimeout(async () => {
    console.log('✅ Running database verification...');
    
    const tableStatus = await verifyDatabaseTables();
    console.log('Database table status:', tableStatus);
    
    // Also verify storage buckets
    await verifyStorageBuckets();
  }, 3000);
} 