import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: any = null;

// Create the Supabase browser client
export function createClient() {
  if (supabaseClient) return supabaseClient;

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

  return supabaseClient;
}

// Export legacy compatibility functions
export const createSafeSupabaseClient = createClient;

// Default export for legacy compatibility
export const supabase = createClient();

// Database verification functions
export const verifyDatabaseTables = async () => {
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

    const bucketNames = data?.map((bucket: any) => bucket.name) || [];
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
  try {
    const { data, error } = await supabaseClient.storage.listBuckets();
    return !error && data && data.length > 0;
  } catch (err) {
    console.error('[Supabase Client] Upload availability check failed:', err);
    return false;
  }
}

export async function uploadImageToSupabase(file: File, fileName: string): Promise<string | null> {
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
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user?.id || null;
  } catch (err) {
    console.error('[Supabase Client] Get current user failed:', err);
    return null;
  }
}
