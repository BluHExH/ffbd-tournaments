create or replace function public.create_player_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_username text;
  v_phone text;
begin
  v_username := nullif(trim(coalesce(new.raw_user_meta_data ->> 'username', '')), '');
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone_number', '')), '');

  if v_username is null then
    v_username := 'Player' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  end if;

  insert into public.player_profiles(user_id, username)
  values (new.id, v_username)
  on conflict (user_id) do update
    set username = excluded.username,
        updated_at = now();

  if v_phone is not null then
    insert into public.player_private_profiles(user_id, phone_number)
    values (new.id, v_phone)
    on conflict (user_id) do update
      set phone_number = excluded.phone_number,
          updated_at = now();
  end if;

  return new;
end;
$function$;
