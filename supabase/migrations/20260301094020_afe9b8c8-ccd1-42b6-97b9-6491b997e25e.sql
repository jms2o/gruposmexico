
-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  image_url TEXT,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read categories"
  ON public.categories FOR SELECT
  USING (true);

-- Musical groups table
CREATE TABLE public.musical_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price TEXT NOT NULL,
  image_url TEXT,
  badge TEXT,
  badge_color TEXT DEFAULT 'bg-gold text-accent-foreground',
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.musical_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read musical_groups"
  ON public.musical_groups FOR SELECT
  USING (true);

-- Testimonials table
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  event_type TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read testimonials"
  ON public.testimonials FOR SELECT
  USING (true);

-- FAQs table
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read faqs"
  ON public.faqs FOR SELECT
  USING (true);

-- Site settings (WhatsApp number, etc.)
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Insert default WhatsApp number
INSERT INTO public.site_settings (key, value) VALUES ('whatsapp_number', '5216691234567');

-- Insert default categories
INSERT INTO public.categories (title, price, alt_text, sort_order) VALUES
  ('Bandas Sinaloenses', 'Desde $5,000 MXN/hr', 'Banda sinaloense tocando en vivo en Mazatlán', 1),
  ('Norteños', 'Desde $3,500 MXN/hr', 'Grupo norteño con acordeón y bajo sexto', 2),
  ('Mariachis', 'Desde $4,000 MXN/hr', 'Mariachi con trajes de charro en evento', 3),
  ('Grupos Versátiles', 'Desde $6,000 MXN/hr', 'Grupo versátil en boda en Mazatlán', 4);

-- Insert default featured groups
INSERT INTO public.musical_groups (name, price, badge, badge_color, featured, sort_order) VALUES
  ('Banda Los Recoditos Tribute', '$6,500 MXN/hr', '⭐ Recomendado', 'bg-gold text-accent-foreground', true, 1),
  ('Mariachi Real de Mazatlán', '$4,500 MXN/hr', '🔥 Promo', 'bg-primary text-primary-foreground', true, 2),
  ('Grupo Versátil Élite', '$7,000 MXN/hr', '⭐ Recomendado', 'bg-gold text-accent-foreground', true, 3);

-- Insert default testimonials
INSERT INTO public.testimonials (name, text, rating, event_type, sort_order) VALUES
  ('María Fernanda G.', 'Contratamos a la Banda para nuestra boda en la playa y fue espectacular. ¡Todos los invitados quedaron encantados!', 5, 'Boda en Playa', 1),
  ('Roberto M.', 'El mariachi llegó puntual y tocó increíble. La serenata fue el mejor regalo que le he dado a mi esposa.', 5, 'Serenata', 2),
  ('Laura P.', 'Excelente servicio, muy profesionales. El grupo versátil puso a bailar a todos en la fiesta de XV años.', 5, 'XV Años', 3);

-- Insert default FAQs
INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('¿Cómo puedo reservar un grupo musical?', 'Es muy sencillo. Solo haz clic en el botón de WhatsApp, cuéntanos tu evento y te enviaremos opciones y cotización en minutos.', 1),
  ('¿Con cuánta anticipación debo reservar?', 'Recomendamos al menos 2 semanas de anticipación, aunque en temporada alta sugerimos reservar con 1 mes o más.', 2),
  ('¿Qué incluye el servicio?', 'Incluye el grupo musical completo, equipo de sonido profesional, transporte dentro de Mazatlán y la duración contratada.', 3),
  ('¿Pueden tocar en la playa o al aire libre?', '¡Por supuesto! Nuestros grupos están acostumbrados a tocar en playas, jardines, terrazas y cualquier espacio.', 4),
  ('¿Cuáles son las formas de pago?', 'Aceptamos efectivo, transferencia bancaria, y tarjeta de crédito/débito. Se requiere un anticipo del 50%.', 5);
