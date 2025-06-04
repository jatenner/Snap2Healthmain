import { createBrowserClient } from '@supabase/ssr';

// Add environment variable logging for debugging
if (typeof window !== 'undefined') {
  console.log('[Supabase Client] Creating browser client with config:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    environment: process.env.NODE_ENV
  });
}

let supabaseClient: any = null;

// Check environment variables and create appropriate client
const shouldUseMockAuth = (): boolean => {
  // Only use mock auth in development when environment variables are explicitly set to placeholder values
  if (process.env.NODE_ENV === 'production') return false;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Use mock only if variables are missing or contain placeholder text
  return !url || !key || 
         url.includes('placeholder') || 
         key.includes('placeholder') ||
         url === 'your-project-url' ||
         key === 'your-anon-key';
};

// Create the client
export function createClient() {
  if (supabaseClient) return supabaseClient;
  
  if (shouldUseMockAuth()) {
    console.warn('[Supabase Client] Development mode with placeholder environment - using mock client');
    
    // Create a mock client for development
    supabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Mock mode' } }),
        signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Mock mode' } }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Mock mode' } }),
        update: () => ({ data: null, error: { message: 'Mock mode' } }),
        delete: () => ({ data: null, error: { message: 'Mock mode' } })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: 'Mock mode' } }),
          getPublicUrl: () => ({ data: { publicUrl: '/placeholder-meal.jpg' } })
        })
      }
    };
  } else {
    // Create real Supabase client
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }
  
  return supabaseClient;
}

// Export legacy compatibility functions
export const createSafeSupabaseClient = createClient;
export { shouldUseMockAuth };

// Default export for legacy compatibility
export const supabase = createClient();

// Database verification functions
export const verifyDatabaseTables = async () => {
  if (shouldUseMockAuth()) {
    console.log('[Supabase Client] Mock mode - skipping database verification');
    return { 
      success: true, 
      message: 'Mock mode - database verification skipped',
      tables: ['mock_meals', 'mock_profiles'] 
    };
  }

  try {
    const { data, error } = await supabaseClient
      .from('meals')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Supabase Client] Database verification failed:', error);
      return { 
        success: false, 
        error: error.message,
        tables: [] 
      };
    }

    console.log('[Supabase Client] Database verification successful');
    return { 
      success: true, 
      message: 'Database tables verified successfully',
      tables: ['meals', 'profiles'] 
    };
  } catch (err) {
    console.error('[Supabase Client] Database verification error:', err);
    return { 
      success: false, 
      error: 'Failed to verify database tables',
      tables: [] 
    };
  }
};

export const verifyStorageBuckets = async () => {
  if (shouldUseMockAuth()) {
    console.log('[Supabase Client] Mock mode - skipping storage verification');
    return { 
      success: true, 
      message: 'Mock mode - storage verification skipped',
      buckets: ['mock-uploads'] 
    };
  }

  try {
    const { data, error } = await supabaseClient.storage.listBuckets();

    if (error) {
      console.error('[Supabase Client] Storage verification failed:', error);
      return { 
        success: false, 
        error: error.message,
        buckets: [] 
      };
    }

    const bucketNames = data?.map(bucket => bucket.name) || [];
    console.log('[Supabase Client] Storage verification successful. Buckets:', bucketNames);
    
    return { 
      success: true, 
      message: 'Storage buckets verified successfully',
      buckets: bucketNames 
    };
  } catch (err) {
    console.error('[Supabase Client] Storage verification error:', err);
    return { 
      success: false, 
      error: 'Failed to verify storage buckets',
      buckets: [] 
    };
  }
};

export async function isUploadAvailable(): Promise<boolean> {
  if (shouldUseMockAuth()) {
    return false;
  }

  try {
    const { data, error } = await supabaseClient.storage.listBuckets();
    return !error && data && data.length > 0;
  } catch (err) {
    console.error('[Supabase Client] Upload availability check failed:', err);
    return false;
  }
}

export async function uploadImageToSupabase(file: File, fileName: string): Promise<string | null> {
  if (shouldUseMockAuth()) {
    console.log('[Supabase Client] Mock mode - returning placeholder image URL');
    return '/placeholder-meal.jpg';
  }

  try {
    const { data, error } = await supabaseClient.storage
      .from('meal-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[Supabase Client] Image upload failed:', error);
      return null;
    }

    const { data: urlData } = supabaseClient.storage
      .from('meal-images')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('[Supabase Client] Image upload error:', err);
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  if (shouldUseMockAuth()) {
    return 'development-mode';
  }

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user?.id || null;
  } catch (err) {
    console.error('[Supabase Client] Get current user failed:', err);
    return null;
  }
} 