-- Enforce AAL2 for database-level administrator access.
-- Preserve player-owned access and pre-MFA admin membership lookup.

BEGIN;

-- 1. AAL2-aware administrator helper.
CREATE OR REPLACE FUNCTION public.is_admin_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.is_admin()
     AND coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$function$;

REVOKE ALL ON FUNCTION public.is_admin_aal2() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_aal2() TO authenticated;

-- 2. Replace administrator checks in existing RLS policies.
-- Keep the admins membership-read policy unchanged for the MFA login flow.
DO $migration$
DECLARE
  v_policy record;
  v_roles text;
  v_qual text;
  v_with_check text;
  v_sql text;
BEGIN
  FOR v_policy IN
    SELECT schemaname, tablename, policyname, permissive,
           roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND NOT (
        tablename = 'admins'
        AND policyname = 'admins_select_for_admins'
      )
      AND (
        coalesce(qual, '') ~* '(^|[^[:alnum:]_])((public[.])?is_admin)[[:space:]]*\([[:space:]]*\)'
        OR
        coalesce(with_check, '') ~* '(^|[^[:alnum:]_])((public[.])?is_admin)[[:space:]]*\([[:space:]]*\)'
      )
  LOOP
    SELECT string_agg(
      CASE
        WHEN role_name = 'public' THEN 'PUBLIC'
        ELSE quote_ident(role_name)
      END,
      ', '
    )
    INTO v_roles
    FROM unnest(v_policy.roles) AS role_item(role_name);

    v_qual := CASE
      WHEN v_policy.qual IS NULL THEN NULL
      ELSE regexp_replace(
        v_policy.qual,
        '((public[.])?is_admin)[[:space:]]*\([[:space:]]*\)',
        'public.is_admin_aal2()',
        'gi'
      )
    END;

    v_with_check := CASE
      WHEN v_policy.with_check IS NULL THEN NULL
      ELSE regexp_replace(
        v_policy.with_check,
        '((public[.])?is_admin)[[:space:]]*\([[:space:]]*\)',
        'public.is_admin_aal2()',
        'gi'
      )
    END;

    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );

    v_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename,
      v_policy.permissive,
      v_policy.cmd,
      v_roles
    );

    IF v_qual IS NOT NULL THEN
      v_sql := v_sql || format(' USING (%s)', v_qual);
    END IF;

    IF v_with_check IS NOT NULL THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_with_check);
    END IF;

    EXECUTE v_sql;
  END LOOP;
END;
$migration$;

-- 3. Wallet deposit review.
CREATE OR REPLACE FUNCTION public.admin_review_wallet_deposit(
  p_request_id uuid,
  p_approve boolean,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_request public.wallet_deposit_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin_aal2() THEN
    RAISE EXCEPTION 'Elevated administrator access required';
  END IF;

  SELECT * INTO v_request
  FROM public.wallet_deposit_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Deposit request has already been reviewed';
  END IF;

  IF p_approve THEN
    INSERT INTO public.wallet_accounts(user_id)
    VALUES (v_request.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.wallet_accounts
    SET balance_paisa = balance_paisa + v_request.amount_paisa,
        updated_at = now()
    WHERE user_id = v_request.user_id;

    UPDATE public.wallet_transactions
    SET status = 'completed',
        description = 'Deposit approved by admin'
    WHERE id = v_request.transaction_id
      AND status = 'pending';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pending deposit ledger entry not found';
    END IF;

    UPDATE public.wallet_deposit_requests
    SET status = 'approved',
        admin_note = p_note,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = p_request_id;
  ELSE
    UPDATE public.wallet_transactions
    SET status = 'rejected',
        description = 'Deposit rejected by admin'
    WHERE id = v_request.transaction_id
      AND status = 'pending';

    UPDATE public.wallet_deposit_requests
    SET status = 'rejected',
        admin_note = p_note,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = p_request_id;
  END IF;
END;
$function$;

-- 4. Wallet withdrawal review.
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

    UPDATE public.wallet_accounts
    SET balance_paisa = balance_paisa + v_request.amount_paisa,
        updated_at = now()
    WHERE user_id = v_request.user_id;

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
    ON CONFLICT (user_id, idempotency_key) DO NOTHING;

    UPDATE public.wallet_withdrawal_requests
    SET status = 'rejected',
        admin_note = p_note,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = p_request_id;
  END IF;
END;
$function$;

-- 5. Direct tournament payment review.
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
  v_payment public.tournament_payments%ROWTYPE;
BEGIN
  IF NOT public.is_admin_aal2() THEN
    RAISE EXCEPTION 'Elevated administrator access required';
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

  IF p_approve THEN
    UPDATE public.tournament_payments
    SET status = 'approved',
        note = coalesce(p_note, note)
    WHERE id = p_payment_id;

    IF v_payment.participant_id IS NOT NULL THEN
      UPDATE public.tournament_participants
      SET status = 'confirmed'
      WHERE id = v_payment.participant_id;
    END IF;
  ELSE
    UPDATE public.tournament_payments
    SET status = 'rejected',
        note = coalesce(p_note, note)
    WHERE id = p_payment_id;

    IF v_payment.participant_id IS NOT NULL THEN
      UPDATE public.tournament_participants
      SET status = 'rejected'
      WHERE id = v_payment.participant_id;

      UPDATE public.tournaments
      SET slots_filled = greatest(0, slots_filled - 1)
      WHERE id = v_payment.tournament_id;
    END IF;
  END IF;
END;
$function$;

-- Preserve the existing authenticated RPC grants.
REVOKE ALL ON FUNCTION public.admin_review_wallet_deposit(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_review_wallet_withdrawal(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_review_tournament_payment(uuid, boolean, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_review_wallet_deposit(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_wallet_withdrawal(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_tournament_payment(uuid, boolean, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
