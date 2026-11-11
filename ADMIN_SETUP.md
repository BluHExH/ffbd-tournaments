# Admin Panel Setup Guide (Secure v2)

## Prerequisites

- Supabase project created (Asia Pacific / Singapore recommended)
- Role in SQL Editor: **postgres**

---

## Step 1 — Run Schema

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Open `supabase/schema.sql` from this repo
3. Paste **all** content → **Run**

If you see `permission denied for schema public`, run this first, then re-run schema:

```sql
GRANT USAGE, CREATE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
```

### Verify

Run queries in `supabase/verify.sql` (V1–V5).

Expected tables:
- `admins`
- `tournaments`
- `tournament_room_credentials`

---

## Step 2 — Create Auth User

1. **Authentication** → **Users** → **Add user**
2. Email + password
3. **Auto Confirm User** → ON
4. Copy **User UID**

---

## Step 3 — Register Admin (SQL only — max 3)

```sql
insert into public.admins (id, email, name)
values (
  'PASTE-USER-UID-HERE',
  'your-email@example.com',
  'Admin Name'
);
```

Admin rows cannot be created via the browser API (by design).

---

## Step 4 — Environment Variables

`.env.local` (local) and Vercel → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Never put the **service_role** key in the frontend or commit it.

---

## Step 5 — Run App

```bash
npm install
npm run dev
```

Open: http://localhost:3000/admin/login

1. Sign in with email/password
2. If MFA not enrolled → redirected to `/admin/mfa`
3. Scan QR with Google Authenticator / Authy
4. Every later login requires the 6-digit code (AAL2)

---

## Security Architecture

| Concern | Implementation |
|--------|----------------|
| Admin check | `public.is_admin()` SECURITY DEFINER + fixed `search_path` |
| RLS recursion | Policies use `is_admin()`, never self-query `admins` in USING |
| Max 3 admins | Trigger + `pg_advisory_xact_lock` |
| Room secrets | `tournament_room_credentials` — admin-only RLS |
| MFA | Mandatory TOTP; `requireAdmin()` enforces AAL2 server-side |
| Admin create | SQL Editor / postgres only |

---

## Known limitations

- Public site tournament list still uses seed data until wired to Supabase.
- Room credentials are never returned by public tournament SELECT policies.
