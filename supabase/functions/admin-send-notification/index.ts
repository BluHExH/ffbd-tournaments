import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0?target=deno";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

function getSecretKey(): string {
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

const secretKey = getSecretKey();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (
    !authorization?.startsWith("Bearer ") || !supabaseUrl || !publicKey ||
    !secretKey
  ) {
    return json({ error: "Authentication required" }, 401);
  }

  try {
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

    const [{ data: admin }, { data: aal, error: aalError }] = await Promise.all(
      [
        userClient.from("admins").select("id").eq("id", user.id).maybeSingle(),
        userClient.auth.mfa.getAuthenticatorAssuranceLevel(),
      ],
    );
    if (!admin) {
      return json({ error: "Administrator access required" }, 403);
    }
    if (aalError || aal?.currentLevel !== "aal2") {
      return json(\n        { error: "Elevated administrator verification required" },\n        403,\n      );
    }

    const body = await request.json().catch(() => null) as {
      recipient?: string;
      title?: string;
      message?: string;
      notificationType?: string;
    } | null;
    const title = body?.title?.trim() ?? "";
    const message = body?.message?.trim() ?? "";
    const recipient = body?.recipient ?? "all";
    const allowedTypes = new Set([
      "general",
      "tournament",
      "payment",
      "result",
      "account",
    ]);
    const notificationType = allowedTypes.has(body?.notificationType ?? "")
      ? body!.notificationType!
      : "general";
    if (!title || title.length > 100 || !message || message.length > 1000) {
      return json({
        error:\n          "A title (max 100 characters) and message (max 1000 characters) are required",
      }, 400);
    }

    const service = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    let userIds: string[] = [];
    if (recipient === "all") {
      let page = 1;
      while (page <= 20) {
        const { data, error } = await service.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (error) {
          return json({ error: "Unable to load recipient accounts" }, 503);
        }
        userIds.push(...data.users.map((entry) => entry.id));
        if (data.users.length < 1000) break;
        page++;
      }
      if (userIds.length >= 20000) {
        return json({
          error: "Recipient list exceeds the supported broadcast limit",
        }, 413);
      }
    } else if (
      typeof recipient === "string" && /^[0-9a-f-]{36}$/i.test(recipient)
    ) {
      const { data: target, error } = await service.auth.admin.getUserById(
        recipient,
      );
      if (error || !target.user) {
        return json({ error: "Recipient account not found" }, 404);
      }
      userIds = [recipient];
    } else {
      return json({ error: "Invalid recipient" }, 400);
    }

    if (!userIds.length) {
      return json({ error: "No registered accounts found" }, 404);
    }
    const records = userIds.map((user_id) => ({
      user_id,
      title,
      body: message,
      notification_type: notificationType,
    }));
    for (let offset = 0; offset < records.length; offset += 500) {
      const { error } = await service.from("player_notifications").insert(
        records.slice(offset, offset + 500),
      );
      if (error) {
        return json({ error: "Could not save all in-app notifications" }, 503);
      }
    }

    const tokens: { user_id: string; expo_push_token: string }[] = [];
    for (let offset = 0; offset < userIds.length; offset += 500) {
      const { data, error } = await service.from("player_push_tokens")
        .select("user_id,expo_push_token").in(
          "user_id",
          userIds.slice(offset, offset + 500),
        );
      if (error) {
        return json({
          error: "Notifications saved, but push recipients could not be loaded",
        }, 503);
      }
      tokens.push(...(data ?? []));
    }

    let acceptedByPushService = 0;
    let failedPushes = 0;
    const invalidTokens: string[] = [];
    for (let offset = 0; offset < tokens.length; offset += 100) {
      const chunk = tokens.slice(offset, offset + 100);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk.map((token) => ({
          to: token.expo_push_token,
          title,
          body: message,
          sound: "default",
          priority: "high",
          channelId: "default",
          data: { type: notificationType },
        }))),
      });
      if (!response.ok) {
        failedPushes += chunk.length;
        continue;
      }
      const result = await response.json().catch(() => ({}));
      const tickets = Array.isArray(result?.data) ? result.data : [];
      tickets.forEach(
        (
          ticket: { status?: string; details?: { error?: string } },
          index: number,
        ) => {
          if (ticket.status === "ok") acceptedByPushService++;
          else {
            failedPushes++;
            if (ticket.details?.error === "DeviceNotRegistered") {
              invalidTokens.push(chunk[index].expo_push_token);
            }
          }
        },
      );
    }
    if (invalidTokens.length) {
      await service.from("player_push_tokens").delete().in(
        "expo_push_token",
        invalidTokens,
      );
    }
    return json({
      savedFor: userIds.length,
      pushTokens: tokens.length,
      acceptedByPushService,
      failedPushes,
    });
  } catch {
    return json({ error: "Notification service failed" }, 503);
  }
});
