-- Link results only when a single registered player name matches.
-- Matching by team name could incorrectly award a full squad's stats to its first member.
CREATE OR REPLACE FUNCTION public.link_result_to_registered_player()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT p.user_id INTO NEW.user_id
    FROM public.tournament_participants p
    WHERE p.tournament_id = NEW.tournament_id
      AND p.user_id IS NOT NULL
      AND lower(trim(p.display_name)) = lower(trim(coalesce(NEW.participant_name, '')))
      AND (
        SELECT count(*)
        FROM public.tournament_participants p2
        WHERE p2.tournament_id = NEW.tournament_id
          AND p2.user_id IS NOT NULL
          AND lower(trim(p2.display_name)) = lower(trim(coalesce(NEW.participant_name, '')))
      ) = 1
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Safely backfill only unique player-name matches; ambiguous/team rows remain unlinked.
UPDATE public.tournament_results r
SET user_id = p.user_id
FROM public.tournament_participants p
WHERE r.user_id IS NULL
  AND p.tournament_id = r.tournament_id
  AND p.user_id IS NOT NULL
  AND lower(trim(p.display_name)) = lower(trim(coalesce(r.participant_name, '')))
  AND (
    SELECT count(*)
    FROM public.tournament_participants p2
    WHERE p2.tournament_id = r.tournament_id
      AND p2.user_id IS NOT NULL
      AND lower(trim(p2.display_name)) = lower(trim(coalesce(r.participant_name, '')))
  ) = 1;

NOTIFY pgrst, 'reload schema';
