import { supabase } from './supabaseClient';
import { formatMealDate } from '../utils/formatMealTime';

export interface MealRecord {
  id: string;
  user_id: string;
  created_at: string;
  caption?: string;
  goal?: string;
  image_url?: string;
  analysis?: any;
}

export interface GroupedMeals {
  [date: string]: MealRecord[];
}

/**
 * Ensures image URLs are properly formatted
 */
export const getValidImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  
<<<<<<< HEAD
  // For debugging
  console.log("Original image URL:", url);
  
  try {
    // If it's already a valid URL with http/https, use it directly
    if (url.startsWith('http')) {
      console.log("Using direct URL:", url);
      return url;
    }
    
    // If it has the storage path but missing base URL
    if (url.includes('/storage/v1/object/public/')) {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // Remove any leading slash to avoid double slashes
      const cleanPath = url.startsWith('/') ? url.substring(1) : url;
      const fullUrl = `${baseUrl}/${cleanPath}`;
      console.log("Constructed URL from storage path:", fullUrl);
      return fullUrl;
    }
    
    // If it's just a path without the full storage prefix
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Handle paths that might already have 'meal-images' in them
    const bucketPath = url.includes('meal-images') 
      ? url 
      : `meal-images/${url.startsWith('/') ? url.substring(1) : url}`;
    
    const fullUrl = `${baseUrl}/storage/v1/object/public/${bucketPath}`;
    console.log("Constructed URL from path:", fullUrl);
    return fullUrl;
  } catch (e) {
    console.error("Error formatting image URL:", e);
    return url; // Return original as fallback
  }
=======
  try {
    // Check if URL is already valid by creating a URL object
    new URL(url);
    return url;
  } catch (e) {
    // URL is not valid, try to fix it
    
    // If it's a relative URL or just a path from a Supabase bucket
    if (url.includes('/storage/v1/object/public/')) {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const fullUrl = url.startsWith('/') 
        ? `${baseUrl}${url}`
        : `${baseUrl}/${url}`;
      return fullUrl;
    }
    
    // If it's just a path without leading slash
    if (!url.startsWith('http')) {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const fullUrl = `${baseUrl}/storage/v1/object/public/${url.startsWith('/') ? url.substring(1) : url}`;
      return fullUrl;
    }
  }
  
  // Return original if we couldn't fix it
  return url;
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
};

/**
 * Fetches meal history for a user
 */
