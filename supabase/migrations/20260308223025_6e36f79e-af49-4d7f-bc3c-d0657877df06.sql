
-- Comment likes table
CREATE TABLE public.reel_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.reel_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

ALTER TABLE public.reel_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comment likes" ON public.reel_comment_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own comment likes" ON public.reel_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can delete own comment likes" ON public.reel_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Add parent_id to reel_comments for replies
ALTER TABLE public.reel_comments ADD COLUMN parent_id uuid REFERENCES public.reel_comments(id) ON DELETE CASCADE DEFAULT NULL;
