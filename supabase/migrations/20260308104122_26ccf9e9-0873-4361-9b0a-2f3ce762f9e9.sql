
-- Allow anyone to update event_proposals status (for clients accepting proposals)
CREATE POLICY "Anyone can update proposal status"
ON public.event_proposals
FOR UPDATE
USING (true)
WITH CHECK (true);
