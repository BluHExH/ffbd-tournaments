"use client";

import { useEffect, useState } from "react";

/**
 * Bridge page for Android password recovery.
 *
 * Supabase email links redirect here (HTTPS). We forward tokens/code to the
 * app via custom scheme using QUERY parameters, because Android often strips
 * URL hash fragments (#access_token=...) from deep links.
 *
 * Never render token values in the UI.
 */
export default function MobileResetBridgePage() {
  const [status, setStatus] = useState("Opening BANGLAR TOURNAMENTS…");
  const [manual, setManual] = useState<string | null>(null);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const search =
      typeof window !== "undefined" ? window.location.search : "";

    const query = new URLSearchParams(search);
    const frag = new URLSearchParams(hash.replace(/^#/, ""));

    const pick = (key: string) => query.get(key) || frag.get(key);

    const params = new URLSearchParams();
    const keys = [
      "code",
      "access_token",
      "refresh_token",
      "type",
      "token_hash",
      "error",
      "error_description",
    ] as const;

    for (const key of keys) {
      const value = pick(key);
      if (value) params.set(key, value);
    }

    // Default type for recovery sessions when tokens present
    if (
      !params.get("type") &&
      (params.get("access_token") || params.get("code") || params.get("token_hash"))
    ) {
      params.set("type", "recovery");
    }

    if (!params.toString()) {
      setStatus(
        "No recovery parameters found. Request a new password reset from the app."
      );
      return;
    }

    const deepLink = `banglartournaments://reset-password?${params.toString()}`;
    setManual(deepLink);

    // Attempt automatic open
    window.location.href = deepLink;

    // Fallback message after a moment
    const t = window.setTimeout(() => {
      setStatus(
        "If the app did not open, tap the button below. Make sure BANGLAR TOURNAMENTS is installed."
      );
    }, 1500);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0B1221",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <p
          style={{
            color: "#FF5C00",
            fontWeight: 800,
            letterSpacing: 2,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          BANGLAR TOURNAMENTS
        </p>
        <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>Password reset</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          {status}
        </p>
        {manual ? (
          <a
            href={manual}
            style={{
              display: "inline-block",
              marginTop: 24,
              padding: "12px 20px",
              borderRadius: 12,
              background: "linear-gradient(90deg,#FF5C00,#FF8A00)",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Open app to set new password
          </a>
        ) : null}
      </div>
    </main>
  );
}
