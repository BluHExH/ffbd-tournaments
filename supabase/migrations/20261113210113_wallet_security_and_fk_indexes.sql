-- Tighten trigger-only function access and cover foreign keys with indexes.
REVOKE ALL ON FUNCTION public.create_player_profile_for_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_player_profile_for_new_user() FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS tournament_participants_user_id_idx
  ON public.tournament_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tournament_payments_participant_id_idx
  ON public.tournament_payments(participant_id) WHERE participant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS wallet_deposit_requests_reviewed_by_idx
  ON public.wallet_deposit_requests(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS wallet_deposit_requests_transaction_id_idx
  ON public.wallet_deposit_requests(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS wallet_withdrawal_requests_reviewed_by_idx
  ON public.wallet_withdrawal_requests(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS wallet_withdrawal_requests_transaction_id_idx
  ON public.wallet_withdrawal_requests(transaction_id) WHERE transaction_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
