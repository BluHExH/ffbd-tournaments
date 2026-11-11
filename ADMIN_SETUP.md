# Admin Panel Setup Guide

## Step 1 — Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) → Sign up / Login
2. Click **New Project**
3. Name: `ffbd-tournaments` (or anything)
4. Set a strong Database Password (save it)
5. Region: choose closest (Singapore recommended for BD)
6. Wait ~1–2 minutes for project to be ready

---

## Step 2 — Get API Keys

1. In Supabase Dashboard → **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL**
   - **anon public** key

---

## Step 3 — Add Environment Variables

In your project root create a file named `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Paste the values you copied.

---

## Step 4 — Run Database Schema

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Open the file `supabase/schema.sql` from this repo
3. Copy **all** content and paste into the SQL Editor
4. Click **Run**
5. You should see "Success. No rows returned"

---

## Step 5 — Create First Admin Account

### 5.1 Create Auth User

1. Supabase Dashboard → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email + password (this will be your admin login)
4. Turn **ON** "Auto Confirm User"
5. Click **Create user**
6. Copy the **User UID** (looks like `a1b2c3d4-...`)

### 5.2 Add to Admins Table

1. Go to **SQL Editor** → New query
2. Run this (replace values):

```sql
insert into public.admins (id, email, name)
values (
  'PASTE-USER-UID-HERE',
  'your-email@example.com',
  'Admin Name'
);
```

---

## Step 6 — Install Packages & Run

```bash
npm install @supabase/supabase-js @supabase/ssr
npm run dev
```

Open: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Login with the email + password you created.

---

## Step 7 — Enable Authenticator App (2FA)

After first login:

1. Go to [http://localhost:3000/admin/mfa](http://localhost:3000/admin/mfa)
2. Scan the QR code with **Google Authenticator** or **Authy**
3. Enter the 6-digit code to confirm

From now on every login will ask for the Authenticator code.

---

## Add More Admins (max 3)

Repeat Step 5 for each new admin (create Auth user → insert into `admins` table).

The database will automatically reject a 4th admin.

---

## What Admin Panel Can Do

| Feature | Route |
|---------|-------|
| Dashboard | `/admin` |
| All Tournaments | `/admin/tournaments` |
| Create Tournament | `/admin/tournaments/new` |
| Edit Tournament | `/admin/tournaments/[id]/edit` |
| Setup 2FA | `/admin/mfa` |
| Login | `/admin/login` |

You can fully control:
- Title (EN + BN)
- Mode / Map / Status
- Entry fee & Prize pool
- Slots
- Start time
- Room ID + Password
- Cover image
- Description

---

## Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add the same 2 environment variables in Vercel → Settings → Environment Variables
4. Deploy

Done.
