-- Create meal history table
CREATE TABLE IF NOT EXISTS public.meal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  meal_name TEXT,
  image_url TEXT NOT NULL,
  analysis JSONB,
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.meal_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own meal history"
  ON public.meal_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal history"
  ON public.meal_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal history"
  ON public.meal_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal history"
  ON public.meal_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_meal_history_user_id ON public.meal_history(user_id);
CREATE INDEX idx_meal_history_created_at ON public.meal_history(created_at); 