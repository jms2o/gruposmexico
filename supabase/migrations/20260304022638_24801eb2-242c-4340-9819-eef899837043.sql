-- Allow group owners to update their own musical_groups entry
CREATE POLICY "Owners can update own musical_group"
ON public.musical_groups
FOR UPDATE
TO authenticated
USING (
  group_profile_id IN (
    SELECT id FROM public.group_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  group_profile_id IN (
    SELECT id FROM public.group_profiles WHERE user_id = auth.uid()
  )
);