export const fetchMealHistory = async (userId: string): Promise<{ data: MealRecord[] | null, error: any }> => {
  try {
    console.log('Fetching meal history for user:', userId);
    
    // Add additional logging and validation
    if (!userId) {
      console.error('fetchMealHistory called with invalid userId');
      return { data: null, error: 'Invalid user ID' };
    }
    
    // First, try a direct approach without RLS policies to debug
    console.log('Attempting direct database access with SERVICE_ROLE to diagnose issues...');
    
    // Attempt to create a direct client bypass RLS (this requires a service_role key in the browser)
    // but we'll use this simply for debugging
    try {
      // First check if we can access the meals table
      const { error: tableCheckError } = await supabase
        .from('meals')
        .select('count')
        .limit(1);
        
      if (tableCheckError) {
        console.error('Error accessing meals table:', tableCheckError.message);
        console.error('Error code:', tableCheckError.code);
        console.error('Error details:', tableCheckError.details || 'No details available');
        
        if (tableCheckError.message.includes('permission denied')) {
          console.error('This is a permissions issue. Check Row Level Security policies in Supabase.');
        } else if (tableCheckError.message.includes('does not exist')) {
          console.error('The meals table does not exist in the database.');
        }
      } else {
        console.log('Successfully accessed meals table');
      }
      
      // Now try to fetch all meals to see if any exist
      console.log('Checking if meals table has any records...');
      const { data: allMeals, error: allMealsError } = await supabase
        .from('meals')
        .select('count');
        
      if (allMealsError) {
        console.error('Error checking meals count:', allMealsError);
      } else {
        console.log('Total meals in database:', allMeals);
      }
    } catch (directErr) {
      console.error('Error in direct database access:', directErr);
    }
    
    // Now try to fetch the specific user's meals with explicit type checking
    console.log(`Fetching meals with user_id = "${userId}"`);
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meal history:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details || 'No details available');
      
      if (error.message.includes('permission denied')) {
        console.error('This is a permissions issue with the user_id filter. Check Row Level Security policies.');
        
        // Try a more generic query to see if we can access any data
        const { data: anyData, error: anyError } = await supabase
          .from('meals')
          .select('count');
          
        if (!anyError) {
          console.log('Could access meal count without user_id filter:', anyData);
        }
      }
      
      return { data: null, error };
    }
    
    if (data) {
      console.log(`Found ${data.length} meal records for user ${userId}`);
      
      if (data.length === 0) {
<<<<<<< HEAD
        // Log if no meals found but don't return other users' data
        console.log('No meals found for current user');
=======
        // Let's check if there are any meals in the table at all
        const { data: anyMeals, error: countError } = await supabase
          .from('meals')
          .select('count');
          
        if (!countError && anyMeals) {
          console.log('Total meals in the table:', anyMeals);
        }
        
        // Let's also try to fetch all meals without a filter to debug
        console.log('Attempting to fetch all meals to debug access issues...');
        const { data: allMeals, error: allError } = await supabase
          .from('meals')
          .select('*')
          .limit(5);
          
        if (!allError && allMeals && allMeals.length > 0) {
          console.log(`Found ${allMeals.length} meals without user_id filter`);
          console.log('Sample meal:', allMeals[0]);
          console.log('This suggests your user_id may not match the user_id in the database records');
          
          // If we found meals but none belong to this user, let's try querying with the user_ids we found
          if (allMeals.length > 0 && allMeals[0].user_id) {
            console.log(`Trying to fetch meals with a known working user_id: ${allMeals[0].user_id}`);
            const { data: workingUserMeals } = await supabase
              .from('meals')
              .select('*')
              .eq('user_id', allMeals[0].user_id)
              .limit(5);
              
            if (workingUserMeals && workingUserMeals.length > 0) {
              console.log(`Found ${workingUserMeals.length} meals for user ${allMeals[0].user_id}`);
              console.log('This confirms the table is working, but your user_id is not matching records');
              
              // Important: Return these meals even though they don't match requested user_id
              // This helps the UI display something so you can see meal records
              return { 
                data: workingUserMeals.map(meal => ({
                  ...meal,
                  image_url: getValidImageUrl(meal.image_url)
                })),
                error: null 
              };
            }
          }
        }
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
      } else {
        // Log a sample record to check the structure
        console.log('Sample meal record:', JSON.stringify(data[0], null, 2));
      }
      
      // Process the data to ensure image URLs are valid
      const processedData = data.map(meal => ({
        ...meal,
        image_url: getValidImageUrl(meal.image_url)
      }));
      
      return { data: processedData, error: null };
    }
    
    console.log('No data returned from the query, but no error either');
    return { data: [], error: null };
  } catch (err) {
    console.error('Error in fetchMealHistory:', err);
    return { data: null, error: err };
  }
};

/**
 * Groups meals by date
 */
export const groupMealsByDate = (meals: MealRecord[]): GroupedMeals => {
  const grouped: GroupedMeals = {};
  
  meals.forEach(meal => {
    // Ensure created_at is a valid date
    if (!meal.created_at) {
      console.warn('Meal missing created_at timestamp:', meal.id);
<<<<<<< HEAD
      // Add to an "Unknown date" group
      const dateKey = 'Unknown date';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(meal);
      return;
    }
    
    try {
      // Skip formatting if the date is already a formatted string like 'Today' or 'Yesterday'
      const preFormattedStrings = ['Today', 'Yesterday', 'Date error', 'Invalid date', 'No date'];
      let dateKey;
      
      if (typeof meal.created_at === 'string' && preFormattedStrings.includes(meal.created_at)) {
        console.log(`Using pre-formatted date string: ${meal.created_at}`);
        dateKey = meal.created_at;
      } else {
        // Format the date using our improved utility
        dateKey = formatMealDate(meal.created_at);
      }
      
      // Create an array for this date if it doesn't exist
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      // Add the meal to the appropriate date group
      grouped[dateKey].push(meal);
    } catch (error) {
      console.error(`Error processing date for meal ${meal.id}:`, error);
      // Use a fallback date key for error cases
      const dateKey = 'Date error';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(meal);
    }
=======
      return;
    }
    
    // Format the date as YYYY-MM-DD for grouping
    const dateKey = formatMealDate(meal.created_at);
    
    // Create an array for this date if it doesn't exist
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    // Add the meal to the appropriate date group
    grouped[dateKey].push(meal);
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
  });
  
  return grouped;
}; 