-- BANGLAR TOURNAMENTS: one-time database setup
-- Run this entire file in Supabase Dashboard -> SQL Editor.
-- Safe to re-run: demo rows use ON CONFLICT DO NOTHING and tables use IF NOT EXISTS.

-- Import the original 12 public demo tournaments without deleting or overwriting
-- any existing database records. Safe to run more than once.
INSERT INTO public.tournaments
  (uid, slug, title, title_bn, mode, entry_fee, prize_pool, slots, slots_filled, status, start_at, cover, region, map)
VALUES
  ('#FF001','ffbd-weekly-solo-cup','FFBD Weekly Solo Cup','এফএফবিডি উইকলি সোলো কাপ','Solo',0,15000,48,41,'live',now()+interval '45 minutes',null,'BD','Bermuda'),
  ('#FF002','night-squad-championship','Night Squad Championship','নাইট স্কোয়াড চ্যাম্পিয়নশিপ','Squad',100,50000,24,18,'upcoming',now()+interval '5 hours',null,'BD','Bermuda'),
  ('#FF003','duo-rush-friday','Duo Rush Friday','ডুও রাশ ফ্রাইডে','Duo',50,25000,36,29,'upcoming',now()+interval '28 hours',null,'BD','Purgatory'),
  ('#FF004','free-entry-squad-clash','Free Entry Squad Clash','ফ্রি এন্ট্রি স্কোয়াড ক্ল্যাশ','Squad',0,20000,20,12,'upcoming',now()+interval '50 hours',null,'BD','Kalahari'),
  ('#FF005','pro-solo-showdown','Pro Solo Showdown','প্রো সোলো শোডাউন','Solo',80,35000,48,48,'ended',now()-interval '24 hours',null,'BD','Alpine'),
  ('#FF006','weekend-grand-squad','Weekend Grand Squad','উইকেন্ড গ্র্যান্ড স্কোয়াড','Squad',150,100000,16,9,'upcoming',now()+interval '72 hours',null,'BD','Bermuda'),
  ('#FF007','midnight-solo-blitz','Midnight Solo Blitz','মিডনাইট সোলো ব্লিটজ','Solo',30,12000,48,22,'upcoming',now()+interval '12 hours',null,'BD','Purgatory'),
  ('#FF008','dhaka-duo-open','Dhaka Duo Open','ঢাকা ডুও ওপেন','Duo',0,18000,40,31,'live',now()+interval '90 minutes',null,'BD','Bermuda'),
  ('#FF009','kalahari-squad-wars','Kalahari Squad Wars','কালাহারি স্কোয়াড ওয়ার্স','Squad',120,60000,20,20,'ended',now()-interval '48 hours',null,'BD','Kalahari'),
  ('#FF010','alpine-pro-duo','Alpine Pro Duo','আলপাইন প্রো ডুও','Duo',70,28000,32,14,'upcoming',now()+interval '36 hours',null,'BD','Alpine'),
  ('#FF011','free-solo-friday','Free Solo Friday','ফ্রি সোলো ফ্রাইডে','Solo',0,10000,48,8,'upcoming',now()+interval '96 hours',null,'BD','Bermuda'),
  ('#FF012','champions-squad-final','Champions Squad Final','চ্যাম্পিয়নস স্কোয়াড ফাইনাল','Squad',200,150000,12,6,'upcoming',now()+interval '120 hours',null,'BD','Purgatory')
ON CONFLICT DO NOTHING;


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
    IF tbl IN ('tournament_content','tournament_participants','tournament_matches','tournament_results') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', tbl || '_public_read', tbl);
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


-- Refresh PostgREST's schema cache so the new tables become visible to the API.
NOTIFY pgrst, 'reload schema';
