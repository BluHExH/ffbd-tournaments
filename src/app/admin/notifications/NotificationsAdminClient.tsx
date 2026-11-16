"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Loader2, Send } from "lucide-react";

type Player = { user_id: string; username: string };

type SendResult = {
  savedFor: number;
  pushTokens: number;
  acceptedByPushService: number;
  failedPushes: number;
};

export function NotificationsAdminClient() {
  const [db] = useState(() => createClient());
  const [players, setPlayers] = useState<Player[]>([]);
  const [recipient, setRecipient] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState("general");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<SendResult | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error: loadError } = await db
        .from("player_profiles")
        .select("user_id,username")
        .order("username")
        .limit(1000);
      if (!active) return;
      if (loadError) setError(loadError.message);
      setPlayers((data ?? []) as Player[]);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [db]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice(null);

    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }

    setSending(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await db.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("Your admin session expired. Sign in again with MFA.");
        return;
      }

      const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== "aal2") {
        setError(
          "MFA verification required (AAL2). Sign out, sign in again, and complete the authenticator code."
        );
        return;
      }

      const { data, error: invokeError } = await db.functions.invoke(
        "admin-send-notification",
        {
          body: {
            recipient,
            title: title.trim(),
            message: message.trim(),
            notificationType: kind,
          },
        }
      );

      if (invokeError) {
        let detail = invokeError.message || "Notification could not be sent.";
        try {
          const ctx = (invokeError as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            if (body?.error) detail = String(body.error);
          }
        } catch {
          /* ignore */
        }
        if (/Failed to send|not found|404|FunctionsFetchError/i.test(detail)) {
          detail +=
            " — Deploy Edge Function admin-send-notification in Supabase and set the service role / secret key for the function.";
        }
        setError(detail);
        return;
      }

      if (data?.error) {
        setError(String(data.error));
        return;
      }

      setNotice({
        savedFor: Number(data?.savedFor ?? 0),
        pushTokens: Number(data?.pushTokens ?? 0),
        acceptedByPushService: Number(data?.acceptedByPushService ?? 0),
        failedPushes: Number(data?.failedPushes ?? 0),
      });
      setTitle("");
      setMessage("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unexpected error while sending notification."
      );
    } finally {
      setSending(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-[#0B1221] px-3 py-3 text-sm text-white outline-none focus:border-[#FF7130]";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-7">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF7130]">
          Control center / Community
        </p>
        <h1 className="font-heading text-3xl font-bold text-white">
          Player Notifications
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Send an in-app alert and a phone push notification to one account or
          every registered account.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"
        >
          <p className="font-bold">Notification request completed</p>
          <p className="mt-2">
            In-app saved for {notice.savedFor} accounts · {notice.pushTokens}{" "}
            registered devices · {notice.acceptedByPushService} accepted by Expo
            Push Service · {notice.failedPushes} push errors.
          </p>
        </div>
      )}

      <form
        onSubmit={send}
        className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#121C2E] p-5 sm:p-7"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF5C00]/10 text-[#FF7130]">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-bold text-white">
              Compose notification
            </h2>
            <p className="text-xs text-white/40">
              {loading
                ? "Loading player list…"
                : `${players.length} player profiles available`}
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-white/60">
            Recipient
          </span>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className={input}
          >
            <option value="all">All registered accounts</option>
            {players.map((p) => (
              <option key={p.user_id} value={p.user_id}>
                {p.username || p.user_id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-white/60">
            Notification type
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={input}
          >
            <option value="general">General</option>
            <option value="tournament">Tournament</option>
            <option value="payment">Payment</option>
            <option value="result">Result</option>
            <option value="account">Account</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-white/60">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className={input}
            placeholder="Notification title"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-white/60">
            Message
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={5}
            className={input}
            placeholder="Write the update for players…"
            required
          />
        </label>

        <button
          type="submit"
          disabled={sending || loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] px-5 text-sm font-heading font-semibold text-white disabled:opacity-60"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send notification
            </>
          )}
        </button>
      </form>
    </main>
  );
}
