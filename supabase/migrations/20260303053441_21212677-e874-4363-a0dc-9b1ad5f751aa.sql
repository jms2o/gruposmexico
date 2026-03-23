
-- Sound packages table
CREATE TABLE public.sound_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  capacity TEXT,
  badge TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sound_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read sound_packages"
  ON public.sound_packages FOR SELECT USING (true);

-- Package photos
CREATE TABLE public.package_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.sound_packages(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.package_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read package_photos"
  ON public.package_photos FOR SELECT USING (true);

-- Package videos
CREATE TABLE public.package_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.sound_packages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  youtube_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.package_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read package_videos"
  ON public.package_videos FOR SELECT USING (true);

-- Add video_url column to group_videos for MP4 uploads
ALTER TABLE public.group_videos ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Make youtube_url nullable (since videos can now be MP4 only)
ALTER TABLE public.group_videos ALTER COLUMN youtube_url DROP NOT NULL;

-- Seed default packages
INSERT INTO public.sound_packages (name, price, description, capacity, badge, features, sort_order) VALUES
  ('Paquete Básico', 0, 'Ideal para eventos pequeños e íntimos', 'Hasta 50 personas', NULL, '["2 bocinas", "2 micrófonos", "Montaje básico"]'::jsonb, 0),
  ('Paquete Profesional', 2500, 'La mejor opción para eventos medianos', 'Hasta 150 personas', 'Más vendido', '["4 bocinas", "Consola de mezcla", "Iluminación LED", "3 micrófonos"]'::jsonb, 1),
  ('Paquete Premium', 6000, 'Producción completa para grandes eventos', 'Hasta 500 personas', 'Ideal para bodas', '["Escenario completo", "Iluminación profesional", "Pantalla LED", "Máquina de humo", "Sonido envolvente"]'::jsonb, 2);
