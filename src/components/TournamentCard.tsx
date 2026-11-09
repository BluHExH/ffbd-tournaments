"use client";

import Link from "next/link";
import { Users, Swords, MapPin } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { useLanguage } from "@/context/LanguageContext";
import { formatBDT, cn } from "@/lib/utils";
import LiveBadge from "./LiveBadge";
import PrizeBadge from "./PrizeBadge";
import CountdownTimer from "./CountdownTimer";

interface Props {
  tournament: Tournament;
  className?: string;
  fluid?: boolean;
}

export default function TournamentCard({
  tournament: t,
  className,
  fluid = false,
}: Props) {
  const { lang, t: tr } = useLanguage();
  const title = lang === "bn" ? t.titleBn : t.title;
  const slotsLeft = Math.max(0, t.slots - t.slotsFilled);
  const isFree = t.entryFee === 0;
  const isFull = t.slotsFilled >= t.slots;

  return (
    <article
      className={cn(
        "card-dark flex flex-col overflow-hidden group hover:border-[#FF5C00]/40 transition-all duration-300",
        fluid ? "w-full" : "min-w-[280px] w-[280px] sm:w-[300px] shrink-0",
        className
      )}
    >
      <Link href={`/tournaments/${t.slug}`} className="block relative h-36 bg-gradient-to-br from-[#1A2332] to-[#0B1221] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,92,0,0.25),_transparent_60%)]" />
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {t.status === "live" && <LiveBadge />}
          {t.status === "ended" && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-500/30 text-slate-300 border border-slate-500/40">
              {tr("common.ended")}
            </span>
          )}
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide",
              isFree
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            )}
          >
            {isFree ? tr("common.free") : tr("common.paid")}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end gap-2">
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-white/80 bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">
              {t.mode}
            </span>
            <span className="text-xs font-semibold text-white/70 bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {t.map}
            </span>
          </div>
          {t.status !== "ended" && (
            <CountdownTimer
              target={t.startAt}
              compact
              className="text-white bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm"
            />
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <Link href={`/tournaments/${t.slug}`}>
          <h3 className="font-heading text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-[#FF5C00] transition-colors">
            {title}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-white/60">
            <Swords className="w-3.5 h-3.5" />
            <span>{formatBDT(t.prizePool)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/60">
            <Users className="w-3.5 h-3.5" />
            <span>
              {isFull ? "Full" : `${slotsLeft} ${tr("common.slots")}`}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <PrizeBadge amount={t.prizePool} />
          <Link
            href={`/tournaments/${t.slug}`}
            className="btn btn-primary text-sm h-10 px-4"
          >
            {t.status === "ended" ? "View" : tr("common.register")}
          </Link>
        </div>
      </div>
    </article>
  );
}
