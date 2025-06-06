// Local wrapper to avoid complex import paths on Vercel
import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: any = null;

const shouldUseMockAuth = (): boolean => {
  if (process.env.NODE_ENV === 'production') return false;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !url || !key || 
         url.includes('placeholder') || 
         key.includes('placeholder') ||
         url === 'your-project-url' ||
         key === 'your-anon-key';
};

export function createClient() {
  if (supabaseClient) return supabaseClient;
  
  if (shouldUseMockAuth()) {
    supabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Mock mode' } }),
        signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Mock mode' } }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: (table: string) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Mock mode' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Mock mode' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Mock mode' } }),
        limit: () => ({ data: [], error: null })
      }),
      storage: {
        listBuckets: () => Promise.resolve({ data: [], error: { message: 'Mock mode' } }),
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: 'Mock mode' } }),
          getPublicUrl: () => ({ data: { publicUrl: '/placeholder-meal.jpg' } })
        })
      }
    };
  } else {
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