-- ============================================================
-- BANGLAR TOURNAMENTS — Secure Schema (v2)
-- Run in Supabase SQL Editor as role: postgres
-- Safe on empty public schema. Idempotent where possible.
-- ============================================================

-- 0. Schema privileges (fixes permission denied for schema public)
GRANT USAGE, CREATE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ============================================================
-- 1. admins
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Concurrency-safe max 3 admins (transaction-level advisory lock)
CREATE OR REPLACE FUNCTION public.check_admin_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(870031); -- serialize concurrent inserts
  IF (SELECT count(*) FROM public.admins) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 admins allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_limit_trigger ON public.admins;
CREATE TRIGGER admin_limit_trigger
  BEFORE INSERT ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_limit();

-- ============================================================
-- 2. tournaments (PUBLIC fields only — no room secrets)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_bn text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('Solo', 'Duo', 'Squad')),
  entry_fee integer NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
  prize_pool integer NOT NULL DEFAULT 0 CHECK (prize_pool >= 0),
  slots integer NOT NULL CHECK (slots >= 1),
  slots_filled integer NOT NULL DEFAULT 0 CHECK (slots_filled >= 0),
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('live', 'upcoming', 'ended')),
  start_at timestamptz NOT NULL,
  cover text,
  region text NOT NULL DEFAULT 'BD',
  map text NOT NULL CHECK (map IN ('Bermuda', 'Purgatory', 'Kalahari', 'Alpine')),
  description text,
  description_bn text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slots_filled_lte_slots CHECK (slots_filled <= slots)
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_at ON public.tournaments(start_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON public.tournaments(slug);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tournaments_updated_at ON public.tournaments;
CREATE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. tournament_room_credentials (PRIVATE — admins only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tournament_room_credentials (
  tournament_id uuid PRIMARY KEY REFERENCES public.tournaments(id) ON DELETE CASCADE,
  room_id text,
  room_password text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS room_credentials_updated_at ON public.tournament_room_credentials;
CREATE TRIGGER room_credentials_updated_at
  BEFORE UPDATE ON public.tournament_room_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. is_admin() — SECURITY DEFINER, no RLS recursion
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================
-- 5. Row Level Security
-- ============================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_room_credentials ENABLE ROW LEVEL SECURITY;

-- Drop both legacy and current policy names so this schema can be
-- safely re-applied without duplicate-policy errors.
DROP POLICY IF EXISTS "Admins can read admins" ON public.admins;
DROP POLICY IF EXISTS "admins_select_for_admins" ON public.admins;

DROP POLICY IF EXISTS "Public can read tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can insert tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can delete tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_select_public" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_insert_admin" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_update_admin" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_delete_admin" ON public.tournaments;

DROP POLICY IF EXISTS "room_credentials_select_admin" ON public.tournament_room_credentials;
DROP POLICY IF EXISTS "room_credentials_insert_admin" ON public.tournament_room_credentials;
DROP POLICY IF EXISTS "room_credentials_update_admin" ON public.tournament_room_credentials;
DROP POLICY IF EXISTS "room_credentials_delete_admin" ON public.tournament_room_credentials;

CREATE POLICY "admins_select_for_admins"
  ON public.admins FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "tournaments_select_public"
  ON public.tournaments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "tournaments_insert_admin"
  ON public.tournaments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "tournaments_update_admin"
  ON public.tournaments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "tournaments_delete_admin"
  ON public.tournaments FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "room_credentials_select_admin"
  ON public.tournament_room_credentials FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "room_credentials_insert_admin"
  ON public.tournament_room_credentials FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "room_credentials_update_admin"
  ON public.tournament_room_credentials FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "room_credentials_delete_admin"
  ON public.tournament_room_credentials FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 6. Table grants
-- ============================================================
GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;

GRANT SELECT ON public.admins TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_room_credentials TO authenticated;
