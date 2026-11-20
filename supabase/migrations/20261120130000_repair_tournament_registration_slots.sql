BEGIN;

-- Preserve pre-existing occupied slots that have no participant rows.
DO $legacy_slots$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tournaments'
      AND column_name = 'legacy_slots_filled'
  ) THEN
    ALTER TABLE public.tournaments
      ADD COLUMN legacy_slots_filled integer NOT NULL DEFAULT 0
      CHECK (legacy_slots_filled >= 0);

    UPDATE public.tournaments AS t
    SET legacy_slots_filled = GREATEST(
      COALESCE(t.slots_filled, 0) - (
        SELECT count(*)::integer
        FROM public.tournament_participants AS p
        WHERE p.tournament_id = t.id
          AND p.status IN ('registered', 'confirmed')
      ),
      0
    );
  END IF;
END;
$legacy_slots$;
-- Stop safely if existing active duplicate registrations need manual repair.
DO $duplicate_check$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.tournament_participants
    WHERE user_id IS NOT NULL
      AND status IN ('registered', 'confirmed')
    GROUP BY tournament_id, user_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate active tournament registrations exist. Repair them before applying this migration.';
  END IF;
END;
$duplicate_check$;

-- Keep historical registrations, but allow re-registration after inactivity.
DROP INDEX IF EXISTS public.tournament_participants_user_unique;
DROP INDEX IF EXISTS public.tournament_participants_active_user_unique;

CREATE UNIQUE INDEX tournament_participants_active_user_unique
ON public.tournament_participants(tournament_id, user_id)
WHERE user_id IS NOT NULL
  AND status IN ('registered', 'confirmed');

