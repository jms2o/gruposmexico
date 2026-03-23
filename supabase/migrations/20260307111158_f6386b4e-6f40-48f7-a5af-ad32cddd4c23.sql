
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  BEGIN
    DROP POLICY IF EXISTS "Allow authenticated uploads to videos" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Allow public read on videos" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE POLICY "Allow authenticated uploads to videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public read on videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'videos';
