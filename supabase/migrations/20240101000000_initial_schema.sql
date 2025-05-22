-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed some default goals
INSERT INTO public.goals (name, description) VALUES
  ('Weight Loss', 'Reduce body fat and reach a healthier weight'),
  ('Muscle Gain', 'Increase muscle mass and strength'),
  ('Heart Health', 'Improve cardiovascular health and reduce heart disease risk'),
  ('Diabetes Management', 'Manage blood sugar levels and prevent complications'),
  ('General Wellness', 'Maintain overall health and well-being');

<<<<<<< HEAD
-- Create the meal_history table
CREATE TABLE IF NOT EXISTS public.meal_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_id TEXT NOT NULL,
    meal_name TEXT NOT NULL,
    meal_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calories INTEGER,
    protein FLOAT,
    carbs FLOAT,
    fat FLOAT,
    meal_contents JSONB,
    meal_analysis JSONB,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.meal_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select only their own meals
CREATE POLICY "Users can view their own meals"
    ON public.meal_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own meals
CREATE POLICY "Users can insert their own meals"
    ON public.meal_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own meals
CREATE POLICY "Users can update their own meals"
    ON public.meal_history
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own meals
CREATE POLICY "Users can delete their own meals"
    ON public.meal_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('meal-images', 'meal-images', true, 10485760) -- 10MB file size limit
ON CONFLICT (id) DO UPDATE
SET public = true, file_size_limit = 10485760;

-- Allow public to read objects in bucket
CREATE POLICY "Public read access for meal images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'meal-images');

-- Allow authenticated users to upload objects to bucket
CREATE POLICY "Authenticated users can upload meal images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'meal-images' AND
        auth.role() = 'authenticated'
    );

-- Allow users to update their own objects
CREATE POLICY "Users can update their own meal images"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'meal-images' AND auth.uid() = owner)
    WITH CHECK (bucket_id = 'meal-images' AND auth.uid() = owner);

-- Allow users to delete their own objects
CREATE POLICY "Users can delete their own meal images"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'meal-images' AND auth.uid() = owner);
=======
-- Create meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  goal TEXT,
  image_url TEXT,
  caption TEXT,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own meals"
  ON public.meals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON public.meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)

-- Allow public access to goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view goals"
  ON public.goals
  FOR SELECT
  USING (true); 