-- Fix user_id column type from UUID to TEXT
-- This is needed because Supabase auth uses TEXT user IDs, not UUIDs

-- First, let's see the current type
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'meals' AND column_name = 'user_id';

-- Change user_id from UUID to TEXT
ALTER TABLE public.meals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Verify the change
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'meals' AND column_name = 'user_id';

-- Test message
SELECT 'user_id column type fixed successfully!' as status; 