-- Only active registrations consume tournament slots.
CREATE OR REPLACE FUNCTION public.resequence_tournament_participants(
  p_tournament_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_active_count integer;
  v_legacy_count integer;
  v_total_count integer;
  v_capacity integer;
BEGIN
  SELECT slots, COALESCE(legacy_slots_filled, 0)
  INTO v_capacity, v_legacy_count
  FROM public.tournaments
  WHERE id = p_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  SELECT count(*)::integer INTO v_active_count
  FROM public.tournament_participants
  WHERE tournament_id = p_tournament_id
    AND status IN ('registered', 'confirmed');

  v_total_count := v_legacy_count + v_active_count;

  IF v_total_count > v_capacity THEN
    RAISE EXCEPTION
      'Occupied slots (%) exceed tournament capacity (%)',
      v_total_count, v_capacity;
  END IF;

  WITH ranked AS (
    SELECT id,
      (v_legacy_count + row_number() OVER (
        ORDER BY created_at, id
      ))::integer AS new_slot
    FROM public.tournament_participants
    WHERE tournament_id = p_tournament_id
      AND status IN ('registered', 'confirmed')
  )
  UPDATE public.tournament_participants AS participant
  SET slot_number = ranked.new_slot
  FROM ranked
  WHERE participant.id = ranked.id;

  UPDATE public.tournament_participants
  SET slot_number = NULL
  WHERE tournament_id = p_tournament_id
    AND status NOT IN ('registered', 'confirmed');

  UPDATE public.tournaments
  SET slots_filled = v_total_count
  WHERE id = p_tournament_id;

  RETURN v_total_count;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.resequence_tournament_participants(uuid)
FROM PUBLIC, anon, authenticated;

-- Wallet registration: lock tournament, reconcile count, then allocate.
CREATE OR REPLACE FUNCTION public.register_for_tournament(
  p_tournament_id uuid,
  p_display_name text,
  p_team_name text DEFAULT NULL,
  p_game_uid text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_tournament public.tournaments%ROWTYPE;
  v_participant_id uuid;
  v_balance bigint;
  v_amount bigint;
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF length(trim(coalesce(p_display_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Player name is required';
  END IF;

  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = p_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  IF v_tournament.status <> 'upcoming' THEN
    RAISE EXCEPTION 'Registration is not open';
  END IF;

  v_count := public.resequence_tournament_participants(p_tournament_id);

  IF v_count >= v_tournament.slots THEN
    RAISE EXCEPTION 'Tournament is full';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.tournament_participants
    WHERE tournament_id = p_tournament_id
      AND user_id = v_user_id
      AND status IN ('registered', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'You are already registered for this tournament';
  END IF;

  v_amount := round(v_tournament.entry_fee * 100)::bigint;

  IF v_amount > 0 THEN
    INSERT INTO public.wallet_accounts(user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.wallet_accounts
    SET balance_paisa = balance_paisa - v_amount,
        updated_at = now()
    WHERE user_id = v_user_id
      AND balance_paisa >= v_amount
    RETURNING balance_paisa INTO v_balance;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient wallet balance. Add money first.';
    END IF;
  END IF;

  INSERT INTO public.tournament_participants(
    tournament_id, user_id, display_name, team_name,
    game_uid, slot_number, status
  )
  VALUES (
    p_tournament_id, v_user_id, trim(p_display_name),
    nullif(trim(coalesce(p_team_name, '')), ''),
    nullif(trim(coalesce(p_game_uid, '')), ''),
    v_count + 1, 'confirmed'
  )
  RETURNING id INTO v_participant_id;

  IF v_amount > 0 THEN
    INSERT INTO public.wallet_transactions(
      user_id, transaction_type, direction, amount_paisa,
      status, reference_id, idempotency_key, description
    )
    VALUES (
      v_user_id, 'entry_fee', 'debit', v_amount,
      'completed', v_participant_id,
      'entry-fee:' || v_participant_id::text,
      'Tournament entry fee'
    );
  END IF;

  PERFORM public.resequence_tournament_participants(p_tournament_id);

  RETURN v_participant_id;
END;
$function$;

-- Direct mobile-money registration.
CREATE OR REPLACE FUNCTION public.submit_direct_tournament_payment(
  p_tournament_id uuid,
  p_display_name text,
  p_team_name text,
  p_game_uid text,
  p_payment_method text,
  p_sender_number text,
  p_transaction_reference text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_tournament public.tournaments%ROWTYPE;
  v_participant_id uuid;
  v_payment_id uuid;
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF length(trim(coalesce(p_display_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Player name is required';
  END IF;

  IF p_payment_method IS NULL OR p_payment_method NOT IN ('bKash', 'Nagad', 'Rocket') THEN
    RAISE EXCEPTION 'Unsupported payment method';
  END IF;

  IF length(trim(coalesce(p_sender_number, ''))) < 8
     OR length(trim(coalesce(p_transaction_reference, ''))) < 4 THEN
    RAISE EXCEPTION 'Sender number and transaction reference are required';
  END IF;

  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = p_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  IF v_tournament.status <> 'upcoming' THEN
    RAISE EXCEPTION 'Registration is not open';
  END IF;

  IF v_tournament.entry_fee <= 0 THEN
    RAISE EXCEPTION 'This tournament does not require a payment';
  END IF;

  v_count := public.resequence_tournament_participants(p_tournament_id);

  IF v_count >= v_tournament.slots THEN
    RAISE EXCEPTION 'Tournament is full';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.tournament_participants
    WHERE tournament_id = p_tournament_id
      AND user_id = v_user_id
      AND status IN ('registered', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'You are already registered for this tournament';
  END IF;

  INSERT INTO public.tournament_participants(
    tournament_id, user_id, display_name, team_name,
    game_uid, slot_number, status
  )
  VALUES (
    p_tournament_id, v_user_id, trim(p_display_name),
    nullif(trim(coalesce(p_team_name, '')), ''),
    nullif(trim(coalesce(p_game_uid, '')), ''),
    v_count + 1, 'registered'
  )
  RETURNING id INTO v_participant_id;

  INSERT INTO public.tournament_payments(
    tournament_id, participant_name, amount, method,
    transaction_id, sender_number, status, note,
    user_id, participant_id
  )
  VALUES (
    p_tournament_id, trim(p_display_name), v_tournament.entry_fee,
    p_payment_method, trim(p_transaction_reference),
    trim(p_sender_number), 'pending',
    'Direct mobile payment awaiting admin verification',
    v_user_id, v_participant_id
  )
  RETURNING id INTO v_payment_id;

  PERFORM public.resequence_tournament_participants(p_tournament_id);

  RETURN v_payment_id;
END;
$function$;

-- Payment review: serialize all decisions for a tournament and retain AAL2.
CREATE OR REPLACE FUNCTION public.admin_review_tournament_payment(
  p_payment_id uuid,
  p_approve boolean,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_tournament_id uuid;
  v_payment public.tournament_payments%ROWTYPE;
  v_updated_count integer;
BEGIN
  IF NOT public.is_admin_aal2() THEN
    RAISE EXCEPTION 'Elevated administrator access required';
  END IF;

  IF p_approve IS NULL THEN
    RAISE EXCEPTION 'Payment decision is required';
  END IF;

  SELECT tournament_id INTO v_tournament_id
  FROM public.tournament_payments
  WHERE id = p_payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found';
  END IF;

  PERFORM 1
  FROM public.tournaments
  WHERE id = v_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  SELECT * INTO v_payment
  FROM public.tournament_payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found';
  END IF;

  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment request has already been reviewed';
  END IF;

  IF v_payment.participant_id IS NOT NULL THEN
    IF p_approve THEN
      UPDATE public.tournament_participants
      SET status = 'confirmed'
      WHERE id = v_payment.participant_id
        AND tournament_id = v_tournament_id
        AND status = 'registered';
    ELSE
      UPDATE public.tournament_participants
      SET status = 'rejected'
      WHERE id = v_payment.participant_id
        AND tournament_id = v_tournament_id
        AND status = 'registered';
    END IF;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count <> 1 THEN
      RAISE EXCEPTION
        'The linked participant is missing or is no longer awaiting payment review';
    END IF;
  END IF;

  UPDATE public.tournament_payments
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      note = coalesce(p_note, note)
  WHERE id = p_payment_id;

  PERFORM public.resequence_tournament_participants(v_tournament_id);
END;
$function$;

-- AAL2-protected website Admin registration management.
-- Manual registrations do not debit a player wallet.
CREATE OR REPLACE FUNCTION public.admin_create_tournament_registration(
  p_tournament_id uuid,
  p_display_name text,
  p_team_name text DEFAULT NULL,
  p_game_uid text DEFAULT NULL,
  p_status text DEFAULT 'registered'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_count integer;
  v_capacity integer;
  v_participant_id uuid;
BEGIN
  IF NOT public.is_admin_aal2() THEN
    RAISE EXCEPTION 'Elevated administrator access required';
  END IF;

  IF length(trim(coalesce(p_display_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Player name is required';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('registered', 'confirmed') THEN
    RAISE EXCEPTION 'Invalid initial registration status';
  END IF;

  SELECT slots INTO v_capacity
  FROM public.tournaments
  WHERE id = p_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  v_count := public.resequence_tournament_participants(p_tournament_id);

  IF v_count >= v_capacity THEN
    RAISE EXCEPTION 'Tournament is full';
  END IF;

  INSERT INTO public.tournament_participants(
    tournament_id, user_id, display_name, team_name,
    game_uid, slot_number, status
  )
  VALUES (
    p_tournament_id, NULL, trim(p_display_name),
    nullif(trim(coalesce(p_team_name, '')), ''),
    nullif(trim(coalesce(p_game_uid, '')), ''),
    v_count + 1, p_status
  )
  RETURNING id INTO v_participant_id;

  PERFORM public.resequence_tournament_participants(p_tournament_id);

  RETURN v_participant_id;
END;
$function$;

-- Admin can edit player details only; slot and status are database-managed.
CREATE OR REPLACE FUNCTION public.admin_update_tournament_participant(
  p_participant_id uuid,
  p_display_name text,
  p_team_name text DEFAULT NULL,
  p_game_uid text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_tournament_id uuid;
BEGIN
  IF NOT public.is_admin_aal2() THEN
    RAISE EXCEPTION 'Elevated administrator access required';
  END IF;

  IF length(trim(coalesce(p_display_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Player name is required';
  END IF;

  SELECT tournament_id INTO v_tournament_id
  FROM public.tournament_participants
  WHERE id = p_participant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found';
  END IF;

  PERFORM 1
  FROM public.tournaments
  WHERE id = v_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  PERFORM 1
  FROM public.tournament_participants
  WHERE id = p_participant_id
    AND tournament_id = v_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found';
  END IF;

  UPDATE public.tournament_participants
  SET display_name = trim(p_display_name),
      team_name = nullif(trim(coalesce(p_team_name, '')), ''),
      game_uid = nullif(trim(coalesce(p_game_uid, '')), '')
  WHERE id = p_participant_id;
END;
$function$;

-- Deactivate a registration, release its slot, and refund wallet entry fees
-- exactly once. Direct mobile-money payments are never credited to the wallet.
CREATE OR REPLACE FUNCTION public.admin_deactivate_tournament_participant(
  p_participant_id uuid,
  p_status text,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_tournament_id uuid;
  v_participant public.tournament_participants%ROWTYPE;
  v_entry_fee_count integer;
  v_entry_fee_amount bigint;
  v_refund_transaction_id uuid;
BEGIN
  IF NOT public.is_admin_aal2() THEN
    RAISE EXCEPTION 'Elevated administrator access required';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('rejected', 'cancelled') THEN
    RAISE EXCEPTION 'Only rejected or cancelled status is allowed';
  END IF;

  SELECT tournament_id INTO v_tournament_id
  FROM public.tournament_participants
  WHERE id = p_participant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found';
  END IF;

  PERFORM 1
  FROM public.tournaments
  WHERE id = v_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  SELECT * INTO v_participant
  FROM public.tournament_participants
  WHERE id = p_participant_id
    AND tournament_id = v_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found';
  END IF;

  IF v_participant.status NOT IN ('registered', 'confirmed') THEN
    RAISE EXCEPTION 'Participant is not actively registered';
  END IF;

  -- Refund only a completed wallet entry-fee debit linked to this participant.
  IF v_participant.user_id IS NOT NULL THEN
    SELECT count(*)::integer, COALESCE(sum(amount_paisa), 0)::bigint
    INTO v_entry_fee_count, v_entry_fee_amount
    FROM public.wallet_transactions
    WHERE user_id = v_participant.user_id
      AND reference_id = p_participant_id
      AND transaction_type = 'entry_fee'
      AND direction = 'debit'
      AND status = 'completed';

    IF v_entry_fee_count > 1 THEN
      RAISE EXCEPTION 'Multiple entry-fee debits found; manual wallet review required';
    END IF;

    IF v_entry_fee_count = 1 THEN
      INSERT INTO public.wallet_transactions(
        user_id, transaction_type, direction, amount_paisa,
        status, reference_id, idempotency_key, description, metadata
      )
      VALUES (
        v_participant.user_id, 'admin_adjustment', 'credit',
        v_entry_fee_amount, 'completed', p_participant_id,
        'entry-fee-refund:' || p_participant_id::text,
        'Tournament entry fee refund',
        jsonb_build_object(
          'reason', 'tournament_registration_deactivated',
          'participant_id', p_participant_id,
          'admin_note', p_note
        )
      )
      ON CONFLICT (user_id, idempotency_key) DO NOTHING
      RETURNING id INTO v_refund_transaction_id;

      -- Credit only when this transaction inserted a new refund ledger row.
      IF v_refund_transaction_id IS NOT NULL THEN
        INSERT INTO public.wallet_accounts(user_id)
        VALUES (v_participant.user_id)
        ON CONFLICT (user_id) DO NOTHING;

        UPDATE public.wallet_accounts
        SET balance_paisa = balance_paisa + v_entry_fee_amount,
            updated_at = now()
        WHERE user_id = v_participant.user_id;
      END IF;
    END IF;
  END IF;

  UPDATE public.tournament_participants
  SET status = p_status
  WHERE id = p_participant_id;

  -- Pending direct payments are rejected; approved external payments are
  -- deliberately left unchanged because no external refund is performed here.
  UPDATE public.tournament_payments
  SET status = 'rejected',
      note = coalesce(p_note, note)
  WHERE participant_id = p_participant_id
    AND status = 'pending';

  PERFORM public.resequence_tournament_participants(v_tournament_id);
END;
$function$;

REVOKE ALL ON FUNCTION
  public.admin_create_tournament_registration(uuid, text, text, text, text)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.admin_update_tournament_participant(uuid, text, text, text)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.admin_deactivate_tournament_participant(uuid, text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.admin_create_tournament_registration(uuid, text, text, text, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.admin_update_tournament_participant(uuid, text, text, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.admin_deactivate_tournament_participant(uuid, text, text)
TO authenticated;
REVOKE ALL ON FUNCTION
  public.register_for_tournament(uuid, text, text, text)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.submit_direct_tournament_payment(uuid, text, text, text, text, text, text)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.admin_review_tournament_payment(uuid, boolean, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.register_for_tournament(uuid, text, text, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.submit_direct_tournament_payment(uuid, text, text, text, text, text, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.admin_review_tournament_payment(uuid, boolean, text)
TO authenticated;

-- All participant writes must go through controlled RPCs.
REVOKE INSERT, UPDATE, DELETE
ON TABLE public.tournament_participants
FROM anon, authenticated;

-- Repair withdrawal refund idempotency.
CREATE OR REPLACE FUNCTION public.admin_review_wallet_withdrawal(
  p_request_id uuid,
  p_approve boolean,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_request public.wallet_withdrawal_requests%ROWTYPE;
  v_refund_transaction_id uuid;
BEGIN
  IF NOT public.is_admin_aal2() THEN
    RAISE EXCEPTION 'Elevated administrator access required';
  END IF;

  SELECT * INTO v_request
  FROM public.wallet_withdrawal_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request has already been reviewed';
  END IF;

  IF p_approve THEN
    UPDATE public.wallet_transactions
    SET status = 'completed',
        description = 'Withdrawal approved by admin'
    WHERE id = v_request.transaction_id
      AND status = 'pending';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pending withdrawal ledger entry not found';
    END IF;

    UPDATE public.wallet_withdrawal_requests
    SET status = 'approved',
        admin_note = p_note,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = p_request_id;
  ELSE
    UPDATE public.wallet_transactions
    SET status = 'rejected',
        description = 'Withdrawal rejected; funds returned to wallet'
    WHERE id = v_request.transaction_id
      AND status = 'pending';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pending withdrawal ledger entry not found';
    END IF;

    INSERT INTO public.wallet_accounts(user_id)
    VALUES (v_request.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.wallet_transactions(
      user_id, transaction_type, direction, amount_paisa,
      status, reference_id, idempotency_key, description
    )
    VALUES (
      v_request.user_id, 'withdrawal_refund', 'credit',
      v_request.amount_paisa, 'completed',
      p_request_id,
      'withdrawal-refund:' || p_request_id::text,
      'Rejected withdrawal refunded to wallet'
    )
    ON CONFLICT (user_id, idempotency_key) DO NOTHING
    RETURNING id INTO v_refund_transaction_id;

    -- Credit the wallet only when a new refund ledger row was inserted.
    IF v_refund_transaction_id IS NOT NULL THEN
      UPDATE public.wallet_accounts
      SET balance_paisa = balance_paisa + v_request.amount_paisa,
          updated_at = now()
      WHERE user_id = v_request.user_id;
    END IF;

    UPDATE public.wallet_withdrawal_requests
    SET status = 'rejected',
        admin_note = p_note,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = p_request_id;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.admin_review_wallet_withdrawal(uuid, boolean, text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.admin_review_wallet_withdrawal(uuid, boolean, text)
TO authenticated;

-- Restrict raw participant rows to the participant and AAL2 admins.
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournament_participants_public_read
  ON public.tournament_participants;
DROP POLICY IF EXISTS tournament_participants_admin_all
  ON public.tournament_participants;
DROP POLICY IF EXISTS tournament_participants_own_read
  ON public.tournament_participants;
DROP POLICY IF EXISTS tournament_participants_admin_aal2_read
  ON public.tournament_participants;

CREATE POLICY tournament_participants_own_read
  ON public.tournament_participants
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY tournament_participants_admin_aal2_read
  ON public.tournament_participants
  FOR SELECT TO authenticated
  USING (public.is_admin_aal2());

-- Clients may read only approved columns. user_id is available solely
-- for authenticated self-row filtering and is protected by RLS.
REVOKE SELECT ON TABLE public.tournament_participants
  FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  tournament_id,
  display_name,
  team_name,
  game_uid,
  slot_number,
  status,
  created_at,
  user_id
)
ON TABLE public.tournament_participants
TO authenticated;

-- Public roster contains no account identifier and only active entries.
CREATE OR REPLACE FUNCTION public.get_public_tournament_roster(
  p_tournament_id uuid
)
RETURNS TABLE (
  id uuid,
  display_name text,
  team_name text,
  game_uid text,
  slot_number integer,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    p.id,
    p.display_name,
    p.team_name,
    p.game_uid,
    p.slot_number,
    p.status
  FROM public.tournament_participants AS p
  WHERE p.tournament_id = p_tournament_id
    AND p.status IN ('registered', 'confirmed')
  ORDER BY p.slot_number ASC NULLS LAST, p.created_at ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_public_tournament_roster(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_tournament_roster(uuid)
  TO anon, authenticated;
NOTIFY pgrst, 'reload schema';

COMMIT;