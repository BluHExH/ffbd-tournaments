import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string | undefined;
};

/**
 * Authentication states for admin access:
 * 1. unauthenticated
 * 2. password_authenticated (AAL1, may need enroll or verify)
 * 3. mfa_enrollment_required
 * 4. mfa_verification_required
 * 5. fully_authenticated_aal2
 */
export type AdminAuthState =
  | { state: "unauthenticated" }
  | { state: "not_admin" }
  | { state: "mfa_enrollment_required"; userId: string; email?: string }
  | { state: "mfa_verification_required"; userId: string; email?: string }
  | { state: "fully_authenticated_aal2"; userId: string; email?: string };

/** Only verified TOTP factors count as enrolled. */
export function getVerifiedTotpFactors(
  factors: { totp?: Array<{ id: string; status: string }> | null } | null | undefined
): Array<{ id: string; status: string }> {
  return (factors?.totp ?? []).filter((f) => f.status === "verified");
}

/**
 * Resolve admin auth state without redirecting.
 * Safe for middleware, pages, and tests.
 */
export async function resolveAdminAuthState(): Promise<AdminAuthState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { state: "unauthenticated" };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return { state: "not_admin" };
  }

  const email = admin.email ?? user.email ?? undefined;

  const { data: aal, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError || !aal) {
    return { state: "mfa_verification_required", userId: user.id, email };
  }

  if (aal.currentLevel === "aal2") {
    return {
      state: "fully_authenticated_aal2",
      userId: user.id,
      email,
    };
  }

  const { data: factors, error: factorsError } =
    await supabase.auth.mfa.listFactors();

  if (factorsError) {
    return { state: "mfa_enrollment_required", userId: user.id, email };
  }

  const verified = getVerifiedTotpFactors(factors);

  if (verified.length === 0) {
    return { state: "mfa_enrollment_required", userId: user.id, email };
  }

  return { state: "mfa_verification_required", userId: user.id, email };
}

/**
 * Server-side admin gate for protected pages.
 * Only fully_authenticated_aal2 proceeds; everything else redirects.
 *
 * Redirect map (no loops):
 * - unauthenticated / not_admin → /admin/login (not_admin signs out)
 * - mfa_enrollment_required → /admin/mfa
 * - mfa_verification_required → /admin/login?step=mfa
 * - fully_authenticated_aal2 → continue
 */
export async function requireAdmin(): Promise<AdminSession> {
  const resolved = await resolveAdminAuthState();

  if (resolved.state === "unauthenticated") {
    redirect("/admin/login");
  }

  if (resolved.state === "not_admin") {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  if (resolved.state === "mfa_enrollment_required") {
    redirect("/admin/mfa");
  }

  if (resolved.state === "mfa_verification_required") {
    redirect("/admin/login?step=mfa");
  }

  return {
    userId: resolved.userId,
    email: resolved.email,
  };
}

/** Soft check — null if not fully authenticated AAL2 admin. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const resolved = await resolveAdminAuthState();
  if (resolved.state !== "fully_authenticated_aal2") return null;
  return {
    userId: resolved.userId,
    email: resolved.email,
  };
}
