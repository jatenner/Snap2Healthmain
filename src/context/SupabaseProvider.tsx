'use client';

<<<<<<< HEAD
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseContextType {
  supabase: SupabaseClient;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      // Return a mock client to avoid crashes
      return createClient('https://example.com', 'mock-key');
    }
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  });
=======
import { createContext, useState, useContext, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type SupabaseContext = {
  supabase: SupabaseClient | null;
};

const SupabaseContext = createContext<SupabaseContext>({ supabase: null });

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        setError('Missing Supabase environment variables');
        setLoading(false);
        return;
      }

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      setSupabase(supabaseClient);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      setError('Failed to initialize Supabase client');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading Supabase client...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
<<<<<<< HEAD
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 
=======
}; 
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
