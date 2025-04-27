-- Add missing UPDATE and DELETE policies for the meals table

-- Create UPDATE policy
CREATE POLICY "Users can update their own meals"
  ON public.meals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create DELETE policy
CREATE POLICY "Users can delete their own meals"
  ON public.meals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure the 'ingredients' field is properly supported as a JSONB array
ALTER TABLE IF EXISTS public.meals 
ADD COLUMN IF NOT EXISTS ingredients JSONB; 