-- Tournament detail content and admin management modules.
-- Safe to re-run. Existing tournament rows and demo cards are preserved.

CREATE TABLE IF NOT EXISTS public.tournament_content (
  tournament_id uuid PRIMARY KEY REFERENCES public.tournaments(id) ON DELETE CASCADE,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  banned_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  penalties jsonb NOT NULL DEFAULT '[]'::jsonb,
  placement_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  prizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  organizer_note text,
  matches_description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  team_name text,
  game_uid text,
  contact text,
  slot_number integer,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','confirmed','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON public.tournament_participants(tournament_id);

CREATE TABLE IF NOT EXISTS public.tournament_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  amount integer NOT NULL DEFAULT 0 CHECK (amount >= 0),
  method text NOT NULL DEFAULT 'bKash',
  transaction_id text,
  sender_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','refunded')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_tournament ON public.tournament_payments(tournament_id);

CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_number integer NOT NULL DEFAULT 1,
  map text NOT NULL DEFAULT 'Bermuda',
  start_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.tournament_matches(tournament_id);

CREATE TABLE IF NOT EXISTS public.tournament_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  team_name text,
  rank integer NOT NULL DEFAULT 1,
  kills integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  prize_amount integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_results_tournament ON public.tournament_results(tournament_id);

CREATE TABLE IF NOT EXISTS public.website_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_admin_module_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['tournament_content','tournament_participants','tournament_payments','tournament_matches','tournament_results','website_settings']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_public_read', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_admin_all', tbl);
    IF tbl <> 'website_settings' THEN
      IF tbl IN ('tournament_content','tournament_participants','tournament_matches','tournament_results','website_settings') THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', tbl || '_public_read', tbl);
      END IF;
    END IF;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', tbl || '_admin_all', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', tbl);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS tournament_content_updated_at ON public.tournament_content;
CREATE TRIGGER tournament_content_updated_at BEFORE UPDATE ON public.tournament_content
FOR EACH ROW EXECUTE FUNCTION public.set_admin_module_updated_at();
DROP TRIGGER IF EXISTS website_settings_updated_at ON public.website_settings;
CREATE TRIGGER website_settings_updated_at BEFORE UPDATE ON public.website_settings
FOR EACH ROW EXECUTE FUNCTION public.set_admin_module_updated_at();
