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

-- Allow public access to goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view goals"
  ON public.goals
  FOR SELECT
  USING (true); 