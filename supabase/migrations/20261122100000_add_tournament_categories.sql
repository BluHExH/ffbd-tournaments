-- Add Free Fire tournament categories and preserve existing tournaments as BR matches.
BEGIN;
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'br_match';
UPDATE public.tournaments SET category = 'br_match'
WHERE category IS NULL OR btrim(category) = '';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournaments'::regclass
      AND conname = 'tournaments_category_check'
  ) THEN
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_category_check CHECK (category IN (
        'br_match', 'clash_squad', 'lone_wolf',
        'cs_1v1_2v2', 'lw_headshot', 'cs_headshot'
      ));
  END IF;
END;
$$;
CREATE INDEX IF NOT EXISTS tournaments_category_start_at_idx
  ON public.tournaments(category, start_at);
NOTIFY pgrst, 'reload schema';
COMMIT;
