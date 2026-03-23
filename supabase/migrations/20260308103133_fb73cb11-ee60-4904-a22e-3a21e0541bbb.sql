
-- First delete memberships referencing old plans, then update plans
DELETE FROM group_memberships;
DELETE FROM membership_plans;

INSERT INTO membership_plans (name, tier, price_monthly, price_annual, commission_rate, features, max_photos, max_videos, badge, highlighted, visible, sort_order)
VALUES
  ('Plan Básico', 'basic', 0, 0, 15, '["Crear Perfil", "Subir Videos", "Recibir Solicitudes", "Enviar Propuestas", "Aparece en últimos lugares de búsqueda"]'::jsonb, 5, 2, '🎵', false, true, 1),
  ('Plan Destacado', 'professional', 1000, 10000, 12, '["Más Visibilidad en Ciudad", "Aparece antes que Gratis", "Más Propuestas", "Mejor posición en resultados"]'::jsonb, 15, 5, '⭐', true, true, 2),
  ('Plan Elite', 'premium', 3000, 30000, 10, '["Primeros lugares en búsqueda", "Perfil Destacado", "Badge Verificado", "Más Exposición Feed", "Máxima Exposición"]'::jsonb, 30, 10, '👑', false, true, 3);
