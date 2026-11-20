BEGIN;

-- Close direct public access to player profile rows.
DROP POLICY IF EXISTS player_profiles_public_read
  ON public.player_profiles;

DROP POLICY IF EXISTS player_profiles_own_read
  ON public.player_profiles;

CREATE POLICY player_profiles_own_read
  ON public.player_profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Preserve own INSERT/UPDATE and the existing AAL2 admin policy.
REVOKE SELECT ON TABLE public.player_profiles
  FROM PUBLIC, anon, authenticated;

REVOKE SELECT (user_id, username, game_uid, avatar_url, created_at, updated_at)
  ON TABLE public.player_profiles
  FROM PUBLIC, anon, authenticated;

GRANT SELECT (user_id, username, game_uid, avatar_url)
  ON TABLE public.player_profiles
  TO authenticated;

-- Rebuild the public leaderboard without exposing user_id.
-- The view owner is postgres and security_invoker=false, allowing the
-- public aggregate view to read the protected profile table.
DROP VIEW IF EXISTS public.player_leaderboard;

CREATE VIEW public.player_leaderboard
WITH (security_invoker = false)
AS
SELECT
  p.username,
  p.avatar_url,
  count(r.id)::integer AS total_matches,
  count(*) FILTER (WHERE r.rank = 1)::integer AS wins,
  coalesce(sum(r.kills), 0)::bigint AS total_kills,
  coalesce(sum(r.points), 0)::bigint AS total_points,
  coalesce(sum(r.prize_amount), 0)::bigint AS total_earnings
FROM public.player_profiles AS p
LEFT JOIN public.tournament_results AS r
  ON r.user_id = p.user_id
GROUP BY p.user_id, p.username, p.avatar_url;

GRANT SELECT ON public.player_leaderboard TO anon, authenticated;

-- Enforce the same 10-minute unlock window as the secure room RPC.
-- Before unlock, or after the 6-hour post-start window, return no rows.
CREATE OR REPLACE FUNCTION public.get_my_tournament_room_credentials(
  p_tournament_id uuid
)
RETURNS TABLE(room_id text, room_password text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT c.room_id, c.room_password
  FROM public.tournament_room_credentials AS c
  JOIN public.tournaments AS t
    ON t.id = c.tournament_id
  WHERE c.tournament_id = p_tournament_id
    AND c.is_visible = true
    AND (SELECT auth.uid()) IS NOT NULL
    AND t.status <> 'ended'
    AND now() <= t.start_at + interval '6 hours'
    AND t.start_at <= now() + interval '10 minutes'
    AND EXISTS (
      SELECT 1
      FROM public.tournament_participants AS p
      WHERE p.tournament_id = c.tournament_id
        AND p.user_id = (SELECT auth.uid())
        AND p.status = 'confirmed'
    )
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_my_tournament_room_credentials(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_tournament_room_credentials(uuid)
  TO authenticated;

COMMIT;