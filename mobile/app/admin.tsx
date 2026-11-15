import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import { supabase } from "@/lib/supabase";
import { theme } from "@/lib/theme";

const ADMIN_ORIGIN = "https://ffbd-tournaments.vercel.app";
const ADMIN_URL = `${ADMIN_ORIGIN}/admin`;

export default function Admin() {
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const verifyNativeAdmin = async () => {
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
      setCheckingAccess(false);
    };

    void verifyNativeAdmin();
    return () => {
      active = false;
    };
  }, []);

  if (checkingAccess || !authorized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Verifying administrator access…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>BANGLAR ADMIN</Text>
          <Text style={styles.subtitle}>SECURE CONTROL CENTER</Text>
        </View>
        <Pressable onPress={() => { setError(false); setLoading(true); setReloadKey((v) => v + 1); }} style={styles.reload}>
          <Text style={styles.reloadText}>↻</Text>
        </Pressable>
      </View>
      {error ? (
        <View style={styles.message}>
          <Text style={styles.messageTitle}>Could not load Admin Dashboard</Text>
          <Text style={styles.messageBody}>Check your internet connection and try again.</Text>
          <Pressable onPress={() => { setError(false); setLoading(true); setReloadKey((v) => v + 1); }} style={styles.retry}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.webContainer}>
          <WebView
            key={reloadKey}
            source={{ uri: ADMIN_URL }}
            style={styles.web}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            cacheEnabled
            cacheMode="LOAD_DEFAULT"
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures
            originWhitelist={[ADMIN_ORIGIN]}
            onShouldStartLoadWithRequest={(request) =>
              request.url === ADMIN_ORIGIN ||
              request.url.startsWith(`${ADMIN_ORIGIN}/`)
            }
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            onHttpError={(event) => {
              const failedUrl = event.nativeEvent.url;
              const isAdminDocument = failedUrl === ADMIN_URL || failedUrl.startsWith(`${ADMIN_URL}/`);
              if (isAdminDocument && event.nativeEvent.statusCode >= 500) {
                setLoading(false);
                setError(true);
              }
            }}
            startInLoadingState
          />
          {loading && (
            <View pointerEvents="none" style={styles.loading}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={styles.loadingText}>Opening secure admin panel…</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  header: { height: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.09)", backgroundColor: "#0B1221" },
  back: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "rgba(255,255,255,.06)" },
  backText: { color: "#fff", fontSize: 30, lineHeight: 32 },
  heading: { flex: 1, paddingLeft: 12 },
  title: { color: "#fff", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: "rgba(255,255,255,.4)", fontSize: 8, fontWeight: "800", letterSpacing: 1.6, marginTop: 3 },
  reload: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "rgba(255,255,255,.06)" },
  reloadText: { color: theme.accent, fontSize: 24, fontWeight: "700" },
  webContainer: { flex: 1 },
  web: { flex: 1, backgroundColor: "#0B1221" },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#0B1221" },
  loadingText: { color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: "600" },
  message: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  messageTitle: { color: "#fff", fontSize: 17, fontWeight: "900", textAlign: "center" },
  messageBody: { color: "rgba(255,255,255,.55)", fontSize: 13, textAlign: "center", marginTop: 8 },
  retry: { marginTop: 20, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.accent },
  retryText: { color: "#111827", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
});
