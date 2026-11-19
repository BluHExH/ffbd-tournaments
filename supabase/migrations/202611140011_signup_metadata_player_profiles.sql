-- Persist username and phone number supplied during Supabase sign-up.
-- Tables and trigger are created by 202611140002_player_profiles_registration_notifications.sql.
CREATE OR REPLACE FUNCTION public.create_player_profile_for_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_username text; v_phone text;
BEGIN
  v_username := nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'username', '')), '');
  v_phone := nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'phone_number', '')), '');
  IF v_username IS NULL THEN
    v_username := 'Player' || upper(substr(replace(NEW.id::text, '-', ''), 1, 8));
  END IF;
  INSERT INTO public.player_profiles(user_id, username) VALUES (NEW.id, v_username)
  ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, updated_at = now();
  IF v_phone IS NOT NULL THEN
    INSERT INTO public.player_private_profiles(user_id, phone_number) VALUES (NEW.id, v_phone)
    ON CONFLICT (user_id) DO UPDATE SET phone_number = EXCLUDED.phone_number, updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;
