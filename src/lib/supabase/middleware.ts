import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight edge gate. Final authority is requireAdmin() on each page.
 *
 * Paths:
 * - /admin/login  — password + MFA challenge (AAL1 allowed)
 * - /admin/mfa    — TOTP enrollment (AAL1 allowed)
 * - /admin/*      — AAL2 required
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isLoginPage = path === "/admin/login";
  const isMfaPage = path === "/admin/mfa";

  if (!isAdminRoute) {
    return supabaseResponse;
  }

  if (!user) {
    if (isLoginPage) return supabaseResponse;
    const dest = request.nextUrl.clone();
    dest.pathname = "/admin/login";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  // Keep the edge middleware lightweight: verify the user session here,
  // while the server-side requireAdmin() performs the authoritative admin + AAL2 check.
  // Repeating MFA factor/AAL network calls on every navigation caused avoidable latency.
  if (isLoginPage || isMfaPage) return supabaseResponse;
  return supabaseResponse;
}
