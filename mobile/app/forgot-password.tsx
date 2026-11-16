import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/UI";
import { AuthLayout, authStyles as s } from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

const RECOVERY_REDIRECT = "banglartournaments://reset-password";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const normalizedEmail = email.trim().toLowerCase();

    if (!supabase) {
      setError("App connection is not configured.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo: RECOVERY_REDIRECT }
      );

      if (resetError) {
        setError(
          resetError.message.toLowerCase().includes("rate limit")
            ? "Please wait before requesting another reset link."
            : "Unable to send a reset link right now. Please try again."
        );
        return;
      }

      setEmail(normalizedEmail);
      setSent(true);
    } catch {
      setError("Unable to send a reset link right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY"
      title={sent ? "Check your email" : "Forgot your password?"}
      description={
        sent
          ? "If an account exists for this email, a password reset link has been sent. Open the email on this same phone and tap the reset link to return to the app."
          : "Enter the email address linked to your player account. We will send you a secure password reset link."
      }
      footer="Remembered your password?"
      footerAction={t("auth.login")}
      onFooterPress={() => router.replace("/login")}
    >
      <View style={{ gap: 7 }}>
        <Text style={s.fieldLabel}>{t("auth.email").toUpperCase()}</Text>
        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setSent(false);
            setError("");
          }}
          placeholder={t("auth.emailPlaceholder")}
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          style={s.input}
          editable={!busy}
          onSubmitEditing={submit}
          returnKeyType="send"
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : null}
      <Button loading={busy} disabled={busy} onPress={submit}>
        {sent ? "RESEND RESET LINK" : "SEND RESET LINK"}
      </Button>
      {sent ? (
        <Button
          disabled={busy}
          onPress={() => router.replace("/reset-password")}
        >
          I HAVE OPENED THE RESET LINK
        </Button>
      ) : null}
    </AuthLayout>
  );
}
