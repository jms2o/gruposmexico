
-- Create a function that notifies all matching group profiles when a new event request is created
CREATE OR REPLACE FUNCTION public.notify_groups_new_event_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  matching_group RECORD;
BEGIN
  -- Find all approved group profiles in the same city/state that match the group type
  FOR matching_group IN
    SELECT gp.id, gp.group_name
    FROM public.group_profiles gp
    WHERE gp.status = 'approved'
      AND gp.state = NEW.state
      AND gp.city = NEW.city
  LOOP
    INSERT INTO public.admin_notifications (type, title, message, group_profile_id)
    VALUES (
      'event_request',
      'Nueva solicitud de evento',
      'Solicitud de ' || NEW.client_name || ' para ' || NEW.event_type || ' en ' || NEW.city || ' - ' || NEW.group_type || ' - Presupuesto: $' || NEW.budget,
      matching_group.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on event_requests table
CREATE TRIGGER on_new_event_request
  AFTER INSERT ON public.event_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_groups_new_event_request();

-- Also enable realtime for event_requests so notifications appear instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
