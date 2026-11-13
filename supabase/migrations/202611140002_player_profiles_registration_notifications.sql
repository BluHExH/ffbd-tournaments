-- Player profiles, secure tournament registration, banners and in-app notifications.

CREATE TABLE IF NOT EXISTS public.player_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  avatar_url text,
  game_uid text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS player_profiles_username_ci_unique
  ON public.player_profiles (lower(username));

CREATE TABLE IF NOT EXISTS public.player_private_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_participants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tournament_participants_user_unique
  ON public.tournament_participants(tournament_id, user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.tournament_results
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tournament_results_user_idx
  ON public.tournament_results(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_private_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS player_profiles_public_read ON public.player_profiles;
CREATE POLICY player_profiles_public_read ON public.player_profiles
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS player_profiles_insert_own ON public.player_profiles;
CREATE POLICY player_profiles_insert_own ON public.player_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS player_profiles_update_own ON public.player_profiles;
CREATE POLICY player_profiles_update_own ON public.player_profiles
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS player_profiles_admin_all ON public.player_profiles;
CREATE POLICY player_profiles_admin_all ON public.player_profiles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS player_private_profiles_select_own ON public.player_private_profiles;
CREATE POLICY player_private_profiles_select_own ON public.player_private_profiles
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS player_private_profiles_insert_own ON public.player_private_profiles;
CREATE POLICY player_private_profiles_insert_own ON public.player_private_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS player_private_profiles_update_own ON public.player_private_profiles;
CREATE POLICY player_private_profiles_update_own ON public.player_private_profiles
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

GRANT SELECT ON public.player_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.player_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.player_private_profiles TO authenticated;

-- Backfill profiles for accounts that existed before this migration.
INSERT INTO public.player_profiles(user_id, username)
SELECT u.id, 'Player' || upper(substr(replace(u.id::text, '-', ''), 1, 8))
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_player_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.player_profiles(user_id, username)
  VALUES (NEW.id, 'Player' || upper(substr(replace(NEW.id::text, '-', ''), 1, 8)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_player_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_player_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_player_profile_for_new_user();

CREATE OR REPLACE FUNCTION public.set_player_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS player_profiles_updated_at ON public.player_profiles;
CREATE TRIGGER player_profiles_updated_at BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_player_profile_updated_at();
DROP TRIGGER IF EXISTS player_private_profiles_updated_at ON public.player_private_profiles;
CREATE TRIGGER player_private_profiles_updated_at BEFORE UPDATE ON public.player_private_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_player_profile_updated_at();

CREATE OR REPLACE VIEW public.player_leaderboard
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.username,
  p.avatar_url,
  count(r.id)::integer AS total_matches,
  count(*) FILTER (WHERE r.rank = 1)::integer AS wins,
  coalesce(sum(r.kills), 0)::bigint AS total_kills,
  coalesce(sum(r.points), 0)::bigint AS total_points,
  coalesce(sum(r.prize_amount), 0)::bigint AS total_earnings
FROM public.player_profiles p
LEFT JOIN public.tournament_results r ON r.user_id = p.user_id
GROUP BY p.user_id, p.username, p.avatar_url;
GRANT SELECT ON public.player_leaderboard TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.link_result_to_registered_player()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT p.user_id INTO NEW.user_id
    FROM public.tournament_participants p
    WHERE p.tournament_id = NEW.tournament_id
      AND p.user_id IS NOT NULL
      AND (
        lower(p.display_name) = lower(NEW.participant_name)
        OR (NEW.team_name IS NOT NULL AND lower(coalesce(p.team_name,'')) = lower(NEW.team_name))
      )
    ORDER BY p.created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$;
DROP TRIGGER IF EXISTS tournament_results_link_player ON public.tournament_results;
CREATE TRIGGER tournament_results_link_player
  BEFORE INSERT OR UPDATE OF participant_name, team_name, tournament_id
  ON public.tournament_results
  FOR EACH ROW EXECUTE FUNCTION public.link_result_to_registered_player();

CREATE TABLE IF NOT EXISTS public.homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  target_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS homepage_banners_public_read ON public.homepage_banners;
CREATE POLICY homepage_banners_public_read ON public.homepage_banners
  FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS homepage_banners_admin_all ON public.homepage_banners;
CREATE POLICY homepage_banners_admin_all ON public.homepage_banners
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT ON public.homepage_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_banners TO authenticated;

CREATE TABLE IF NOT EXISTS public.player_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS player_notifications_user_created_idx
  ON public.player_notifications(user_id, created_at DESC);
ALTER TABLE public.player_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS player_notifications_select_own ON public.player_notifications;
CREATE POLICY player_notifications_select_own ON public.player_notifications
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS player_notifications_update_own ON public.player_notifications;
CREATE POLICY player_notifications_update_own ON public.player_notifications
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS player_notifications_admin_insert ON public.player_notifications;
CREATE POLICY player_notifications_admin_insert ON public.player_notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
GRANT SELECT ON public.player_notifications TO authenticated;
GRANT UPDATE (read_at) ON public.player_notifications TO authenticated;
GRANT INSERT ON public.player_notifications TO authenticated;

DROP POLICY IF EXISTS ticker_notice_public_read ON public.website_settings;
CREATE POLICY ticker_notice_public_read ON public.website_settings
  FOR SELECT TO anon, authenticated USING (key IN ('ticker_notice','platform_rules'));
INSERT INTO public.website_settings(key, value, description)
VALUES ('ticker_notice', 'যেকোনো প্রয়োজনে অ্যাডমিনকে ইনবক্স করুন, সমাধান পাবেন ইনশাআল্লাহ।', 'Public scrolling notice shown in the mobile app')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.website_settings(key, value, description)
VALUES ('platform_rules', 'Play fairly. Do not use hacks, cheats, emulators or teaming. Follow tournament room instructions. Admin decisions after result review are final.', 'Public platform rules displayed in the mobile app')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.register_for_tournament(
  p_tournament_id uuid,
  p_display_name text,
  p_team_name text DEFAULT NULL,
  p_game_uid text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_tournament public.tournaments%ROWTYPE;
  v_participant_id uuid;
  v_balance bigint;
  v_amount bigint;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(trim(coalesce(p_display_name, ''))) < 2 THEN RAISE EXCEPTION 'Player name is required'; END IF;

  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_tournament.status <> 'upcoming' THEN RAISE EXCEPTION 'Registration is not open'; END IF;
  IF v_tournament.slots_filled >= v_tournament.slots THEN RAISE EXCEPTION 'Tournament is full'; END IF;
  IF EXISTS (SELECT 1 FROM public.tournament_participants WHERE tournament_id = p_tournament_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'You are already registered for this tournament';
  END IF;

  v_amount := v_tournament.entry_fee::bigint * 100;
  IF v_amount > 0 THEN
    INSERT INTO public.wallet_accounts(user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.wallet_accounts
      SET balance_paisa = balance_paisa - v_amount, updated_at = now()
      WHERE user_id = v_user_id AND balance_paisa >= v_amount
      RETURNING balance_paisa INTO v_balance;
    IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient wallet balance. Add money first.'; END IF;
  END IF;

  INSERT INTO public.tournament_participants(tournament_id, user_id, display_name, team_name, game_uid, slot_number, status)
  VALUES (p_tournament_id, v_user_id, trim(p_display_name), nullif(trim(coalesce(p_team_name,'')), ''),
    nullif(trim(coalesce(p_game_uid,'')), ''), v_tournament.slots_filled + 1, 'confirmed')
  RETURNING id INTO v_participant_id;

  UPDATE public.tournaments SET slots_filled = slots_filled + 1 WHERE id = p_tournament_id;

  IF v_amount > 0 THEN
    INSERT INTO public.wallet_transactions(user_id, transaction_type, direction, amount_paisa, status, reference_id, idempotency_key, description)
    VALUES (v_user_id, 'entry_fee', 'debit', v_amount, 'completed', v_participant_id,
      'entry-fee:' || v_participant_id::text, 'Tournament entry fee');
  END IF;
  RETURN v_participant_id;
END;
$$;
REVOKE ALL ON FUNCTION public.register_for_tournament(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_for_tournament(uuid,text,text,text) TO authenticated;


CREATE OR REPLACE FUNCTION public.get_my_tournament_room(p_tournament_id uuid)
RETURNS TABLE(room_id text, room_password text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $
DECLARE
  v_user_id uuid := auth.uid();
  v_start_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT t.start_at INTO v_start_at
    FROM public.tournaments t
    JOIN public.tournament_participants p ON p.tournament_id = t.id
    WHERE t.id = p_tournament_id
      AND p.user_id = v_user_id
      AND p.status = 'confirmed'
      AND t.status <> 'ended'
      AND now() <= t.start_at + interval '6 hours';
  IF NOT FOUND THEN RAISE EXCEPTION 'You are not registered for this tournament'; END IF;
  IF v_start_at > now() + interval '10 minutes' THEN
    RAISE EXCEPTION 'Room details unlock 10 minutes before match start';
  END IF;
  RETURN QUERY
    SELECT c.room_id, c.room_password
    FROM public.tournament_room_credentials c
    WHERE c.tournament_id = p_tournament_id;
END;
$;
REVOKE ALL ON FUNCTION public.get_my_tournament_room(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_tournament_room(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
