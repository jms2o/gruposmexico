
CREATE TABLE public.blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_profile_id uuid NOT NULL REFERENCES public.group_profiles(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_profile_id, blocked_date)
);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read blocked_dates" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "Owners can manage own blocked_dates" ON public.blocked_dates FOR ALL TO authenticated USING (
  group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid())
) WITH CHECK (
  group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid())
);
