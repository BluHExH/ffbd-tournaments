BEGIN;

DROP POLICY IF EXISTS tournament_results_public_read
  ON public.tournament_results;

DROP POLICY IF EXISTS tournament_results_own_read
  ON public.tournament_results;

CREATE POLICY tournament_results_own_read
  ON public.tournament_results
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE SELECT ON TABLE public.tournament_results
  FROM PUBLIC, anon, authenticated;

REVOKE SELECT (
  id, tournament_id, participant_name, team_name,
  rank, kills, points, prize_amount, created_at, user_id
)
ON TABLE public.tournament_results
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id, tournament_id, participant_name, team_name,
  rank, kills, points, prize_amount, created_at, user_id
)
ON TABLE public.tournament_results
TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_tournament_results(
  p_tournament_id uuid
)
RETURNS TABLE (
  id uuid,
  tournament_id uuid,
  participant_name text,
  team_name text,
  rank integer,
  kills integer,
  points integer,
  prize_amount integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    r.id,
    r.tournament_id,
    r.participant_name,
    r.team_name,
    r.rank,
    r.kills,
    r.points,
    r.prize_amount
  FROM public.tournament_results AS r
  WHERE r.tournament_id = p_tournament_id
  ORDER BY r.rank ASC, r.created_at ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_public_tournament_results(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_tournament_results(uuid)
  TO anon, authenticated;

COMMIT;