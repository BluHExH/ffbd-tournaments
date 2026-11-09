"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function LiveBadge({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        "live-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-xs font-bold tracking-wide",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {t("common.live")}
    </span>
  );
}
