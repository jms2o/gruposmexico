-- Add missing event details so proposals/payment can show map and schedule accurately
ALTER TABLE public.event_requests
  ADD COLUMN IF NOT EXISTS event_address text,
  ADD COLUMN IF NOT EXISTS start_time text NOT NULL DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision;

-- Backfill event_address from legacy description format: "direccion — descripcion"
UPDATE public.event_requests
SET event_address = NULLIF(split_part(description, ' — ', 1), '')
WHERE event_address IS NULL
  AND description IS NOT NULL
  AND description LIKE '% — %';
