-- Update storage policies for meal-images bucket to handle both path formats

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can upload their own meal images" ON storage.objects;

-- Create a more flexible policy for uploads that handles both path formats:
-- 1. users/[userId]/[filename] (correct format)
-- 2. user_[userId]/[filename] (format being used in some cases)
CREATE POLICY "Users can upload their own meal images" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-images' AND (
    -- Format 1: users/[userId]/[filename]
    ((storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    -- Format 2: user_[userId]/[filename] 
    (name LIKE 'user\_' || auth.uid() || '/%')
    OR
    -- Allow metadata-based uploads without path restrictions
    (metadata->>'user_id' = auth.uid()::text)
  )
);

-- Update the select policy too
DROP POLICY IF EXISTS "Users can view their own meal images" ON storage.objects;

CREATE POLICY "Users can view their own meal images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'meal-images' AND (
    -- Format 1: users/[userId]/[filename]
    ((storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    -- Format 2: user_[userId]/[filename]
    (name LIKE 'user\_' || auth.uid() || '/%')
    OR
    -- Allow metadata-based access
    (metadata->>'user_id' = auth.uid()::text)
  )
);

-- Update the update policy
DROP POLICY IF EXISTS "Users can update their own meal images" ON storage.objects;

CREATE POLICY "Users can update their own meal images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meal-images' AND (
    -- Format 1: users/[userId]/[filename]
    ((storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    -- Format 2: user_[userId]/[filename]
    (name LIKE 'user\_' || auth.uid() || '/%')
    OR
    -- Allow metadata-based access
    (metadata->>'user_id' = auth.uid()::text)
  )
);

-- Update the delete policy
DROP POLICY IF EXISTS "Users can delete their own meal images" ON storage.objects;

CREATE POLICY "Users can delete their own meal images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-images' AND (
    -- Format 1: users/[userId]/[filename]
    ((storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    -- Format 2: user_[userId]/[filename]
    (name LIKE 'user\_' || auth.uid() || '/%')
    OR
    -- Allow metadata-based access
    (metadata->>'user_id' = auth.uid()::text)
  )
); 