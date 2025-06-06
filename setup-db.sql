-- Setup script for Snap2Health database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  meal_name VARCHAR,
  image_url VARCHAR,
  calories INTEGER,
  protein REAL,
  fat REAL,
  carbs REAL,
  macronutrients JSONB,
  micronutrients JSONB,
  ingredients TEXT[],
  benefits TEXT[],
  concerns TEXT[],
  suggestions TEXT[],
  analysis JSONB,
  goal VARCHAR,
  personalized_insights TEXT,
  insights_status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at);

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own meals
CREATE POLICY "Users can view their own meals" 
  ON meals FOR SELECT 
  USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own meals
CREATE POLICY "Users can insert their own meals" 
  ON meals FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to update their own meals
CREATE POLICY "Users can update their own meals" 
  ON meals FOR UPDATE 
  USING (auth.uid()::text = user_id);

-- Create policy to allow users to delete their own meals
CREATE POLICY "Users can delete their own meals" 
  ON meals FOR DELETE 
  USING (auth.uid()::text = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meals_updated_at 
  BEFORE UPDATE ON meals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 