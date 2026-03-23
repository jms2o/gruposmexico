
-- Fix the overly permissive notification insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;

-- Only allow authenticated users to insert (triggers run as SECURITY DEFINER so they bypass RLS)
-- No INSERT policy needed since triggers use SECURITY DEFINER
