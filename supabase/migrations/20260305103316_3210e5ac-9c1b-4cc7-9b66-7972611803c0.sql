
ALTER TABLE public.group_profiles ADD COLUMN IF NOT EXISTS state text DEFAULT 'Sinaloa';
ALTER TABLE public.musical_groups ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.musical_groups ADD COLUMN IF NOT EXISTS city text;
