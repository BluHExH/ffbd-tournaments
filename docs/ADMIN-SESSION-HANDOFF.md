# Secure Admin session handoff

The Android app and the website intentionally keep separate Supabase client storage. The native app stores its session in Expo SecureStore; the website uses its own Supabase SSR cookie session. Native access and refresh tokens are never copied into WebView URLs, query strings, fragments, JavaScript storage, or logs.

## Flow

1. The native app verifies the current user with Supabase Auth and checks membership in the existing admins table.
2. The WebView opens the same-origin mobile handoff page. It first reuses an existing website Admin session if one is already present.
3. If no website session exists, the WebView asks the native app for a handoff. The authenticated issue Edge Function revalidates the native JWT and admin membership.
4. The issue function creates a cryptographically random 256-bit code, stores only its SHA-256 hash, and gives the raw code to the native app. The code expires after 60 seconds and only one pending code per admin is allowed.
5. The native app injects the code into the already-loaded trusted WebView page through an in-memory JavaScript event. It is not placed in a URL or persisted.
6. The WebView redeems the code through a same-origin-restricted Edge Function. A conditional database update consumes it atomically, so only one redemption can succeed. The function rechecks admin membership and generates a Supabase magic-link token hash without sending an email.
7. The browser verifies that one-time token hash through Supabase Auth over HTTPS POST. Supabase SSR stores the resulting browser session in the website cookie store.
8. The generated browser session is only AAL1. The existing website Admin login flow still requires the verified TOTP challenge to reach AAL2. Every protected Admin page continues to call requireAdmin().

## Security boundaries

- The handoff table has RLS enabled and no client policies. Only the Edge Functions' service-role client can read or write it.
- The raw handoff code is 256-bit, expires in 60 seconds, and is never stored server-side.
- Redemption is single-use and atomic. Expired, consumed, malformed, or unknown codes fail closed.
- The redeem function accepts browser requests only from https://ffbd-tournaments.vercel.app.
- The issue function requires a valid Supabase user JWT and an admins-table row. The redeem function checks the admin row again before issuing a browser sign-in token.
- The browser receives a fresh AAL1 session, not an AAL2 session. The website's existing MFA/AAL2 checks are unchanged and remain the final authority.
- If the handoff endpoint is unavailable, the WebView offers the existing password + MFA login as a fallback.
- The native and website sessions remain independently stored. No access token or refresh token crosses the WebView boundary.

## Manual verification still required

- Sign in as an authorized admin in the Android app, open Admin Dashboard, and confirm that the WebView reaches the MFA step without asking for the password again.
- Complete TOTP in the WebView and confirm the Admin dashboard loads.
- Reopen Admin Dashboard and confirm an existing AAL2 website session is reused without generating a new handoff.
- Sign in as an ordinary player and confirm the portal and Admin entry remain unavailable.
- Test an expired code and a repeated redemption; both must fail.
- Confirm sign-out from the website WebView does not sign out the native SecureStore session.
