
-- Allow group owners to read their own notifications via group_profile_id
CREATE POLICY "Group owners can read own notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (
  group_profile_id IN (
    SELECT id FROM public.group_profiles WHERE user_id = auth.uid()
  )
);
