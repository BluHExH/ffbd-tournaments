import { createClient } from "npm:@supabase/supabase-js@2.86.0";
import {
  getSupabaseSecretKey,
  hashHandoffCode,
  isValidHandoffCode,
} from "../_shared/adminHandoff.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const secretKey = getSupabaseSecretKey();
const allowedOrigin = "https://ffbd-tournaments.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, x-supabase-api-version, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "Vary": "Origin",
  "X-Content-Type-Options": "nosniff",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    if (origin !== allowedOrigin) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("ok", { headers: corsHeaders });
  }

  if (origin !== allowedOrigin) {
    return json({ error: "Forbidden" }, 403);
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 1_024) {
    return json({ error: "Invalid request" }, 413);
  }

  if (!supabaseUrl || !secretKey) {
    return json({ error: "Handoff service is not configured" }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const code = (body as { code?: unknown } | null)?.code;
  if (!isValidHandoffCode(code)) {
    return json({ error: "Invalid or expired handoff" }, 400);
  }

  try {
    const serviceClient = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const codeHash = await hashHandoffCode(code);
    const consumedAt = new Date().toISOString();

    // A conditional UPDATE is atomic: only one concurrent redemption can
    // change consumed_at from NULL while the code is still unexpired.
    const { data: handoff, error: consumeError } = await serviceClient
      .from("admin_session_handoffs")
      .update({ consumed_at: consumedAt })
      .eq("code_hash", codeHash)
      .is("consumed_at", null)
      .gt("expires_at", consumedAt)
      .select("user_id")
      .maybeSingle();

    if (consumeError) {
      return json({ error: "Unable to redeem handoff" }, 503);
    }

    if (!handoff) {
      return json({ error: "Invalid or expired handoff" }, 410);
    }

    // Re-check authorization at redemption time in case the admin was removed
    // after the native app requested the code.
    const { data: admin, error: adminError } = await serviceClient
      .from("admins")
      .select("id")
      .eq("id", handoff.user_id)
      .maybeSingle();

    if (adminError || !admin) {
      return json({ error: "Administrator access required" }, 403);
    }

    const { data: userResult, error: userError } = await serviceClient.auth.admin
      .getUserById(handoff.user_id);

    const email = userResult?.user?.email;
    if (userError || !email) {
      return json({ error: "Administrator account unavailable" }, 403);
    }

    // generateLink returns a one-time token hash; it does not send an email.
    // The browser verifies it through Supabase Auth over HTTPS POST, not a URL.
    const { data: link, error: linkError } = await serviceClient.auth.admin
      .generateLink({ type: "magiclink", email });

    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      return json({ error: "Unable to create browser session" }, 503);
    }

    return json({ tokenHash });
  } catch {
    return json({ error: "Unable to redeem handoff" }, 503);
  }
});
