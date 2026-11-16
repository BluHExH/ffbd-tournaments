"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Metrics = { total_users: number; active_users: number };

export function LiveUserMetrics() {
  const [db] = useState(() => createClient());
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await db.rpc("admin_user_metrics");
    if (error) {
      setMetrics(null);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      setMetrics(null);
      return;
    }
    setMetrics({
      total_users: Number(row.total_users ?? 0),
      active_users: Number(row.active_users ?? 0),
    });
    setUpdatedAt(new Date());
  }, [db]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const cards = [
    {
      label: "Registered users",
      value: metrics ? metrics.total_users.toLocaleString("en-BD") : "—",
      detail: "All registered platform accounts",
      Icon: Users,
      live: false,
    },
    {
      label: "Active now",
      value: metrics ? metrics.active_users.toLocaleString("en-BD") : "—",
      detail: "Seen within the last 5 minutes",
      Icon: Activity,
      live: true,
    },
  ];

  return (
    <section aria-label="Live user statistics" className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map(({ label, value, detail, Icon, live }) => (
        <div key={label} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121C2E] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
          <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-[#FF5C00]/[0.06] blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white/45">{label}</p>
              <p className={`mt-3 font-heading text-3xl font-bold tracking-tight ${live ? "text-red-400" : "text-white"}`}>{value}</p>
              <p className="mt-1.5 text-[11px] text-white/30">{detail}</p>
              <p className="mt-2 text-[10px] text-white/25">
                {updatedAt ? `Updated ${updatedAt.toLocaleTimeString("en-GB")}` : "Waiting for secure metrics…"}
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${live ? "border-red-400/20 bg-red-400/10 text-red-400" : "border-[#FF5C00]/20 bg-[#FF5C00]/10 text-[#FF7130]"}`}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
