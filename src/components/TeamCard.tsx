"use client";

import type { Team } from "@/types/tournament";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  team: Team;
  className?: string;
}

export default function TeamCard({ team, className }: Props) {
  const { t } = useLanguage();

  return (
    <article
      className={cn(
        "card-light p-5 flex flex-col items-center text-center gap-3 hover:-translate-y-1 hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B1221] to-[#1A2332] flex items-center justify-center text-white font-heading text-xl font-bold shadow-md ring-2 ring-[#FF5C00]/20 overflow-hidden">
          {team.logo ? <img src={team.logo} alt={`${team.name} logo`} className="h-full w-full object-cover" /> : team.name.charAt(0)}
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FF5C00] text-white text-xs font-bold flex items-center justify-center shadow">
          {team.rank}
        </span>
      </div>
      <h3 className="font-heading text-base font-bold text-[#0F172A] leading-tight line-clamp-1">
        {team.name}
      </h3>
      <div className="flex gap-4 text-sm text-slate-500">
        <div>
          <div className="font-semibold text-[#0F172A]">{team.kills}</div>
          <div className="text-xs">{t("common.kills")}</div>
        </div>
        <div>
          <div className="font-semibold text-[#0F172A]">{team.points}</div>
          <div className="text-xs">{t("common.points")}</div>
        </div>
        <div>
          <div className="font-semibold text-[#0F172A]">{team.wins}</div>
          <div className="text-xs">W</div>
        </div>
      </div>
    </article>
  );
}
