import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/UI";
import { AuthLayout, authStyles as s } from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";
import { theme } from "@/lib/theme";

type RouteParams = {
  email?: string | string[];
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function ResetPassword() {
  const params = useLocalSearchParams<RouteParams>();
  const email = (first(params.email) || "").trim().toLowerCase();

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!email) {
      setError("Enter your account email to request a verification code.");
    }
  }, [email]);

  const verifyCode = async () => {
    setError("");
    if (!supabase) {
      setError("App connection is not configured.");
      return;
    }
    if (!email) {
      setError("Your email address is missing. Request a new code.");
      return;
    }
    const code = otp.replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }

    setVerifying(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });

      if (verifyError || !data.session || !data.user) {
        throw verifyError || new Error("The verification code is invalid or expired.");
      }

      if (data.user.email?.toLowerCase() !== email) {
        await supabase.auth.signOut();
        throw new Error("The verification code does not match this email address.");
      }

      setVerified(true);
      setOtp("");
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The code could not be verified. Request a new code and try again."
      );
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    setError("");
    if (!supabase || !email) {
      setError("Return to the previous screen and enter your email address.");
      return;
    }

    setBusy(true);
    try {
      const { error: resendError } =
        await supabase.auth.resetPasswordForEmail(email);
      if (resendError) {
        setError(
          resendError.message.toLowerCase().includes("rate limit")
            ? "Please wait before requesting another code."
            : "Unable to send a new code right now. Please try again."
        );
        return;
      }
      setOtp("");
      setError("If an account exists for this email, a new code has been sent.");
    } catch {
      setError("Unable to send a new code right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async () => {
    setError("");
    setSuccess("");
    if (!supabase) {
      setError("App connection is not configured.");
      return;
    }
    if (!verified) {
      setError("Verify your email code before choosing a new password.");
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
      // Password update has succeeded; clear the recovery session.
      await supabase.auth.signOut().catch(() => undefined);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update your password. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!email) {
    return (
      <AuthLayout
        eyebrow="ACCOUNT RECOVERY"
        title="Email required"
        description="Return to the previous screen and enter the email address linked to your account."
        footer="Remembered your password?"
        footerAction="Back to login"
        onFooterPress={() => router.replace("/login")}
      >
        <Button onPress={() => router.replace("/forgot-password")}>
          ENTER EMAIL
        </Button>
      </AuthLayout>
    );
  }

  if (verifying) {
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
          Verifying your code…
        </Text>
      </View>
    );
  }

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY"
      title={success ? "Password updated" : verified ? "Set a new password" : "Verify your email"}
      description={
        success
          ? "Your account is ready. Sign in with your new password."
          : verified
            ? "Choose a new password for your BANGLAR TOURNAMENTS account."
            : `Enter the 6-digit code sent to ${email}.`
      }
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
      ) : verified ? (
        <>
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
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          <Button loading={busy} disabled={busy} onPress={submitPassword}>
            UPDATE PASSWORD
          </Button>
        </>
      ) : (
        <>
          <View style={{ gap: 7 }}>
            <Text style={s.fieldLabel}>6-DIGIT VERIFICATION CODE</Text>
            <TextInput
              value={otp}
              onChangeText={(value) => {
                setOtp(value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="000000"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={6}
              style={s.input}
              editable={!verifying && !busy}
            />
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          <Button loading={verifying} disabled={verifying || busy} onPress={verifyCode}>
            VERIFY CODE
          </Button>
          <Button
            variant="secondary"
            loading={busy}
            disabled={busy || verifying}
            onPress={resendCode}
          >
            RESEND CODE
          </Button>
        </>
      )}
    </AuthLayout>
  );
}
