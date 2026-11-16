export const HANDOFF_TTL_MS = 60_000;

export function createHandoffCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isValidHandoffCode(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

export async function hashHandoffCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function handoffExpiresAt(now = Date.now()): string {
  return new Date(now + HANDOFF_TTL_MS).toISOString();
}

export function getSupabasePublicKey(): string {
  return Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    "";
}

export function getSupabaseSecretKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  const single = Deno.env.get("SUPABASE_SECRET_KEY");
  if (single) return single;

  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return typeof keys.default === "string" ? keys.default : "";
  } catch {
    return "";
  }
}
