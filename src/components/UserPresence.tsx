"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserPresence() {
  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let mounted = true;

    const touch = async () => {
      if (!mounted || !userId || document.visibilityState !== "visible") return;
      await supabase.rpc("touch_my_presence", { p_platform: "web" });
    };

    const setUser = (nextId: string | null) => {
      userId = nextId;
      if (timer) clearInterval(timer);
      timer = null;
      if (!userId) return;
      void touch();
      timer = setInterval(() => { void touch(); }, 60_000);
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user.id ?? null);
    });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user.id ?? null);
    });
    const onVisibility = () => { if (document.visibilityState === "visible") void touch(); };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      auth.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
