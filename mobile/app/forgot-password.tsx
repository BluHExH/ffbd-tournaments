import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/UI";
import { AuthLayout, authStyles as s } from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
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
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(normalizedEmail);

      if (resetError) {
        setError(
          resetError.message.toLowerCase().includes("rate limit")
            ? "Please wait before requesting another code."
            : "Unable to send a verification code right now. Please try again."
        );
        return;
      }

      // Keep the response generic to avoid revealing whether an email is registered.
      router.push({
        pathname: "/reset-password",
        params: { email: normalizedEmail },
      });
    } catch {
      setError("Unable to send a verification code right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY"
      title="Forgot your password?"
      description="Enter the email address linked to your player account. We will send a 6-digit verification code."
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
        SEND VERIFICATION CODE
      </Button>
    </AuthLayout>
  );
}
