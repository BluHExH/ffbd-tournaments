"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TournamentCard from "@/components/TournamentCard";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";
import { tournaments } from "@/data/seed";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Mode = "all" | "Solo" | "Duo" | "Squad";
type Entry = "all" | "free" | "paid";
type Status = "all" | "live" | "upcoming" | "ended";

export default function TournamentsPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("all");
  const [entry, setEntry] = useState<Entry>("all");
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(6);

  const filtered = useMemo(() => {
    let list = [...tournaments];
    if (mode !== "all") list = list.filter((x) => x.mode === mode);
    if (entry === "free") list = list.filter((x) => x.entryFee === 0);
    if (entry === "paid") list = list.filter((x) => x.entryFee > 0);
    if (status !== "all") list = list.filter((x) => x.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.titleBn.includes(q) ||
          x.mode.toLowerCase().includes(q) ||
          x.map.toLowerCase().includes(q)
      );
    }
    return list;
  }, [mode, entry, status, search]);

  const shown = filtered.slice(0, visible);

  const chip = (active: boolean) =>
    cn(
      "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
      active
        ? "bg-[#FF5C00] border-[#FF5C00] text-white"
        : "bg-white/5 border-white/15 text-white/70 hover:border-white/30"
    );

  const reset = () => {
    setMode("all");
    setEntry("all");
    setStatus("all");
    setSearch("");
    setVisible(6);
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="relative pt-24 pb-12 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.cover} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
          <div className="absolute inset-0 bg-[#0B1221]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1221]/40 to-[#0B1221]" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              title={t("tournaments.title")}
              subtitle={t("tournaments.subtitle")}
              light
              align="left"
              className="mb-0"
            />
          </div>
        </section>

        <section className="section-dark py-8 md:py-12 min-h-[50vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Filters */}
            <div className="sticky top-16 z-30 -mx-4 px-4 py-3 mb-6 bg-[#0B1221]/95 backdrop-blur-md border-y border-white/5">
              <div className="flex flex-col gap-3">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisible(6);
                  }}
                  placeholder={t("tournaments.search")}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5C00]/50"
                />
                <div className="flex flex-wrap gap-2">
                  {(["all", "Solo", "Duo", "Squad"] as Mode[]).map((m) => (
                    <button key={m} type="button" className={chip(mode === m)} onClick={() => { setMode(m); setVisible(6); }}>
                      {m === "all" ? t("tournaments.all") : m}
                    </button>
                  ))}
                  <span className="w-px bg-white/10 self-stretch mx-1" />
                  {(["all", "free", "paid"] as Entry[]).map((e) => (
                    <button key={e} type="button" className={chip(entry === e)} onClick={() => { setEntry(e); setVisible(6); }}>
                      {e === "all" ? t("tournaments.entry") : e === "free" ? t("common.free") : t("common.paid")}
                    </button>
                  ))}
                  <span className="w-px bg-white/10 self-stretch mx-1" />
                  {(["all", "live", "upcoming", "ended"] as Status[]).map((s) => (
                    <button key={s} type="button" className={chip(status === s)} onClick={() => { setStatus(s); setVisible(6); }}>
                      {s === "all" ? t("tournaments.status") : t(`common.${s === "ended" ? "ended" : s}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-white/50 text-sm mb-5">
              <span className="text-white font-semibold">{filtered.length}</span> tournaments
            </p>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/60 mb-4">{t("tournaments.empty")}</p>
                <button type="button" onClick={reset} className="btn btn-primary">
                  {t("tournaments.reset")}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {shown.map((tour) => (
                    <TournamentCard key={tour.id} tournament={tour} fluid />
                  ))}
                </div>
                {visible < filtered.length && (
                  <div className="mt-10 text-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + 6)}
                      className="btn btn-secondary"
                    >
                      {t("tournaments.loadMore")}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="mt-12 text-center">
              <Link href="/" className="text-sm font-semibold text-[#FF5C00] hover:text-[#FF7A33]">
                ← Home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
