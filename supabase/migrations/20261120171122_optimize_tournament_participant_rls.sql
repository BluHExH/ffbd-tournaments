BEGIN;

DROP POLICY IF EXISTS tournament_participants_own_read
  ON public.tournament_participants;

CREATE POLICY tournament_participants_own_read
  ON public.tournament_participants
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

COMMIT;