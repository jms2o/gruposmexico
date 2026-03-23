
-- Centralized media table
CREATE TABLE public.group_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_profile_id uuid NOT NULL REFERENCES public.group_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('photo', 'video', 'youtube')),
  url text NOT NULL,
  thumbnail text,
  title text,
  uploaded_by text NOT NULL DEFAULT 'group' CHECK (uploaded_by IN ('admin', 'group')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.group_media ENABLE ROW LEVEL SECURITY;

-- Public can read all media
CREATE POLICY "Public can read group_media" ON public.group_media
  FOR SELECT USING (true);

-- Owners can insert own media
CREATE POLICY "Owners can insert own media" ON public.group_media
  FOR INSERT WITH CHECK (
    group_profile_id IN (
      SELECT id FROM public.group_profiles WHERE user_id = auth.uid()
    )
  );

-- Owners can delete own media
CREATE POLICY "Owners can delete own media" ON public.group_media
  FOR DELETE USING (
    group_profile_id IN (
      SELECT id FROM public.group_profiles WHERE user_id = auth.uid()
    )
  );

-- Admin can do everything
CREATE POLICY "Admin can manage group_media" ON public.group_media
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookup
CREATE INDEX idx_group_media_group_profile_id ON public.group_media(group_profile_id);
CREATE INDEX idx_group_media_type ON public.group_media(type);
