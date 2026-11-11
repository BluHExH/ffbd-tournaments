import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string | undefined;
};

/**
 * Server-side admin gate.
 * - Requires authenticated user
 * - Requires row in public.admins
 * - Requires MFA AAL2 (TOTP verified)
 */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  const { data: aal, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError) {
    redirect("/admin/login");
  }

  if (aal.currentLevel === "aal1" && aal.nextLevel === "aal2") {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasTotp = (factors?.totp?.length ?? 0) > 0;
    if (!hasTotp) {
      redirect("/admin/mfa");
    }
    redirect("/admin/login");
  }

  if (aal.currentLevel !== "aal2") {
    redirect("/admin/mfa");
  }

  return {
    userId: user.id,
    email: admin.email ?? user.email,
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin) return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.currentLevel !== "aal2") return null;

  return {
    userId: user.id,
    email: admin.email ?? user.email,
  };
}
