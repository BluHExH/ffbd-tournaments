-- Prevent one mobile-money transaction reference from being reused across wallet
-- deposits and direct tournament-entry payments.
CREATE TABLE IF NOT EXISTS public.payment_reference_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method text NOT NULL CHECK (payment_method IN ('bKash','Nagad','Rocket')),
  reference_normalized text NOT NULL,
  source_table text NOT NULL CHECK (source_table IN ('wallet_deposit_requests','tournament_payments')),
  source_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_reference_registry_method_reference_unique
    UNIQUE (payment_method, reference_normalized),
  CONSTRAINT payment_reference_registry_source_unique
    UNIQUE (source_table, source_id)
);
ALTER TABLE public.payment_reference_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_reference_registry FROM PUBLIC, anon, authenticated;

INSERT INTO public.payment_reference_registry(payment_method,reference_normalized,source_table,source_id)
SELECT payment_method, upper(trim(transaction_reference)), 'wallet_deposit_requests', id
FROM public.wallet_deposit_requests
WHERE transaction_reference IS NOT NULL AND trim(transaction_reference) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.payment_reference_registry(payment_method,reference_normalized,source_table,source_id)
SELECT method, upper(trim(transaction_id)), 'tournament_payments', id
FROM public.tournament_payments
WHERE transaction_id IS NOT NULL AND trim(transaction_id) <> ''
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.register_wallet_deposit_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.payment_reference_registry(payment_method,reference_normalized,source_table,source_id)
  VALUES (NEW.payment_method, upper(trim(NEW.transaction_reference)), 'wallet_deposit_requests', NEW.id);
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'This mobile-money transaction reference has already been submitted';
END;
$$;

CREATE OR REPLACE FUNCTION public.register_tournament_payment_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.transaction_id IS NULL OR trim(NEW.transaction_id) = '' THEN RETURN NEW; END IF;
  INSERT INTO public.payment_reference_registry(payment_method,reference_normalized,source_table,source_id)
  VALUES (NEW.method, upper(trim(NEW.transaction_id)), 'tournament_payments', NEW.id);
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'This mobile-money transaction reference has already been submitted';
END;
$$;

DROP TRIGGER IF EXISTS wallet_deposit_reference_registry ON public.wallet_deposit_requests;
CREATE TRIGGER wallet_deposit_reference_registry
  BEFORE INSERT ON public.wallet_deposit_requests
  FOR EACH ROW EXECUTE FUNCTION public.register_wallet_deposit_reference();

DROP TRIGGER IF EXISTS tournament_payment_reference_registry ON public.tournament_payments;
CREATE TRIGGER tournament_payment_reference_registry
  BEFORE INSERT ON public.tournament_payments
  FOR EACH ROW EXECUTE FUNCTION public.register_tournament_payment_reference();

REVOKE ALL ON FUNCTION public.register_wallet_deposit_reference() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.register_tournament_payment_reference() FROM PUBLIC, anon, authenticated;
