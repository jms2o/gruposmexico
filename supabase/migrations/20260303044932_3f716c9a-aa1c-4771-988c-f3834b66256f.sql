
-- =============================================
-- CMS COMPLETO: Migración principal
-- =============================================

-- 1. Tabla para contenido editable del sitio (key-value)
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  key text NOT NULL,
  value text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'text', -- text, image, video, html
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(section, key)
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site_content" ON public.site_content FOR SELECT USING (true);

-- 2. Tabla para orden y visibilidad de secciones del homepage
CREATE TABLE public.section_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  label text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.section_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read section_order" ON public.section_order FOR SELECT USING (true);

-- Insertar secciones predeterminadas
INSERT INTO public.section_order (section_key, label, sort_order) VALUES
  ('hero', 'Banner Principal', 0),
  ('categories', 'Categorías', 1),
  ('featured', 'Grupos Destacados', 2),
  ('testimonials', 'Testimonios', 3),
  ('faqs', 'Preguntas Frecuentes', 4),
  ('quote_form', 'Formulario de Cotización', 5);

-- 3. Agregar visibilidad a tablas existentes
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;
ALTER TABLE public.musical_groups ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;
ALTER TABLE public.musical_groups ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;

-- 4. Tabla para secciones personalizadas creadas por el usuario
CREATE TABLE public.custom_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  content text,
  image_url text,
  video_url text,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read custom_sections" ON public.custom_sections FOR SELECT USING (true);

-- 5. Insertar contenido editable del hero por defecto
INSERT INTO public.site_content (section, key, value, type) VALUES
  ('hero', 'badge_text', '🎶 La música que tu evento merece', 'text'),
  ('hero', 'title_line1', 'Grupos Musicales', 'text'),
  ('hero', 'title_line2', 'en Mazatlán', 'text'),
  ('hero', 'subtitle', 'Contrata las mejores bandas, norteños y mariachis de Sinaloa para tu evento', 'text'),
  ('hero', 'cta_primary', 'Reservar por WhatsApp', 'text'),
  ('hero', 'cta_secondary', 'Cotiza al instante', 'text'),
  ('hero', 'background_image', '', 'image'),
  ('hero', 'trust_badge_1', '✓ +500 eventos', 'text'),
  ('hero', 'trust_badge_2', '✓ Respuesta inmediata', 'text'),
  ('hero', 'trust_badge_3', '✓ Los mejores precios', 'text'),
  ('categories', 'title', 'Encuentra tu grupo', 'text'),
  ('categories', 'title_accent', 'ideal', 'text'),
  ('categories', 'subtitle', 'Los mejores grupos musicales de Mazatlán y Sinaloa listos para tu evento', 'text'),
  ('featured', 'title', 'Más contratados', 'text'),
  ('featured', 'title_accent', 'esta semana', 'text'),
  ('featured', 'subtitle', 'Los favoritos de nuestros clientes en Mazatlán', 'text'),
  ('testimonials', 'title', 'Lo que dicen', 'text'),
  ('testimonials', 'title_accent', 'nuestros clientes', 'text'),
  ('testimonials', 'subtitle', 'Más de 500 eventos exitosos en Mazatlán y Sinaloa', 'text'),
  ('faqs', 'title', 'Preguntas', 'text'),
  ('faqs', 'title_accent', 'frecuentes', 'text'),
  ('faqs', 'subtitle', 'Todo lo que necesitas saber antes de contratar', 'text'),
  ('quote_form', 'title', 'Cotiza', 'text'),
  ('quote_form', 'title_accent', 'al instante', 'text'),
  ('quote_form', 'subtitle', 'Llena el formulario y te respondemos en minutos por WhatsApp', 'text'),
  ('footer', 'brand_name', 'Grupos Mazatlán', 'text'),
  ('footer', 'brand_description', 'La plataforma #1 para contratar grupos musicales en Mazatlán, Sinaloa. Más de 500 eventos exitosos.', 'text'),
  ('footer', 'copyright', '© 2026 Grupos Musicales en Mazatlán. Todos los derechos reservados.', 'text'),
  ('contact', 'email', '', 'text'),
  ('contact', 'location', 'Mazatlán, Sinaloa, México', 'text'),
  ('contact', 'hours', 'Atención 24/7', 'text');

-- 6. Crear bucket para videos si no existe
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Políticas de storage para el bucket de videos
CREATE POLICY "Public can read videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
