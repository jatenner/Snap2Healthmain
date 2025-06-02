import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;

/**
 * Verifies that essential database tables exist
 * @returns Object with status of each required table
 */
export const verifyDatabaseTables = async () => {
  const results = {
    meals: { exists: false, message: '' }
  };

  try {
    // Check meals table
    const { error: mealsError } = await supabase
      .from('meals')
      .select('id')
      .limit(1);

    if (mealsError) {
      if (mealsError.message.includes('does not exist')) {
        results.meals.exists = false;
        results.meals.message = 'Table does not exist. Please run the migration files in your Supabase project.';
      } else {
        results.meals.exists = false;
        results.meals.message = `Error checking table: ${mealsError.message}`;
      }
    } else {
      results.meals.exists = true;
      results.meals.message = 'Table exists';
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
      }
    } else {
      console.log('meal-images bucket exists');
    }
  } catch (err) {
    console.error('Error verifying storage buckets:', err);
  }
}; 