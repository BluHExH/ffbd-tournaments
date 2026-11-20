-- These functions are invoked by PostgreSQL triggers/event triggers, not through the public RPC API.
REVOKE ALL ON FUNCTION public.check_admin_limit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_admin_limit() FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
