
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'group');

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Group profiles
CREATE TABLE public.group_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  group_name text NOT NULL,
  group_type text NOT NULL DEFAULT 'Versátil',
  phone text,
  whatsapp text,
  city text DEFAULT 'Mazatlán',
  social_media jsonb DEFAULT '{}',
  description text,
  photos jsonb DEFAULT '[]',
  demo_video text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.group_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved profiles" ON public.group_profiles FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners can read own profile" ON public.group_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can update own profile" ON public.group_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert own profile" ON public.group_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Membership plans
CREATE TABLE public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL DEFAULT 'basic',
  price_monthly numeric NOT NULL DEFAULT 0,
  price_annual numeric NOT NULL DEFAULT 0,
  max_photos integer DEFAULT 5,
  max_videos integer DEFAULT 1,
  features jsonb DEFAULT '[]',
  badge text,
  highlighted boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read plans" ON public.membership_plans FOR SELECT USING (true);

-- Group memberships
CREATE TABLE public.group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_profile_id uuid REFERENCES public.group_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.membership_plans(id) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  billing_period text DEFAULT 'monthly',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can read own membership" ON public.group_memberships FOR SELECT USING (
  group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid())
);

-- Content submissions
CREATE TABLE public.content_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_profile_id uuid REFERENCES public.group_profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.content_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can read own submissions" ON public.content_submissions FOR SELECT USING (
  group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Owners can insert submissions" ON public.content_submissions FOR INSERT WITH CHECK (
  group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid())
);

-- Admin notifications
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  group_profile_id uuid REFERENCES public.group_profiles(id) ON DELETE SET NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read notifications" ON public.admin_notifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: notify on new group registration
CREATE OR REPLACE FUNCTION public.notify_new_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, group_profile_id)
  VALUES ('new_registration', 'Nuevo grupo registrado', 'El grupo ' || NEW.group_name || ' se ha registrado', NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_new_group_profile AFTER INSERT ON public.group_profiles FOR EACH ROW EXECUTE FUNCTION public.notify_new_group();

-- Trigger: notify on new content submission
CREATE OR REPLACE FUNCTION public.notify_new_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, group_profile_id)
  VALUES ('content_submission', 'Nueva solicitud de contenido', 'Tipo: ' || NEW.type, NEW.group_profile_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_new_content_submission AFTER INSERT ON public.content_submissions FOR EACH ROW EXECUTE FUNCTION public.notify_new_submission();

-- Trigger: assign group role on profile creation
CREATE OR REPLACE FUNCTION public.assign_group_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'group') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_group_profile_assign_role AFTER INSERT ON public.group_profiles FOR EACH ROW EXECUTE FUNCTION public.assign_group_role();
