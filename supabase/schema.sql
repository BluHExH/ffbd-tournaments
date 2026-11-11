-- ============================================================
-- FFBD Tournaments - Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Admins table (max 3 admins)
create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

-- Enforce max 3 admins
create or replace function public.check_admin_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.admins) >= 3 then
    raise exception 'Maximum 3 admins allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists admin_limit_trigger on public.admins;
create trigger admin_limit_trigger
  before insert on public.admins
  for each row execute function public.check_admin_limit();

-- 2. Tournaments table
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  uid text not null unique,                    -- e.g. #FF001
  slug text not null unique,
  title text not null,
  title_bn text not null,
  mode text not null check (mode in ('Solo', 'Duo', 'Squad')),
  entry_fee integer not null default 0,
  prize_pool integer not null default 0,
  slots integer not null,
  slots_filled integer not null default 0,
  status text not null default 'upcoming' check (status in ('live', 'upcoming', 'ended')),
  start_at timestamptz not null,
  cover text,
  region text not null default 'BD',
  map text not null check (map in ('Bermuda', 'Purgatory', 'Kalahari', 'Alpine')),
  description text,
  description_bn text,
  room_id text,
  room_password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tournaments_updated_at on public.tournaments;
create trigger tournaments_updated_at
  before update on public.tournaments
  for each row execute function public.set_updated_at();

-- Index for common queries
create index if not exists idx_tournaments_status on public.tournaments(status);
create index if not exists idx_tournaments_start_at on public.tournaments(start_at);
create index if not exists idx_tournaments_slug on public.tournaments(slug);

-- 3. Row Level Security
alter table public.admins enable row level security;
alter table public.tournaments enable row level security;

-- Admins: only authenticated admins can read the admins table
create policy "Admins can read admins"
  on public.admins for select
  to authenticated
  using (
    exists (select 1 from public.admins a where a.id = auth.uid())
  );

-- Tournaments: anyone can read (public website)
create policy "Public can read tournaments"
  on public.tournaments for select
  to anon, authenticated
  using (true);

-- Tournaments: only admins can insert/update/delete
create policy "Admins can insert tournaments"
  on public.tournaments for insert
  to authenticated
  with check (
    exists (select 1 from public.admins a where a.id = auth.uid())
  );

create policy "Admins can update tournaments"
  on public.tournaments for update
  to authenticated
  using (
    exists (select 1 from public.admins a where a.id = auth.uid())
  );

create policy "Admins can delete tournaments"
  on public.tournaments for delete
  to authenticated
  using (
    exists (select 1 from public.admins a where a.id = auth.uid())
  );

-- 4. Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.admins where id = auth.uid()
  );
$$;
