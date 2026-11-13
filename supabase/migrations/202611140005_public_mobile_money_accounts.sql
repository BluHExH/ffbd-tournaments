-- Publish only the official mobile-money receiving numbers needed by player payment screens.
INSERT INTO public.website_settings(key, value, description)
VALUES
  ('payment_bkash_number', '', 'Official bKash number for player deposits and direct tournament entry payments'),
  ('payment_nagad_number', '', 'Official Nagad number for player deposits and direct tournament entry payments'),
  ('payment_rocket_number', '', 'Official Rocket number for player deposits and direct tournament entry payments')
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS ticker_notice_public_read ON public.website_settings;
CREATE POLICY ticker_notice_public_read ON public.website_settings
  FOR SELECT TO anon, authenticated
  USING (key IN (
    'ticker_notice',
    'platform_rules',
    'payment_bkash_number',
    'payment_nagad_number',
    'payment_rocket_number'
  ));

GRANT SELECT ON public.website_settings TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
