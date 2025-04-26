'use client';

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

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}; 