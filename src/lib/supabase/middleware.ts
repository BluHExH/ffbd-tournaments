import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isLoginPage = path === "/admin/login";
  const isMfaPage = path === "/admin/mfa";

  if (isAdminRoute && !isLoginPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isLoginPage && user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasTotp = (factors?.totp?.length ?? 0) > 0;

    const url = request.nextUrl.clone();
    if (!hasTotp) {
      url.pathname = "/admin/mfa";
    } else if (aal?.currentLevel === "aal2") {
      url.pathname = "/admin";
    } else {
      return supabaseResponse;
    }
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && !isLoginPage && !isMfaPage && user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasTotp = (factors?.totp?.length ?? 0) > 0;
      const url = request.nextUrl.clone();
      url.pathname = hasTotp ? "/admin/login" : "/admin/mfa";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
