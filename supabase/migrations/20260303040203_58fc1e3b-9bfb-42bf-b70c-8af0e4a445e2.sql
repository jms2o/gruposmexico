
-- Table for group photos (gallery)
CREATE TABLE public.group_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.musical_groups(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read group_photos" ON public.group_photos FOR SELECT USING (true);

-- Table for group videos
CREATE TABLE public.group_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.musical_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read group_videos" ON public.group_videos FOR SELECT USING (true);
