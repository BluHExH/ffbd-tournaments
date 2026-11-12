-- Homepage content management: editable public stats, teams and payouts.
-- Safe to re-run. Existing tournaments and tournament management data are untouched.

CREATE TABLE IF NOT EXISTS public.homepage_stats (
  key text PRIMARY KEY DEFAULT 'main',
  prize_pool_paid bigint NOT NULL DEFAULT 0 CHECK (prize_pool_paid >= 0),
  teams_registered bigint NOT NULL DEFAULT 0 CHECK (teams_registered >= 0),
  tournaments_held bigint NOT NULL DEFAULT 0 CHECK (tournaments_held >= 0),
  prize_pool_label text NOT NULL DEFAULT 'Prize Pool Paid',
  teams_registered_label text NOT NULL DEFAULT 'Teams Registered',
  tournaments_held_label text NOT NULL DEFAULT 'Tournaments Held',
  stats_section_title text NOT NULL DEFAULT 'Prize Pool & Stats',
  teams_section_title text NOT NULL DEFAULT 'Top Teams & Recent Winners',
  payouts_section_title text NOT NULL DEFAULT 'Recent Payouts',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.homepage_teams (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  logo text NOT NULL DEFAULT '',
  kills integer NOT NULL DEFAULT 0 CHECK (kills >= 0),
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  wins integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  rank integer NOT NULL DEFAULT 1 CHECK (rank >= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.homepage_payouts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  team text,
  amount bigint NOT NULL DEFAULT 0 CHECK (amount >= 0),
  tournament text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL DEFAULT 'bKash',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homepage_stats_public_read ON public.homepage_stats;
DROP POLICY IF EXISTS homepage_stats_admin_all ON public.homepage_stats;
DROP POLICY IF EXISTS homepage_teams_public_read ON public.homepage_teams;
DROP POLICY IF EXISTS homepage_teams_admin_all ON public.homepage_teams;
DROP POLICY IF EXISTS homepage_payouts_public_read ON public.homepage_payouts;
DROP POLICY IF EXISTS homepage_payouts_admin_all ON public.homepage_payouts;

CREATE POLICY homepage_stats_public_read ON public.homepage_stats
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY homepage_stats_admin_all ON public.homepage_stats
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY homepage_teams_public_read ON public.homepage_teams
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY homepage_teams_admin_all ON public.homepage_teams
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY homepage_payouts_public_read ON public.homepage_payouts
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY homepage_payouts_admin_all ON public.homepage_payouts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.homepage_stats, public.homepage_teams, public.homepage_payouts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_stats, public.homepage_teams, public.homepage_payouts TO authenticated;

INSERT INTO public.homepage_stats
  (key, prize_pool_paid, teams_registered, tournaments_held)
VALUES ('main', 2450000, 18420, 312)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.homepage_teams (id, name, logo, kills, points, wins, rank) VALUES
  ('tm1','Dhaka Dominators','',312,1840,7,1),
  ('tm2','Chittagong Wolves','',287,1720,5,2),
  ('tm3','Sylhet Snipers','',265,1655,4,3),
  ('tm4','Rajshahi Royals','',241,1510,3,4),
  ('tm5','Khulna Kings','',228,1420,3,5),
  ('tm6','Barisal Blaze','',198,1290,2,6),
  ('tm7','Rangpur Raiders','',176,1180,2,7),
  ('tm8','Mymensingh Mayhem','',154,1050,1,8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.homepage_payouts (id, name, team, amount, tournament, date, method) VALUES
  ('w1','Rafi Ahmed','Dhaka Dominators',12000,'Pro Solo Showdown','2026-11-07','bKash'),
  ('w2','Nusrat Jahan','Chittagong Wolves',8500,'Duo Rush','2026-11-06','Nagad'),
  ('w3','Karim Hossain',null,5000,'FFBD Weekly Solo','2026-11-05','bKash'),
  ('w4','Sadia Akter','Sylhet Snipers',15000,'Night Squad','2026-11-04','Nagad'),
  ('w5','Imran Khan',null,3500,'Free Entry Clash','2026-11-03','bKash'),
  ('w6','Tanvir Islam','Rajshahi Royals',22000,'Kalahari Squad Wars','2026-11-02','bKash'),
  ('w7','Fahim Hasan',null,4000,'Midnight Solo Blitz','2026-11-01','Nagad')
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
