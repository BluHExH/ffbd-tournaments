-- Secure player wallet foundation for BANGLAR TOURNAMENTS.
-- All balance changes are performed by SECURITY DEFINER RPCs; clients cannot
-- directly insert ledger rows or update wallet balances.
-- Manual payment verification only: this migration does not claim gateway integration.

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_paisa bigint NOT NULL DEFAULT 0 CHECK (balance_paisa >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit','withdrawal','withdrawal_refund','entry_fee','prize','admin_adjustment')),
  direction text NOT NULL CHECK (direction IN ('credit','debit')),
  amount_paisa bigint NOT NULL CHECK (amount_paisa > 0),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','rejected','failed')),
  reference_id uuid,
  idempotency_key text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS wallet_transactions_user_created_idx
  ON public.wallet_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.wallet_deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paisa bigint NOT NULL CHECK (amount_paisa > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('bKash','Nagad','Rocket')),
  sender_number text NOT NULL,
  transaction_reference text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  transaction_id uuid REFERENCES public.wallet_transactions(id),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_deposit_requests_user_created_idx
  ON public.wallet_deposit_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_deposit_requests_status_idx
  ON public.wallet_deposit_requests(status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS wallet_deposit_payment_reference_unique
  ON public.wallet_deposit_requests(payment_method, transaction_reference);

CREATE TABLE IF NOT EXISTS public.wallet_withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paisa bigint NOT NULL CHECK (amount_paisa >= 10000),
  payment_method text NOT NULL CHECK (payment_method IN ('bKash','Nagad','Rocket')),
  recipient_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  transaction_id uuid NOT NULL REFERENCES public.wallet_transactions(id),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_withdrawal_requests_user_created_idx
  ON public.wallet_withdrawal_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_withdrawal_requests_status_idx
  ON public.wallet_withdrawal_requests(status, created_at);

ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wallet_accounts_select_own ON public.wallet_accounts;
CREATE POLICY wallet_accounts_select_own ON public.wallet_accounts
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS wallet_transactions_select_own ON public.wallet_transactions;
CREATE POLICY wallet_transactions_select_own ON public.wallet_transactions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS wallet_deposit_requests_select_own ON public.wallet_deposit_requests;
CREATE POLICY wallet_deposit_requests_select_own ON public.wallet_deposit_requests
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS wallet_withdrawal_requests_select_own ON public.wallet_withdrawal_requests;
CREATE POLICY wallet_withdrawal_requests_select_own ON public.wallet_withdrawal_requests
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());

GRANT SELECT ON public.wallet_accounts, public.wallet_transactions,
  public.wallet_deposit_requests, public.wallet_withdrawal_requests TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.wallet_accounts,
  public.wallet_transactions, public.wallet_deposit_requests,
  public.wallet_withdrawal_requests FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_wallet_deposit(
  p_amount_paisa bigint,
  p_payment_method text,
  p_sender_number text,
  p_transaction_reference text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_request_id uuid;
  v_transaction_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount_paisa <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF p_payment_method NOT IN ('bKash','Nagad','Rocket') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
  IF length(trim(p_sender_number)) < 8 OR length(trim(p_transaction_reference)) < 4 THEN
    RAISE EXCEPTION 'Sender number and transaction reference are required';
  END IF;

  INSERT INTO public.wallet_deposit_requests(user_id, amount_paisa, payment_method, sender_number, transaction_reference)
  VALUES (v_user_id, p_amount_paisa, p_payment_method, trim(p_sender_number), trim(p_transaction_reference))
  RETURNING id INTO v_request_id;

  INSERT INTO public.wallet_transactions(user_id, transaction_type, direction, amount_paisa, status, reference_id, idempotency_key, description)
  VALUES (v_user_id, 'deposit', 'credit', p_amount_paisa, 'pending', v_request_id, 'deposit-request:' || v_request_id::text, 'Wallet deposit awaiting admin verification')
  RETURNING id INTO v_transaction_id;

  UPDATE public.wallet_deposit_requests SET transaction_id = v_transaction_id WHERE id = v_request_id;
  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_wallet_withdrawal(
  p_amount_paisa bigint,
  p_payment_method text,
  p_recipient_number text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_request_id uuid;
  v_transaction_id uuid;
  v_balance bigint;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount_paisa < 10000 THEN RAISE EXCEPTION 'Minimum withdrawal is ৳100'; END IF;
  IF p_payment_method NOT IN ('bKash','Nagad','Rocket') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
  IF length(trim(p_recipient_number)) < 8 THEN RAISE EXCEPTION 'Valid recipient number is required'; END IF;

  INSERT INTO public.wallet_accounts(user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallet_accounts
    SET balance_paisa = balance_paisa - p_amount_paisa, updated_at = now()
    WHERE user_id = v_user_id AND balance_paisa >= p_amount_paisa
    RETURNING balance_paisa INTO v_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  INSERT INTO public.wallet_withdrawal_requests(user_id, amount_paisa, payment_method, recipient_number, status, transaction_id)
  VALUES (v_user_id, p_amount_paisa, p_payment_method, trim(p_recipient_number), 'pending', gen_random_uuid())
  RETURNING id, transaction_id INTO v_request_id, v_transaction_id;

  INSERT INTO public.wallet_transactions(id, user_id, transaction_type, direction, amount_paisa, status, reference_id, idempotency_key, description)
  VALUES (v_transaction_id, v_user_id, 'withdrawal', 'debit', p_amount_paisa, 'pending', v_request_id, 'withdrawal:' || v_request_id::text, 'Wallet withdrawal awaiting admin review');
  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_wallet_deposit(
  p_request_id uuid,
  p_approve boolean,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.wallet_deposit_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO v_request FROM public.wallet_deposit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit request not found'; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'Deposit request has already been reviewed'; END IF;

  IF p_approve THEN
    INSERT INTO public.wallet_accounts(user_id) VALUES (v_request.user_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.wallet_accounts SET balance_paisa = balance_paisa + v_request.amount_paisa, updated_at = now()
      WHERE user_id = v_request.user_id;
    UPDATE public.wallet_transactions SET status = 'completed', description = 'Deposit approved by admin'
      WHERE id = v_request.transaction_id AND status = 'pending';
    IF NOT FOUND THEN RAISE EXCEPTION 'Pending deposit ledger entry not found'; END IF;
    UPDATE public.wallet_deposit_requests SET status = 'approved', admin_note = p_note,
      reviewed_by = auth.uid(), reviewed_at = now() WHERE id = p_request_id;
  ELSE
    UPDATE public.wallet_transactions SET status = 'rejected', description = 'Deposit rejected by admin'
      WHERE id = v_request.transaction_id AND status = 'pending';
    UPDATE public.wallet_deposit_requests SET status = 'rejected', admin_note = p_note,
      reviewed_by = auth.uid(), reviewed_at = now() WHERE id = p_request_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_wallet_withdrawal(
  p_request_id uuid,
  p_approve boolean,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.wallet_withdrawal_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO v_request FROM public.wallet_withdrawal_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal request not found'; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'Withdrawal request has already been reviewed'; END IF;

  IF p_approve THEN
    UPDATE public.wallet_transactions SET status = 'completed', description = 'Withdrawal approved by admin'
      WHERE id = v_request.transaction_id AND status = 'pending';
    IF NOT FOUND THEN RAISE EXCEPTION 'Pending withdrawal ledger entry not found'; END IF;
    UPDATE public.wallet_withdrawal_requests SET status = 'approved', admin_note = p_note,
      reviewed_by = auth.uid(), reviewed_at = now() WHERE id = p_request_id;
  ELSE
    UPDATE public.wallet_transactions SET status = 'rejected', description = 'Withdrawal rejected; funds returned to wallet'
      WHERE id = v_request.transaction_id AND status = 'pending';
    IF NOT FOUND THEN RAISE EXCEPTION 'Pending withdrawal ledger entry not found'; END IF;
    INSERT INTO public.wallet_accounts(user_id) VALUES (v_request.user_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.wallet_accounts SET balance_paisa = balance_paisa + v_request.amount_paisa, updated_at = now()
      WHERE user_id = v_request.user_id;
    INSERT INTO public.wallet_transactions(user_id, transaction_type, direction, amount_paisa, status, reference_id, idempotency_key, description)
    VALUES (v_request.user_id, 'withdrawal_refund', 'credit', v_request.amount_paisa, 'completed',
      p_request_id, 'withdrawal-refund:' || p_request_id::text, 'Rejected withdrawal refunded to wallet')
    ON CONFLICT (user_id, idempotency_key) DO NOTHING;
    UPDATE public.wallet_withdrawal_requests SET status = 'rejected', admin_note = p_note,
      reviewed_by = auth.uid(), reviewed_at = now() WHERE id = p_request_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_wallet_deposit(bigint,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_wallet_withdrawal(bigint,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_review_wallet_deposit(uuid,boolean,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_review_wallet_withdrawal(uuid,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_wallet_deposit(bigint,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_wallet_withdrawal(bigint,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_wallet_deposit(uuid,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_wallet_withdrawal(uuid,boolean,text) TO authenticated;

NOTIFY pgrst, 'reload schema';
