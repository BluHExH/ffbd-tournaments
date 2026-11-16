import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0?target=deno";
import {
  createHandoffCode,
  getSupabasePublicKey,
  getSupabaseSecretKey,
  handoffExpiresAt,
  hashHandoffCode,
} from "../_shared/adminHandoff.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const publicKey = getSupabasePublicKey();
const secretKey = getSupabaseSecretKey();

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: responseHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Authentication required" }, 401);
  }

  if (!supabaseUrl || !publicKey || !secretKey) {
    return json({ error: "Handoff service is not configured" }, 503);
  }

  try {
    // The function is deployed with verify_jwt=true. getUser() additionally
    // asks Supabase Auth to validate the bearer token and resolve its user.
    const userClient = createClient(supabaseUrl, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Authentication required" }, 401);
    }

    // The admins table's existing RLS policy is the authority here.
    const { data: admin, error: adminError } = await userClient
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return json({ error: "Administrator access required" }, 403);
    }

    const serviceClient = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const now = new Date();
    const recentSince = new Date(now.getTime() - 5_000).toISOString();

    const { data: recent, error: recentError } = await serviceClient
      .from("admin_session_handoffs")
      .select("created_at")
      .eq("user_id", user.id)
      .gt("created_at", recentSince)
      .limit(1);

    if (recentError) {
      return json({ error: "Unable to create secure handoff" }, 503);
    }

    if (recent?.length) {
      return json({ error: "Please wait before trying again" }, 429);
    }

    const { error: cleanupError } = await serviceClient
      .from("admin_session_handoffs")
      .delete()
      .lt("expires_at", now.toISOString());

    if (cleanupError) {
      return json({ error: "Unable to create secure handoff" }, 503);
    }

    // Replace any older pending code for this admin. The partial unique index
    // also prevents two concurrent pending codes for the same user.
    const { error: pendingError } = await serviceClient
      .from("admin_session_handoffs")
      .delete()
      .eq("user_id", user.id)
      .is("consumed_at", null);

    if (pendingError) {
      return json({ error: "Unable to create secure handoff" }, 503);
    }

    const code = createHandoffCode();
    const codeHash = await hashHandoffCode(code);
    const expiresAt = handoffExpiresAt(now.getTime());

    const { error: insertError } = await serviceClient
      .from("admin_session_handoffs")
      .insert({
        user_id: user.id,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      return json({ error: "Unable to create secure handoff" }, 503);
    }

    // The raw code exists only in this response and the native app's memory.
    // It is never stored, logged, or placed in a URL.
    return json({ code, expiresAt });
  } catch {
    return json({ error: "Unable to create secure handoff" }, 503);
  }
});
