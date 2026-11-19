
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  notification_type text not null default 'general',
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.admin_notifications enable row level security;
drop policy if exists admin_notifications_select_admin on public.admin_notifications;
create policy admin_notifications_select_admin on public.admin_notifications
  for select to authenticated using (public.is_admin());
drop policy if exists admin_notifications_update_admin on public.admin_notifications;
create policy admin_notifications_update_admin on public.admin_notifications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.admin_notifications from anon, authenticated;
grant select, update on public.admin_notifications to authenticated;

create or replace function public.notify_admin_wallet_deposit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.admin_notifications(title, body, notification_type, related_id)
  values (
    'New wallet deposit request',
    'A player submitted a ' || to_char(new.amount_paisa::numeric / 100, 'FM999999990.00')
      || ' BDT deposit via ' || new.payment_method || '. Open Player Wallet to review the payment.',
    'wallet_deposit',
    new.id
  );
  return new;
end;
$function$;

revoke all on function public.notify_admin_wallet_deposit() from public, anon, authenticated;

drop trigger if exists admin_notify_wallet_deposit on public.wallet_deposit_requests;
create trigger admin_notify_wallet_deposit
after insert on public.wallet_deposit_requests
for each row execute function public.notify_admin_wallet_deposit();

do $publication$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'admin_notifications'
     ) then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;
end;
$publication$;

notify pgrst, 'reload schema';
