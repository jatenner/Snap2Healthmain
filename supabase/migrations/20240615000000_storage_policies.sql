-- Add storage policies for meal-images bucket

-- Ensure the storage.buckets table has the meal-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policy to allow users to upload their own images
CREATE POLICY "Users can upload their own meal images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-images' AND 
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Create policy to allow users to read their own images
CREATE POLICY "Users can view their own meal images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'meal-images' AND 
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Create policy to allow public access to meal images
-- This is needed if you want the images to be publicly accessible
CREATE POLICY "Public can view all meal images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'meal-images');

-- Create policy to allow users to update their own images
CREATE POLICY "Users can update their own meal images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meal-images' AND 
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Create policy to allow users to delete their own images
CREATE POLICY "Users can delete their own meal images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-images' AND 
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
); 