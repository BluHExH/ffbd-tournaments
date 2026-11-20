-- Push notification registrations and live user presence for BANGLAR TOURNAMENTS.
CREATE TABLE IF NOT EXISTS public.player_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('android','ios')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS player_push_tokens_user_idx ON public.player_push_tokens(user_id);
ALTER TABLE public.player_push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS player_push_tokens_select_own ON public.player_push_tokens;
CREATE POLICY player_push_tokens_select_own ON public.player_push_tokens FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS player_push_tokens_delete_own ON public.player_push_tokens;
CREATE POLICY player_push_tokens_delete_own ON public.player_push_tokens FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
GRANT SELECT, DELETE ON public.player_push_tokens TO authenticated;
REVOKE INSERT, UPDATE ON public.player_push_tokens FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_my_push_token(p_token text, p_platform text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_token IS NULL OR length(p_token) < 20 OR length(p_token) > 512 THEN RAISE EXCEPTION 'Invalid push token'; END IF;
  IF p_platform NOT IN ('android','ios') THEN RAISE EXCEPTION 'Unsupported platform'; END IF;
  INSERT INTO public.player_push_tokens(user_id, expo_push_token, platform, updated_at)
  VALUES (v_user_id, p_token, p_platform, now())
  ON CONFLICT (expo_push_token) DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.register_my_push_token(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_my_push_token(text,text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  platform text NOT NULL DEFAULT 'unknown' CHECK (platform IN ('android','ios','web','unknown'))
);
CREATE INDEX IF NOT EXISTS user_presence_last_seen_idx ON public.user_presence(last_seen_at DESC);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_presence_select_own ON public.user_presence;
CREATE POLICY user_presence_select_own ON public.user_presence FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.user_presence FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_my_presence(p_platform text DEFAULT 'unknown')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_presence(user_id,last_seen_at,platform)
  VALUES (v_user_id,now(),CASE WHEN p_platform IN ('android','ios','web') THEN p_platform ELSE 'unknown' END)
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now(), platform = EXCLUDED.platform;
END;
$$;
REVOKE ALL ON FUNCTION public.touch_my_presence(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_my_presence(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_user_metrics()
RETURNS TABLE(total_users bigint, active_users bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() OR coalesce(auth.jwt()->>'aal','') <> 'aal2' THEN
    RAISE EXCEPTION 'Elevated administrator access required';
  END IF;
  RETURN QUERY SELECT
    (SELECT count(*)::bigint FROM auth.users),
    (SELECT count(*)::bigint FROM public.user_presence WHERE last_seen_at >= now() - interval '5 minutes');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_user_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_user_metrics() TO authenticated;
NOTIFY pgrst, 'reload schema';
