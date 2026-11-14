-- Direct mobile-money tournament registration with admin verification.
ALTER TABLE public.tournament_payments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES public.tournament_participants(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tournament_payment_reference_unique
  ON public.tournament_payments(method, transaction_id)
  WHERE transaction_id IS NOT NULL AND transaction_id <> '';

CREATE INDEX IF NOT EXISTS tournament_payments_user_created_idx
  ON public.tournament_payments(user_id, created_at DESC);

DROP POLICY IF EXISTS tournament_payments_select_own ON public.tournament_payments;
CREATE POLICY tournament_payments_select_own ON public.tournament_payments
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.tournament_payments FROM anon, authenticated;

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
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_tournament public.tournaments%ROWTYPE;
  v_participant_id uuid;
  v_payment_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(trim(coalesce(p_display_name,''))) < 2 THEN RAISE EXCEPTION 'Player name is required'; END IF;
  IF p_payment_method NOT IN ('bKash','Nagad','Rocket') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
  IF length(trim(coalesce(p_sender_number,''))) < 8 OR length(trim(coalesce(p_transaction_reference,''))) < 4 THEN
    RAISE EXCEPTION 'Sender number and transaction reference are required';
  END IF;

  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_tournament.status <> 'upcoming' THEN RAISE EXCEPTION 'Registration is not open'; END IF;
  IF v_tournament.entry_fee <= 0 THEN RAISE EXCEPTION 'This tournament does not require a payment'; END IF;
  IF v_tournament.slots_filled >= v_tournament.slots THEN RAISE EXCEPTION 'Tournament is full'; END IF;
  IF EXISTS (SELECT 1 FROM public.tournament_participants WHERE tournament_id = p_tournament_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'You are already registered for this tournament';
  END IF;

  INSERT INTO public.tournament_participants(tournament_id,user_id,display_name,team_name,game_uid,slot_number,status)
  VALUES (p_tournament_id,v_user_id,trim(p_display_name),nullif(trim(coalesce(p_team_name,'')),''),
    nullif(trim(coalesce(p_game_uid,'')),''),v_tournament.slots_filled+1,'registered')
  RETURNING id INTO v_participant_id;

  INSERT INTO public.tournament_payments(tournament_id,participant_name,amount,method,transaction_id,sender_number,status,note,user_id,participant_id)
  VALUES (p_tournament_id,trim(p_display_name),v_tournament.entry_fee,p_payment_method,trim(p_transaction_reference),
    trim(p_sender_number),'pending','Direct mobile payment awaiting admin verification',v_user_id,v_participant_id)
  RETURNING id INTO v_payment_id;

  UPDATE public.tournaments SET slots_filled = slots_filled + 1 WHERE id = p_tournament_id;
  RETURN v_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_tournament_payment(
  p_payment_id uuid,
  p_approve boolean,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment public.tournament_payments%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO v_payment FROM public.tournament_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment request not found'; END IF;
  IF v_payment.status <> 'pending' THEN RAISE EXCEPTION 'Payment request has already been reviewed'; END IF;

  IF p_approve THEN
    UPDATE public.tournament_payments SET status = 'approved', note = coalesce(p_note,note) WHERE id = p_payment_id;
    IF v_payment.participant_id IS NOT NULL THEN
      UPDATE public.tournament_participants SET status = 'confirmed' WHERE id = v_payment.participant_id;
    END IF;
  ELSE
    UPDATE public.tournament_payments SET status = 'rejected', note = coalesce(p_note,note) WHERE id = p_payment_id;
    IF v_payment.participant_id IS NOT NULL THEN
      UPDATE public.tournament_participants SET status = 'rejected' WHERE id = v_payment.participant_id;
      UPDATE public.tournaments SET slots_filled = greatest(0,slots_filled-1) WHERE id = v_payment.tournament_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_direct_tournament_payment(uuid,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_review_tournament_payment(uuid,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_direct_tournament_payment(uuid,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_tournament_payment(uuid,boolean,text) TO authenticated;

NOTIFY pgrst, 'reload schema';
