alter table public.tournament_room_credentials
  add column if not exists is_visible boolean not null default false;

create or replace function public.get_my_tournament_room_credentials(p_tournament_id uuid)
returns table (room_id text, room_password text)
language sql
stable
security definer
set search_path = ''
as $function$
  select c.room_id, c.room_password
  from public.tournament_room_credentials as c
  where c.tournament_id = p_tournament_id
    and c.is_visible = true
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.tournament_participants as p
      where p.tournament_id = c.tournament_id
        and p.user_id = (select auth.uid())
        and p.status = 'confirmed'
    )
  limit 1;
$function$;

revoke all on function public.get_my_tournament_room_credentials(uuid) from public;
revoke all on function public.get_my_tournament_room_credentials(uuid) from anon;
grant execute on function public.get_my_tournament_room_credentials(uuid) to authenticated;
