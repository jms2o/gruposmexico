-- Allow public to read approved content submissions (photos and videos only)
CREATE POLICY "Public can read approved media submissions"
  ON public.content_submissions
  FOR SELECT
  USING (status = 'approved' AND type IN ('photo', 'main_photo', 'video'));