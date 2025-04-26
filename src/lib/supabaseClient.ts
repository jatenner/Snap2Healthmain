import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check environment variables and provide helpful error messages
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create the Supabase client with persistence configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

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
        results.meals.message = 'Table does not exist. You need to create it in the Supabase dashboard.';
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

// Check tables on client init if in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  setTimeout(async () => {
    const tableStatus = await verifyDatabaseTables();
    if (process.env.NODE_ENV === 'development') {
      console.log('Database table status:', tableStatus);
    }
  }, 3000);
} 