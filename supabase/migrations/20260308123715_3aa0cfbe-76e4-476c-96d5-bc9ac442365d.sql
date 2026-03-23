
-- Payments table for tracking simulated payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_proposal_id uuid REFERENCES public.event_proposals(id) ON DELETE CASCADE NOT NULL,
  group_profile_id uuid REFERENCES public.group_profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 15,
  total_service numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  payment_method text NOT NULL DEFAULT 'card',
  client_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Admin can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Contracts table for auto-generated contracts
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_proposal_id uuid REFERENCES public.event_proposals(id) ON DELETE CASCADE NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  group_profile_id uuid REFERENCES public.group_profiles(id) ON DELETE CASCADE NOT NULL,
  client_name text NOT NULL,
  group_name text NOT NULL,
  event_date date NOT NULL,
  event_city text NOT NULL,
  event_type text NOT NULL DEFAULT 'Evento',
  duration_hours integer NOT NULL DEFAULT 3,
  deposit_amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  service_conditions text NOT NULL DEFAULT 'El anticipo confirma la reserva del servicio musical. El saldo restante se paga directamente al músico el día del evento. Cancelaciones con menos de 48 horas de anticipación no son reembolsables.',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contracts" ON public.contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read contracts" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Admin can manage contracts" ON public.contracts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
