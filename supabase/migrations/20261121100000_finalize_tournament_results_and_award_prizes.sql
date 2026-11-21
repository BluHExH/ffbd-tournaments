-- Secure, atomic tournament result finalization and captain wallet awards.
BEGIN;

ALTER TABLE public.tournament_results
  ADD COLUMN IF NOT EXISTS participant_id uuid
    REFERENCES public.tournament_participants(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS finalized_at timestamptz,
  ADD COLUMN IF NOT EXISTS finalized_by uuid REFERENCES auth.users(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_results'::regclass
      AND conname = 'tournament_results_tournament_participant_unique'
  ) THEN
    ALTER TABLE public.tournament_results
      ADD CONSTRAINT tournament_results_tournament_participant_unique
      UNIQUE (tournament_id, participant_id);
  END IF;
END;
$$;

GRANT SELECT (participant_id, finalized_at, finalized_by)
  ON public.tournament_results TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_finalize_tournament_results(
  p_tournament_id uuid,
  p_results jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_item jsonb;
  v_participant public.tournament_participants%ROWTYPE;
  v_result_id uuid;
  v_ledger_id uuid;
  v_rank integer;
  v_kills integer;
  v_points integer;
  v_prize integer;
  v_awarded integer := 0;
  v_rows integer := 0;
  v_seen uuid[] := ARRAY[]::uuid[];
BEGIN
  IF NOT public.is_admin_aal2() THEN
    RAISE EXCEPTION 'Elevated administrator access required';
  END IF;
  IF p_tournament_id IS NULL OR jsonb_typeof(p_results) <> 'array'
     OR jsonb_array_length(p_results) = 0 THEN
    RAISE EXCEPTION 'Select a tournament and add at least one result';
  END IF;

  PERFORM 1 FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.tournament_results
    WHERE tournament_id = p_tournament_id AND finalized_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Results for this tournament have already been finalized';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_results)
  LOOP
    IF nullif(v_item->>'participant_id','') IS NULL THEN
      RAISE EXCEPTION 'Every result must be linked to a registered captain';
    END IF;
    IF (v_item->>'participant_id')::uuid = ANY(v_seen) THEN
      RAISE EXCEPTION 'A participant cannot appear more than once';
    END IF;
    v_seen := array_append(v_seen, (v_item->>'participant_id')::uuid);

    v_rank := coalesce((v_item->>'rank')::integer, 0);
    v_kills := coalesce((v_item->>'kills')::integer, 0);
    v_points := coalesce((v_item->>'points')::integer, 0);
    v_prize := coalesce((v_item->>'prize_amount')::integer, 0);
    IF v_rank < 1 OR v_kills < 0 OR v_points < 0 OR v_prize < 0 THEN
      RAISE EXCEPTION 'Rank must be positive; kills, points and prize cannot be negative';
    END IF;

    SELECT * INTO v_participant
    FROM public.tournament_participants
    WHERE id = (v_item->>'participant_id')::uuid
      AND tournament_id = p_tournament_id
      AND status IN ('registered','confirmed')
      AND user_id IS NOT NULL
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A selected captain is not registered, confirmed, or linked to an account';
    END IF;

    INSERT INTO public.tournament_results(
      tournament_id, participant_name, team_name, user_id,
      participant_id, rank, kills, points, prize_amount,
      finalized_at, finalized_by
    ) VALUES (
      p_tournament_id, v_participant.display_name, v_participant.team_name,
      v_participant.user_id, v_participant.id, v_rank, v_kills, v_points,
      v_prize, now(), auth.uid()
    )
    RETURNING id INTO v_result_id;

    v_rows := v_rows + 1;

    IF v_prize > 0 THEN
      INSERT INTO public.wallet_accounts(user_id)
      VALUES (v_participant.user_id)
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO public.wallet_transactions(
        user_id, transaction_type, direction, amount_paisa, status,
        reference_id, idempotency_key, description, metadata
      ) VALUES (
        v_participant.user_id, 'prize', 'credit', v_prize::bigint * 100,
        'completed', v_result_id, 'tournament-prize:' || v_result_id::text,
        'Tournament prize · ' || v_participant.display_name || ' · Rank ' || v_rank,
        jsonb_build_object(
          'tournament_id', p_tournament_id,
          'participant_id', v_participant.id,
          'rank', v_rank,
          'prize_bdt', v_prize,
          'recipient_role', 'registered_captain'
        )
      )
      ON CONFLICT (user_id, idempotency_key) DO NOTHING
      RETURNING id INTO v_ledger_id;

      IF v_ledger_id IS NOT NULL THEN
        UPDATE public.wallet_accounts
        SET balance_paisa = balance_paisa + (v_prize::bigint * 100),
            updated_at = now()
        WHERE user_id = v_participant.user_id;
        v_awarded := v_awarded + 1;
      END IF;
      v_ledger_id := NULL;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'tournament_id', p_tournament_id,
    'results_saved', v_rows,
    'wallet_awards', v_awarded,
    'status', 'finalized'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_finalize_tournament_results(uuid,jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_finalize_tournament_results(uuid,jsonb)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
