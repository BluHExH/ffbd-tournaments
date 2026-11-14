-- Explicitly deny all direct API access to the internal transaction-reference registry.
-- SECURITY DEFINER trigger functions owned by the database owner can still maintain it.
DROP POLICY IF EXISTS payment_reference_registry_deny_client ON public.payment_reference_registry;
CREATE POLICY payment_reference_registry_deny_client
  ON public.payment_reference_registry
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
REVOKE ALL ON public.payment_reference_registry FROM PUBLIC, anon, authenticated;
