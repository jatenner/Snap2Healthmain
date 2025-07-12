-- Simple Database Schema Fix for Snap2Health
-- Run this in your Supabase SQL Editor

-- First, let's check what we're working with
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'meals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add foods column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meals' 
        AND column_name = 'foods' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN foods TEXT[];
        RAISE NOTICE 'Added foods column';
    END IF;

    -- Add raw_analysis column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meals' 
        AND column_name = 'raw_analysis' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN raw_analysis TEXT;
        RAISE NOTICE 'Added raw_analysis column';
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meals' 
        AND column_name = 'description' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;
END $$;

-- Fix the user_id column type from UUID to TEXT
ALTER TABLE public.meals ALTER COLUMN user_id TYPE TEXT;

-- Show final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'meals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert to verify everything works
INSERT INTO public.meals (
    user_id, 
    meal_name, 
    foods, 
    raw_analysis, 
    description
) VALUES (
    'test-user-id', 
    'Test Meal', 
    ARRAY['Apple', 'Banana'], 
    'Test raw analysis', 
    'Test description'
);

-- Clean up test data
DELETE FROM public.meals WHERE user_id = 'test-user-id';

SELECT 'Database schema fix completed successfully!' as status; 