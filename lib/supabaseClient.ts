import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with the correct values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cyrztlmzanhfybqsakgc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cnp0bG16YW5oZnlicXNha2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjE3OTUsImV4cCI6MjA2MTE5Nzc5NX0.weWEWeSASoOGhXC6Gg5diwCBffxdV2NjuaHjjHkq3SE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 