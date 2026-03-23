
-- Step 1: Make user_id nullable for admin-created profiles
ALTER TABLE public.group_profiles ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Fix assign_group_role to handle NULL user_id
CREATE OR REPLACE FUNCTION public.assign_group_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'group') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
