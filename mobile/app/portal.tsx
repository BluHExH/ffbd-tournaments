import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { theme } from "@/lib/theme";

export default function DashboardPortal() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const verifyAdmin = async () => {
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      if (adminError || !admin) {
        router.replace("/(tabs)");
        return;
      }

      setAuthorized(true);
      setChecking(false);
    };

    void verifyAdmin();
    return () => {
      active = false;
    };
  }, []);

  if (checking || !authorized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Verifying secure access…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Ionicons name="shield-checkmark" size={28} color={theme.accent} />
        </View>
        <Text style={styles.eyebrow}>BANGLAR TOURNAMENTS</Text>
        <Text style={styles.title}>Welcome, Admin</Text>
        <Text style={styles.subtitle}>Choose where you want to continue</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/admin")}
        style={({ pressed }) => [styles.option, styles.adminOption, pressed && styles.pressed]}
      >
        <View style={styles.optionIcon}>
          <Ionicons name="shield-checkmark" size={25} color={theme.accent} />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>Admin Dashboard</Text>
          <Text style={styles.optionDescription}>Manage tournaments, players, payments and results</Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color={theme.muted} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace("/(tabs)")}
        style={({ pressed }) => [styles.option, pressed && styles.pressed]}
      >
        <View style={styles.optionIcon}>
          <Ionicons name="person" size={25} color={theme.text} />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>Player Dashboard</Text>
          <Text style={styles.optionDescription}>Browse tournaments and use your player account</Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color={theme.muted} />
      </Pressable>

      <Text style={styles.footer}>Authorized administrators only</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 22, justifyContent: "center", gap: 14 },
  loading: { flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: theme.muted, fontSize: 12, fontWeight: "600" },
  brand: { alignItems: "center", marginBottom: 22 },
  brandIcon: { width: 62, height: 62, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,92,0,.12)", borderWidth: 1, borderColor: "rgba(255,92,0,.28)", marginBottom: 17 },
  eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  title: { color: theme.text, fontSize: 27, fontWeight: "900", marginTop: 8 },
  subtitle: { color: theme.muted, fontSize: 13, marginTop: 6 },
  option: { minHeight: 94, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, padding: 16, flexDirection: "row", alignItems: "center", gap: 13 },
  adminOption: { borderColor: "rgba(255,92,0,.4)" },
  optionIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.055)" },
  optionCopy: { flex: 1, gap: 5 },
  optionTitle: { color: theme.text, fontSize: 15, fontWeight: "900" },
  optionDescription: { color: theme.muted, fontSize: 11, lineHeight: 16 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  footer: { color: theme.muted, fontSize: 10, textAlign: "center", marginTop: 18, letterSpacing: 0.5 },
});
