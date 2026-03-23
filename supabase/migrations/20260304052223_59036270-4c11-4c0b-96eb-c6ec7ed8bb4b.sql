
-- Auto-create group_profiles for existing unlinked musical_groups
DO $$
DECLARE
  rec RECORD;
  new_profile_id uuid;
BEGIN
  FOR rec IN 
    SELECT id, name FROM public.musical_groups WHERE group_profile_id IS NULL
  LOOP
    INSERT INTO public.group_profiles (group_name, group_type, status)
    VALUES (rec.name, 'Versátil', 'approved')
    RETURNING id INTO new_profile_id;
    
    UPDATE public.musical_groups SET group_profile_id = new_profile_id WHERE id = rec.id;
  END LOOP;
END $$;

-- Trigger: auto-create a group_profile when a new musical_group is inserted without one
CREATE OR REPLACE FUNCTION public.auto_create_group_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_profile_id uuid;
BEGIN
  IF NEW.group_profile_id IS NULL THEN
    INSERT INTO public.group_profiles (group_name, group_type, status)
    VALUES (NEW.name, 'Versátil', 'approved')
    RETURNING id INTO new_profile_id;
    
    NEW.group_profile_id := new_profile_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_group_profile
  BEFORE INSERT ON public.musical_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_group_profile();
