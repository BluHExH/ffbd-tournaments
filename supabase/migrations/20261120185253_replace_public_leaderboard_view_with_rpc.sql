BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_player_leaderboard()
RETURNS TABLE (
  username text,
  avatar_url text,
  total_matches integer,
  wins integer,
  total_kills bigint,
  total_points bigint,
  total_earnings bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
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
  GROUP BY p.user_id, p.username, p.avatar_url
  ORDER BY
    coalesce(sum(r.points), 0) DESC,
    count(*) FILTER (WHERE r.rank = 1) DESC
  LIMIT 20;
$function$;

REVOKE ALL ON FUNCTION public.get_public_player_leaderboard()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_player_leaderboard()
  TO anon, authenticated;

-- Remove the SECURITY DEFINER view after the replacement RPC exists.
DROP VIEW IF EXISTS public.player_leaderboard;

COMMIT;