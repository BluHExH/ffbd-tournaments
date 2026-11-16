create table if not exists public.admin_session_handoffs (
  code_hash text primary key
    check (code_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_session_handoffs_expiry_check
    check (expires_at > created_at)
);

create index if not exists admin_session_handoffs_expiry_idx
  on public.admin_session_handoffs (expires_at);

create index if not exists admin_session_handoffs_user_created_idx
  on public.admin_session_handoffs (user_id, created_at desc);

create unique index if not exists admin_session_handoffs_one_pending_per_user_idx
  on public.admin_session_handoffs (user_id)
  where consumed_at is null;

alter table public.admin_session_handoffs enable row level security;

revoke all on table public.admin_session_handoffs from public, anon, authenticated;
grant all on table public.admin_session_handoffs to service_role;

comment on table public.admin_session_handoffs is
  'Short-lived, single-use admin WebView handoff hashes. Only Supabase Edge Functions using the service role may access this table.';
