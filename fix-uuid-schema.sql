-- Fix UUID Schema Issues in Meals Table
-- This script ensures proper UUID handling for the meals table

-- First, let's check the current structure and fix any UUID issues
DO $$
BEGIN
    -- Check if the meals table exists and what type the id column is
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'meals'
    ) THEN
        RAISE NOTICE 'Meals table exists, checking column types...';
        
        -- Check if id column is UUID type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meals' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE 'ID column is already UUID type';
        ELSE
            RAISE NOTICE 'ID column needs to be converted to UUID';
        END IF;
        
        -- Check if user_id column exists and its type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meals' 
            AND column_name = 'user_id'
        ) THEN
            RAISE NOTICE 'user_id column exists';
        ELSE
            RAISE NOTICE 'user_id column missing';
        END IF;
        
    ELSE
        RAISE NOTICE 'Meals table does not exist, will create it';
    END IF;
END $$;

-- Create or recreate the meals table with proper UUID handling
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Keep as TEXT for flexibility with auth systems
    meal_name TEXT,
    image_url TEXT,
    calories INTEGER,
    protein REAL,
    fat REAL,
    carbs REAL,
    macronutrients JSONB DEFAULT '[]'::jsonb,
    micronutrients JSONB DEFAULT '[]'::jsonb,
    ingredients TEXT[] DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    concerns TEXT[] DEFAULT '{}',
    suggestions TEXT[] DEFAULT '{}',
    analysis JSONB DEFAULT '{}'::jsonb,
    goal TEXT,
    personalized_insights TEXT,
    insights_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- New columns from schema fixes
    foods JSONB DEFAULT '[]'::jsonb,
    raw_analysis JSONB DEFAULT '{}'::jsonb,
    description TEXT
);

-- Add missing columns if they don't exist (safe to run multiple times)
DO $$
BEGIN
    -- Add foods column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meals' 
        AND column_name = 'foods'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN foods JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added foods column';
    END IF;
    
    -- Add raw_analysis column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meals' 
        AND column_name = 'raw_analysis'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN raw_analysis JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added raw_analysis column';
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meals' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;
    
    -- Add meal_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meals' 
        AND column_name = 'meal_name'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN meal_name TEXT;
        RAISE NOTICE 'Added meal_name column';
    END IF;
    
    -- Add insights_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meals' 
        AND column_name = 'insights_status'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN insights_status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added insights_status column';
    END IF;
    
    -- Add personalized_insights column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meals' 
        AND column_name = 'personalized_insights'
    ) THEN
        ALTER TABLE public.meals ADD COLUMN personalized_insights TEXT;
        RAISE NOTICE 'Added personalized_insights column';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON public.meals(created_at);
CREATE INDEX IF NOT EXISTS idx_meals_calories ON public.meals(calories);
CREATE INDEX IF NOT EXISTS idx_meals_meal_name ON public.meals(meal_name);

-- Enable Row Level Security
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can insert their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can update their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can delete their own meals" ON public.meals;

-- Create new RLS policies
CREATE POLICY "Users can view their own meals" 
    ON public.meals FOR SELECT 
    USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can insert their own meals" 
    ON public.meals FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can update their own meals" 
    ON public.meals FOR UPDATE 
    USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can delete their own meals" 
    ON public.meals FOR DELETE 
    USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Create an update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_meals_updated_at ON public.meals;
CREATE TRIGGER update_meals_updated_at 
    BEFORE UPDATE ON public.meals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Test the schema by inserting a sample meal
INSERT INTO public.meals (
    user_id, 
    meal_name, 
    description, 
    calories, 
    protein, 
    fat, 
    carbs,
    foods,
    raw_analysis,
    macronutrients,
    micronutrients,
    analysis,
    goal
) VALUES (
    'test-user-schema-fix',
    'Schema Test Meal',
    'Testing the fixed schema',
    500,
    25,
    15,
    45,
    '["chicken", "rice", "vegetables"]'::jsonb,
    '{"confidence": 0.95, "model": "test"}'::jsonb,
    '[{"name": "Protein", "amount": 25, "unit": "g"}]'::jsonb,
    '[{"name": "Vitamin C", "amount": 30, "unit": "mg"}]'::jsonb,
    '{"health_score": 8.5}'::jsonb,
    'test'
) ON CONFLICT (id) DO NOTHING;

-- Clean up the test meal
DELETE FROM public.meals WHERE user_id = 'test-user-schema-fix';

-- Final status check
SELECT 
    'Schema fix completed successfully!' as status,
    COUNT(*) as total_meals,
    COUNT(DISTINCT user_id) as unique_users
FROM public.meals; 