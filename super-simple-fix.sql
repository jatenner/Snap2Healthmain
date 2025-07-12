-- Super Simple Database Fix
-- Copy and paste this entire block into your Supabase SQL Editor

-- First, let's see what we have
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Add the missing columns one by one (these will fail silently if columns already exist)
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS foods TEXT[];
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS raw_analysis TEXT;
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS description TEXT;

-- Check the final structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'meals' AND table_schema = 'public'
ORDER BY ordinal_position; 