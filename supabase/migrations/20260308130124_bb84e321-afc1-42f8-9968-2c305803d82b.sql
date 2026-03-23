
-- Create client_profiles table
CREATE TABLE public.client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  city text DEFAULT 'Mazatlán',
  state text DEFAULT 'Sinaloa',
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can read own client_profile"
  ON public.client_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own client_profile"
  ON public.client_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own client_profile"
  ON public.client_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all client_profiles"
  ON public.client_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Add 'client' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- Function to auto-assign client role
CREATE OR REPLACE FUNCTION public.assign_client_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'client') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_client_profile_created
  AFTER INSERT ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_client_role();

-- Add client_user_id to event_requests so we can link requests to registered clients
ALTER TABLE public.event_requests ADD COLUMN IF NOT EXISTS client_user_id uuid;

-- Add RLS policy for clients to update own requests
CREATE POLICY "Clients can update own requests"
  ON public.event_requests FOR UPDATE
  USING (client_user_id = auth.uid())
  WITH CHECK (client_user_id = auth.uid());
