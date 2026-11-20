import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/UI";
import { AuthLayout, authStyles as s } from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";
import {
  consumePendingRecoveryUrl,
  hasRecoverablePayload,
  parseRecoveryParams,
  parseRecoveryUrl,
  type RecoveryParts,
} from "@/lib/recovery";

type RouteParams = {
  email?: string | string[];
  code?: string | string[];
  access_token?: string | string[];
  refresh_token?: string | string[];
  token_hash?: string | string[];
  type?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function ResetPassword() {
  const params = useLocalSearchParams<RouteParams>();
  const email = (first(params.email) || "").trim().toLowerCase();
  const [verified, setVerified] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const processedRef = useRef<string | null>(null);

  const processRecovery = useCallback(async (parts: RecoveryParts) => {
    const key =
      parts.code ||
      parts.tokenHash ||
      parts.accessToken ||
      (parts.error ? "recovery-error" : null);
    if (!key || processedRef.current === key) return;

    processedRef.current = key;
    setProcessing(true);
    setError("");

    try {
      if (!supabase) throw new Error("App connection is not configured.");
      if (parts.error) {
        throw new Error("This password reset link is invalid or expired. Request a new link.");
      }
      if (parts.type && parts.type !== "recovery") {
        throw new Error("This link is not a password reset link. Request a new one.");
      }

      if (parts.code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(parts.code);
        if (exchangeError) throw exchangeError;
      } else if (parts.tokenHash && (!parts.type || parts.type === "recovery")) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: parts.tokenHash,
          type: "recovery",
        });
        if (verifyError) throw verifyError;
      } else if (parts.accessToken && parts.refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: parts.accessToken,
          refresh_token: parts.refreshToken,
        });
        if (sessionError) throw sessionError;
      } else {
        throw new Error("The reset link did not contain a valid recovery code.");
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        throw userError || new Error("The recovery session could not be verified.");
      }
      if (email && data.user.email?.toLowerCase() !== email) {
        await supabase.auth.signOut();
        throw new Error("This reset link belongs to a different account.");
      }

      setVerified(true);
      setError("");
    } catch {
      processedRef.current = null;
      setError("This reset link is invalid, expired, or already used. Request a new reset link and open it on this phone.");
    } finally {
      setProcessing(false);
    }
  }, [email]);

  useEffect(() => {
    let active = true;
    const handleUrl = (url: string) => {
      if (!active) return;
      const parts = parseRecoveryUrl(url);
      if (hasRecoverablePayload(parts)) void processRecovery(parts);
    };

    const pending = consumePendingRecoveryUrl();
    if (pending) {
      handleUrl(pending);
    } else {
      const routeParts = parseRecoveryParams(
        params as Record<string, string | string[] | undefined>
      );
      if (hasRecoverablePayload(routeParts)) {
        void processRecovery(routeParts);
      } else {
        void Linking.getInitialURL()
          .then((url) => {
            if (url) handleUrl(url);
          })
          .catch(() => undefined);
      }
    }

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [
    processRecovery,
    params,
    params.code,
    params.access_token,
    params.refresh_token,
    params.token_hash,
    params.type,
    params.error,
    params.error_description,
  ]);

  const submitPassword = async () => {
    setError("");
    setSuccess("");
    if (!supabase) {
      setError("App connection is not configured.");
      return;
    }
    if (!verified) {
      setError("Open and verify the password reset link before choosing a new password.");
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

      setSuccess("Your password has been changed successfully. You can now sign in with your new password.");
      await supabase.auth.signOut().catch(() => undefined);
    } catch {
      setError("Unable to update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        eyebrow="ACCOUNT RECOVERY"
        title="Password updated"
        description="Your account is ready. Sign in with your new password."
        footer="Return to your account"
        footerAction="Back to login"
        onFooterPress={() => router.replace("/login")}
      >
        <Text accessibilityRole="alert" style={s.success}>{success}</Text>
        <Button onPress={() => router.replace("/login")}>GO TO LOGIN</Button>
      </AuthLayout>
    );
  }

  if (!verified) {
    return (
      <AuthLayout
        eyebrow="ACCOUNT RECOVERY"
        title={processing ? "Verifying reset link" : "Open your reset link"}
        description={
          processing
            ? "Please wait while we securely verify your password reset link."
            : "We are waiting for the secure reset link from your email. Open the latest reset email on this same phone and tap its reset button. The link will bring you back here."
        }
        footer="Remembered your password?"
        footerAction="Back to login"
        onFooterPress={() => router.replace("/login")}
      >
        {error ? (
          <Text accessibilityRole="alert" style={s.error}>{error}</Text>
        ) : null}
        <Button
          disabled={processing}
          onPress={() => router.replace("/forgot-password")}
        >
          REQUEST A NEW RESET LINK
        </Button>
      </AuthLayout>
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
      <View style={{ gap: 7 }}>
        <Text style={s.fieldLabel}>NEW PASSWORD</Text>
        <TextInput
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError("");
          }}
          placeholder="At least 8 characters"
          placeholderTextColor="#64748B"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          style={s.input}
          editable={!busy}
        />
      </View>
      <View style={{ gap: 7 }}>
        <Text style={s.fieldLabel}>CONFIRM NEW PASSWORD</Text>
        <TextInput
          value={confirm}
          onChangeText={(value) => {
            setConfirm(value);
            setError("");
          }}
          placeholder="Enter password again"
          placeholderTextColor="#64748B"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          style={s.input}
          editable={!busy}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>{error}</Text>
      ) : null}
      <Button loading={busy} disabled={busy} onPress={submitPassword}>
        UPDATE PASSWORD
      </Button>
    </AuthLayout>
  );
}
