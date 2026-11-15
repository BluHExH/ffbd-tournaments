import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ExpoLinking from "expo-linking";
import { Button } from "@/components/UI";
import { AuthLayout, authStyles as s } from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";
import { theme } from "@/lib/theme";
import {
  consumePendingRecoveryUrl,
  hasRecoverablePayload,
  parseRecoveryParams,
  parseRecoveryUrl,
  type RecoveryParts,
} from "@/lib/recovery";

type RouteParams = {
  code?: string | string[];
  access_token?: string | string[];
  refresh_token?: string | string[];
  type?: string | string[];
  token_hash?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
};

export default function ResetPassword() {
  const params = useLocalSearchParams<RouteParams>();
  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [diag, setDiag] = useState("");
  const processing = useRef(false);
  const verified = useRef(false);

  useEffect(() => {
    let active = true;
    let noLinkTimer: ReturnType<typeof setTimeout> | undefined;

    const establishSession = async (parts: RecoveryParts) => {
      if (!active || verified.current || processing.current) return;
      if (!hasRecoverablePayload(parts)) return;

      if (parts.error) {
        setError(parts.errorDescription || parts.error);
        setReady(true);
        return;
      }

      if (!supabase) {
        setError("App connection is not configured.");
        setReady(true);
        return;
      }

      processing.current = true;
      try {
        let authError: Error | null = null;

        if (parts.code) {
          const result = await supabase.auth.exchangeCodeForSession(parts.code);
          authError = result.error;
        } else if (parts.tokenHash) {
          const result = await supabase.auth.verifyOtp({
            token_hash: parts.tokenHash,
            type: "recovery",
          });
          authError = result.error;
        } else if (parts.accessToken && parts.refreshToken) {
          const result = await supabase.auth.setSession({
            access_token: parts.accessToken,
            refresh_token: parts.refreshToken,
          });
          authError = result.error;
        }

        if (authError) throw authError;

        // Confirm a session exists before showing password fields
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          throw new Error(
            "Recovery session was not established. Request a new reset email."
          );
        }

        verified.current = true;
        if (active) {
          if (noLinkTimer) clearTimeout(noLinkTimer);
          setLinkValid(true);
          setReady(true);
          setError("");
          setDiag("");
        }
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not verify the reset link. Request a new link."
          );
          setReady(true);
        }
      } finally {
        processing.current = false;
      }
    };

    const tryUrl = (rawUrl: string | null | undefined) => {
      if (!rawUrl) return;
      try {
        const parts = parseRecoveryUrl(rawUrl);
        if (hasRecoverablePayload(parts)) {
          setDiag(`keys:${parts.presentKeys.join(",") || "none"}`);
          void establishSession(parts);
        }
      } catch {
        /* ignore malformed */
      }
    };

    // 1) URL captured at app root (cold start race fix)
    tryUrl(consumePendingRecoveryUrl());

    // 2) Expo Router route params (query from deep link)
    const routeParts = parseRecoveryParams({
      code: params.code,
      access_token: params.access_token,
      refresh_token: params.refresh_token,
      type: params.type,
      token_hash: params.token_hash,
      error: params.error,
      error_description: params.error_description,
    });
    if (hasRecoverablePayload(routeParts)) {
      setDiag(`keys:${routeParts.presentKeys.join(",") || "none"}`);
      void establishSession(routeParts);
    }

    // 3) React Native Linking (warm + cold)
    const sub = Linking.addEventListener("url", (event) => tryUrl(event.url));
    void Linking.getInitialURL().then(tryUrl).catch(() => {});

    // 4) expo-linking current URL
    try {
      const expoUrl = ExpoLinking.getLinkingURL();
      tryUrl(expoUrl);
    } catch {
      /* older expo */
    }

    // 5) Already have a session (e.g. prior successful exchange)
    void (async () => {
      if (!supabase || verified.current) return;
      const { data } = await supabase.auth.getSession();
      if (data.session && active && !verified.current) {
        // Only treat as recovery if we arrived on this screen intentionally
        // Prefer explicit link verification; session alone is a soft allow
        verified.current = true;
        setLinkValid(true);
        setReady(true);
      }
    })();

    noLinkTimer = setTimeout(() => {
      if (active && !verified.current && !processing.current) {
        setError(
          "No reset link was received. Open the latest reset email link again, or request a new password reset email."
        );
        setReady(true);
      }
    }, 2500);

    return () => {
      active = false;
      if (noLinkTimer) clearTimeout(noLinkTimer);
      sub.remove();
    };
  }, [
    params.code,
    params.access_token,
    params.refresh_token,
    params.type,
    params.token_hash,
    params.error,
    params.error_description,
  ]);

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!supabase) {
      setError("App connection is not configured.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess(
        "Your password has been changed successfully. You can now sign in with your new password."
      );
      await supabase.auth.signOut();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update your password. Request a new reset link."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0B1221",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.accent} />
        <Text style={{ color: "#94A3B8", marginTop: 12 }}>
          Verifying reset link…
        </Text>
      </View>
    );
  }

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY"
      title="Set a new password"
      description="Choose a new password for your BANGLAR TOURNAMENTS account."
      footer="Remembered your password?"
      footerAction="Back to login"
      onFooterPress={() => router.replace("/login")}
    >
      {success ? (
        <>
          <Text accessibilityRole="alert" style={s.success}>
            {success}
          </Text>
          <Button onPress={() => router.replace("/login")}>GO TO LOGIN</Button>
        </>
      ) : linkValid ? (
        <>
          <View style={{ gap: 7 }}>
            <Text style={s.fieldLabel}>NEW PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError("");
              }}
              placeholder="At least 8 characters"
              placeholderTextColor="#64748B"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              style={s.input}
            />
          </View>
          <View style={{ gap: 7 }}>
            <Text style={s.fieldLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              value={confirm}
              onChangeText={(v) => {
                setConfirm(v);
                setError("");
              }}
              placeholder="Enter password again"
              placeholderTextColor="#64748B"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              style={s.input}
            />
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          <Button loading={busy} disabled={busy} onPress={submit}>
            UPDATE PASSWORD
          </Button>
        </>
      ) : (
        <>
          <Text accessibilityRole="alert" style={s.error}>
            {error ||
              "Open the password reset link from your email on this device."}
          </Text>
          {diag ? (
            <Text style={{ color: "#64748B", fontSize: 11 }}>
              Diagnostic: {diag}
            </Text>
          ) : null}
          <Button onPress={() => router.replace("/forgot-password")}>
            REQUEST NEW RESET LINK
          </Button>
        </>
      )}
    </AuthLayout>
  );
}
