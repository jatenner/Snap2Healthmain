-- Comprehensive fix for user_id column type with RLS policies
-- This script handles the policy dependencies properly

-- Step 1: Check current policies on the meals table
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'meals';

-- Step 2: Drop all policies on the meals table temporarily
DROP POLICY IF EXISTS "Users can view their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can insert their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can update their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can delete their own meals" ON public.meals;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.meals;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.meals;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.meals;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.meals;

-- Step 3: Now change the user_id column type from UUID to TEXT
ALTER TABLE public.meals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 4: Recreate the policies with TEXT user_id
CREATE POLICY "Users can view their own meals" ON public.meals
    FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can insert their own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update their own meals" ON public.meals
    FOR UPDATE USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can delete their own meals" ON public.meals
    FOR DELETE USING (auth.uid()::TEXT = user_id);

-- Step 5: Verify the changes
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'meals' AND column_name = 'user_id';

-- Step 6: Check that policies are recreated
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'meals';

-- Step 7: Test message
SELECT 'user_id column type and policies fixed successfully!' as status; 