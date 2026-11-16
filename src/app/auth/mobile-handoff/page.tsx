"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type NativeBridgeWindow = Window & {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
};

function isHandoffCode(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

export default function MobileAdminHandoffPage() {
  const [status, setStatus] = useState("Checking your existing Admin session…");
  const [mode, setMode] = useState<"checking" | "waiting" | "working" | "other-account" | "error">("checking");
  const started = useRef(false);
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    clientRef.current = supabase;
    let active = true;

    const showError = (message: string) => {
      if (!active) return;
      setStatus(message);
      setMode("error");
    };

    const notifyNativeReady = () => {
      const bridge = (window as NativeBridgeWindow).ReactNativeWebView;
      if (!bridge) {
        showError("Open Admin Dashboard from the BANGLAR TOURNAMENTS app to continue.");
        return;
      }
      setStatus("Preparing a secure, one-time sign-in…");
      setMode("waiting");
      bridge.postMessage("BT_ADMIN_HANDOFF_READY");
    };

    const redeem = async (code: string) => {
      setMode("working");
      setStatus("Securing your Admin session…");

      const { data, error } = await supabase.functions.invoke(
        "admin-handoff-redeem",
        { body: { code } },
      );

      if (error || typeof data?.tokenHash !== "string" || !data.tokenHash) {
        showError("The secure sign-in expired or could not be completed. Reopen Admin Dashboard in the app.");
        return;
      }

      const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: "magiclink",
      });

      if (verifyError || !verified.user) {
        showError("The one-time sign-in could not be verified. Reopen Admin Dashboard in the app.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();
        showError("The Admin session could not be confirmed. Please try again.");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (adminError || !admin) {
        await supabase.auth.signOut();
        showError("This account is not authorized for the Admin Panel.");
        return;
      }

      const { data: aal, error: aalError } = await supabase.auth.mfa
        .getAuthenticatorAssuranceLevel();

      if (aalError || !aal) {
        showError("Could not verify the Admin security level. Please try again.");
        return;
      }

      // A handoff creates only an AAL1 browser session. The existing Admin
      // login flow must still complete TOTP and reach AAL2 before any admin
      // page or data is served.
      window.location.replace(
        aal.currentLevel === "aal2" ? "/admin" : "/admin/login?step=mfa",
      );
    };

    const handleHandoff = (event: Event) => {
      const code = (event as CustomEvent<{ code?: unknown }>).detail?.code;
      if (!isHandoffCode(code) || started.current) return;
      started.current = true;
      void redeem(code);
    };

    const handleHandoffError = () => {
      showError("Secure sign-in is unavailable right now. You can sign in with your Admin password instead.");
    };

    window.addEventListener("bt-admin-handoff", handleHandoff);
    window.addEventListener("bt-admin-handoff-error", handleHandoffError);

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (user) {
        const { data: admin, error: adminError } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) return;

        if (adminError) {
          showError("Could not verify the existing website session. Please reload.");
          return;
        }

        if (admin) {
          const { data: aal, error: aalError } = await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel();

          if (!active) return;

          if (aalError || !aal) {
            showError("Could not verify the existing Admin security level. Please reload.");
            return;
          }

          window.location.replace(
            aal.currentLevel === "aal2" ? "/admin" : "/admin/login?step=mfa",
          );
          return;
        }

        setStatus("A different website account is signed in. Sign it out to continue with the Admin account from the app.");
        setMode("other-account");
        return;
      }

      notifyNativeReady();
    })().catch(() => {
      showError("Could not prepare the secure Admin session. Please reload.");
    });

    return () => {
      active = false;
      window.removeEventListener("bt-admin-handoff", handleHandoff);
      window.removeEventListener("bt-admin-handoff-error", handleHandoffError);
    };
  }, []);

  const signOutOtherAccount = async () => {
    const supabase = clientRef.current;
    if (!supabase) return;

    setMode("working");
    setStatus("Signing out the other website account…");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMode("error");
      setStatus("Could not sign out the other website account. Please sign out and reopen Admin Dashboard.");
      return;
    }

    const bridge = (window as NativeBridgeWindow).ReactNativeWebView;
    if (!bridge) {
      setMode("error");
      setStatus("Return to the BANGLAR TOURNAMENTS app and reopen Admin Dashboard.");
      return;
    }

    setMode("waiting");
    setStatus("Preparing a secure, one-time sign-in…");
    bridge.postMessage("BT_ADMIN_HANDOFF_READY");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1221] px-5 py-12 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121C2E] p-7 text-center shadow-2xl">
        <p className="text-[10px] font-black tracking-[0.24em] text-[#FF7130]">
          BANGLAR TOURNAMENTS
        </p>
        <h1 className="mt-3 text-xl font-bold">Secure Admin sign-in</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">{status}</p>

        {mode === "other-account" ? (
          <button
            type="button"
            onClick={signOutOtherAccount}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] px-4 py-3 text-sm font-bold text-white"
          >
            SIGN OUT AND CONTINUE
          </button>
        ) : null}

        {mode === "error" ? (
          <Link
            href="/admin/login"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] px-4 py-3 text-sm font-bold text-white"
          >
            OPEN ADMIN LOGIN
          </Link>
        ) : null}

        {mode === "checking" || mode === "waiting" || mode === "working" ? (
          <div className="mt-6 flex justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#FF7130]" />
          </div>
        ) : null}
      </div>
    </main>
  );
}
