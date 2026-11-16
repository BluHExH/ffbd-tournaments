import { useEffect, useState, type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { LanguageProvider } from "@/lib/i18n";
import { setPendingRecoveryUrl } from "@/lib/recovery";

function StartupScreen() {
  return (
    <View style={styles.startup}>
      <Image
        source={require("../banglar-tournaments-app-icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.brand}>
        BANGLAR <Text style={styles.accent}>TOURNAMENTS</Text>
      </Text>
      <ActivityIndicator size="small" color={theme.accent} style={styles.spinner} />
      <Text style={styles.caption}>GETTING THINGS READY…</Text>
    </View>
  );
}

function isRecoveryUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const value = url.toLowerCase();
  return (
    value.includes("reset-password") ||
    value.includes("type=recovery") ||
    value.includes("token_hash=") ||
    value.includes("access_token=")
  );
}

function AuthGate({ children }: PropsWithChildren) {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Capture recovery links before navigation (cold start + warm app).
  useEffect(() => {
    let active = true;

    const handle = (url: string | null) => {
      if (!url || !active || !isRecoveryUrl(url)) return;
      // The reset screen also listens for warm links. Keep a pending URL only
      // when navigating to that screen from somewhere else.
      if ((segments[0] as string | undefined) !== "reset-password") {
        setPendingRecoveryUrl(url);
      }
      router.replace("/reset-password");
    };

    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    void Linking.getInitialURL()
      .then(handle)
      .catch(() => {});

    return () => {
      active = false;
      sub.remove();
    };
  }, [router, segments]);

  useEffect(() => {
    if (!supabase) {
      setHasSession(false);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data.session));
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) setHasSession(Boolean(session));
      }
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hasSession === null) return;
    let active = true;
    const first = segments[0] as string | undefined;
    const recoveryRoute = first === "reset-password";
    const authRoute =
      first === "login" ||
      first === "register" ||
      first === "forgot-password" ||
      recoveryRoute;

    const routeUser = async () => {
      if (
        hasSession &&
        (!first || first === "index" || authRoute) &&
        !recoveryRoute
      ) {
        if (first === "login" && supabase) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!active) return;
          if (user) {
            const { data: admin } = await supabase
              .from("admins")
              .select("id")
              .eq("id", user.id)
              .maybeSingle();
            if (!active) return;
            router.replace(admin ? "/portal" : "/(tabs)");
            return;
          }
        }
        router.replace("/(tabs)");
        return;
      }
      if (!hasSession && !authRoute) router.replace("/login");
    };
    void routeUser();
    return () => {
      active = false;
    };
  }, [hasSession, segments, router]);

  if (hasSession === null) return <StartupScreen />;

  const first = segments[0] as string | undefined;
  const recoveryRoute = first === "reset-password";
  const authRoute =
    first === "login" ||
    first === "register" ||
    first === "forgot-password" ||
    recoveryRoute;

  if ((hasSession && authRoute && !recoveryRoute) || (!hasSession && !authRoute))
    return <StartupScreen />;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="portal" />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  startup: {
    flex: 1,
    backgroundColor: "#07110B",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 96, height: 96, marginBottom: 18 },
  brand: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  accent: { color: theme.accent },
  spinner: { marginTop: 34 },
  caption: {
    marginTop: 12,
    color: "rgba(255,255,255,.42)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
