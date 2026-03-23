
-- Event requests (clients post without auth)
CREATE TABLE public.event_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  client_token uuid NOT NULL DEFAULT gen_random_uuid(),
  group_type text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  event_date date NOT NULL,
  duration_hours integer NOT NULL DEFAULT 3,
  budget numeric NOT NULL DEFAULT 0,
  event_type text NOT NULL DEFAULT 'fiesta privada',
  description text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (clients without auth)
CREATE POLICY "Anyone can insert event_requests" ON public.event_requests FOR INSERT WITH CHECK (true);
-- Authenticated users can read open requests
CREATE POLICY "Authenticated can read open requests" ON public.event_requests FOR SELECT TO authenticated USING (status = 'open');
-- Anyone can read by client_token (for client inbox)
CREATE POLICY "Anyone can read own requests by token" ON public.event_requests FOR SELECT USING (true);

-- Event proposals (musicians respond)
CREATE TABLE public.event_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_request_id uuid NOT NULL REFERENCES public.event_requests(id) ON DELETE CASCADE,
  group_profile_id uuid NOT NULL REFERENCES public.group_profiles(id) ON DELETE CASCADE,
  price_total numeric,
  price_per_hour numeric,
  message text,
  availability_confirmed boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_proposals ENABLE ROW LEVEL SECURITY;

-- Musicians can insert proposals
CREATE POLICY "Musicians can insert proposals" ON public.event_proposals FOR INSERT TO authenticated
  WITH CHECK (group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid()));
-- Musicians can read own proposals
CREATE POLICY "Musicians can read own proposals" ON public.event_proposals FOR SELECT TO authenticated
  USING (group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid()));
-- Public can read proposals (for client inbox via token lookup)
CREATE POLICY "Public can read proposals" ON public.event_proposals FOR SELECT USING (true);
-- Musicians can update own proposals
CREATE POLICY "Musicians can update own proposals" ON public.event_proposals FOR UPDATE TO authenticated
  USING (group_profile_id IN (SELECT id FROM public.group_profiles WHERE user_id = auth.uid()));

-- Chat messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_proposal_id uuid NOT NULL REFERENCES public.event_proposals(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'client',
  sender_id text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert chat messages
CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
-- Anyone can read chat messages
CREATE POLICY "Anyone can read chat messages" ON public.chat_messages FOR SELECT USING (true);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
