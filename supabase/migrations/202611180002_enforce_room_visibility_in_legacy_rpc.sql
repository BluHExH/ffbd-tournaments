
create or replace function public.get_my_tournament_room(p_tournament_id uuid)
returns table(room_id text, room_password text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_start_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select t.start_at into v_start_at
  from public.tournaments t
  join public.tournament_participants p on p.tournament_id = t.id
  where t.id = p_tournament_id
    and p.user_id = v_user_id
    and p.status = 'confirmed'
    and t.status <> 'ended'
    and now() <= t.start_at + interval '6 hours';

  if not found then
    raise exception 'You are not registered for this tournament';
  end if;

  if v_start_at > now() + interval '10 minutes' then
    raise exception 'Room details unlock 10 minutes before match start';
  end if;

  return query
  select c.room_id, c.room_password
  from public.tournament_room_credentials c
  where c.tournament_id = p_tournament_id
    and c.is_visible = true;
end;
$function$;

revoke all on function public.get_my_tournament_room(uuid) from public;
revoke all on function public.get_my_tournament_room(uuid) from anon;
grant execute on function public.get_my_tournament_room(uuid) to authenticated;
