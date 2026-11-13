-- Create the ledger transaction before the withdrawal row that references it.
-- The previous order violated the immediate FK from wallet_withdrawal_requests.
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
  v_request_id uuid := gen_random_uuid();
  v_transaction_id uuid := gen_random_uuid();
  v_balance bigint;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount_paisa < 10000 THEN RAISE EXCEPTION 'Minimum withdrawal is ৳100'; END IF;
  IF p_payment_method NOT IN ('bKash','Nagad','Rocket') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
  IF length(trim(coalesce(p_recipient_number,''))) < 8 THEN RAISE EXCEPTION 'Valid recipient number is required'; END IF;

  INSERT INTO public.wallet_accounts(user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallet_accounts
    SET balance_paisa = balance_paisa - p_amount_paisa, updated_at = now()
    WHERE user_id = v_user_id AND balance_paisa >= p_amount_paisa
    RETURNING balance_paisa INTO v_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  INSERT INTO public.wallet_transactions(
    id,user_id,transaction_type,direction,amount_paisa,status,reference_id,idempotency_key,description
  ) VALUES (
    v_transaction_id,v_user_id,'withdrawal','debit',p_amount_paisa,'pending',v_request_id,
    'withdrawal:' || v_request_id::text,'Wallet withdrawal awaiting admin review'
  );

  INSERT INTO public.wallet_withdrawal_requests(
    id,user_id,amount_paisa,payment_method,recipient_number,status,transaction_id
  ) VALUES (
    v_request_id,v_user_id,p_amount_paisa,p_payment_method,trim(p_recipient_number),'pending',v_transaction_id
  );

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_wallet_withdrawal(bigint,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_wallet_withdrawal(bigint,text,text) TO authenticated;
NOTIFY pgrst, 'reload schema';
