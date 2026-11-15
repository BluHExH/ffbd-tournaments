import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/UI";
import { AuthLayout, authStyles as s } from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

/**
 * Redirect through the website bridge so Android receives query params.
 * Direct custom-scheme links often lose #access_token fragments.
 */
const RECOVERY_REDIRECT =
  "https://ffbd-tournaments.vercel.app/auth/mobile-reset";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!supabase) {
      setError("App connection is not configured.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter the email address linked to your account.");
      return;
    }
    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: RECOVERY_REDIRECT }
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSuccess(
        "If an account exists for this email, a reset link has been sent. Open the latest email on this device, then choose a new password."
      );
    } catch {
      setError("Unable to send the reset email right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY"
      title="Forgot your password?"
      description="Enter the email address linked to your player account."
      footer="Remembered your password?"
      footerAction={t("auth.login")}
      onFooterPress={() => router.replace("/login")}
    >
      <View style={{ gap: 7 }}>
        <Text style={s.fieldLabel}>{t("auth.email").toUpperCase()}</Text>
        <TextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError("");
            setSuccess("");
          }}
          placeholder={t("auth.emailPlaceholder")}
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          style={s.input}
          onSubmitEditing={submit}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : null}
      {success ? (
        <Text accessibilityRole="alert" style={s.success}>
          {success}
        </Text>
      ) : null}
      <Button loading={busy} disabled={busy} onPress={submit}>
        SEND RESET LINK
      </Button>
    </AuthLayout>
  );
}
