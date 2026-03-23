
-- Add commission_rate to membership_plans
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 30;

-- Add pricing fields to group_profiles
ALTER TABLE public.group_profiles ADD COLUMN IF NOT EXISTS price_per_hour numeric DEFAULT 0;
ALTER TABLE public.group_profiles ADD COLUMN IF NOT EXISTS min_hours integer DEFAULT 3;
ALTER TABLE public.group_profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_profile_id uuid REFERENCES public.group_profiles(id) ON DELETE CASCADE NOT NULL,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  event_date timestamp with time zone NOT NULL,
  event_address text,
  hours integer NOT NULL DEFAULT 3,
  price_per_hour numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 30,
  commission_amount numeric NOT NULL DEFAULT 0,
  musician_earnings numeric NOT NULL DEFAULT 0,
  advance_amount numeric NOT NULL DEFAULT 0,
  advance_paid boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Owners can read their own bookings
CREATE POLICY "Owners can read own bookings" ON public.bookings
FOR SELECT TO authenticated
USING (group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid()));

-- Admin can read all bookings
CREATE POLICY "Admin can read all bookings" ON public.bookings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage bookings
CREATE POLICY "Admin can manage bookings" ON public.bookings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create commission_history table
CREATE TABLE public.commission_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  group_profile_id uuid REFERENCES public.group_profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0,
  period_month integer,
  period_year integer,
  status text NOT NULL DEFAULT 'collected',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.commission_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read commission_history" ON public.commission_history
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage commission_history" ON public.commission_history
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to auto-hide expired memberships
CREATE OR REPLACE FUNCTION public.check_expired_memberships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark expired memberships
  UPDATE public.group_memberships
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND expires_at < now();

  -- Hide profiles with no active membership
  UPDATE public.group_profiles gp
  SET status = 'hidden', updated_at = now()
  WHERE gp.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_profile_id = gp.id AND gm.status = 'active'
    );
END;
$$;

-- Add admin SELECT policy on group_profiles
CREATE POLICY "Admin can read all profiles" ON public.group_profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin UPDATE policy on group_profiles  
CREATE POLICY "Admin can update all profiles" ON public.group_profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add admin DELETE policy on group_profiles
CREATE POLICY "Admin can delete profiles" ON public.group_profiles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for content_submissions
CREATE POLICY "Admin can read all submissions" ON public.content_submissions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update submissions" ON public.content_submissions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin policies for group_memberships
CREATE POLICY "Admin can read all memberships" ON public.group_memberships
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage memberships" ON public.group_memberships
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin policies for admin_notifications (insert for triggers)
CREATE POLICY "System can insert notifications" ON public.admin_notifications
FOR INSERT TO authenticated
WITH CHECK (true);

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
