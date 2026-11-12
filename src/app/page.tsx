"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, CreditCard, KeyRound, Trophy, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TournamentCard from "@/components/TournamentCard";
import StatCounter from "@/components/StatCounter";
import SectionHeading from "@/components/SectionHeading";
import TeamCard from "@/components/TeamCard";
import LiveBadge from "@/components/LiveBadge";
import FAQAccordion from "@/components/FAQAccordion";
import PrizeBadge from "@/components/PrizeBadge";
import CountdownTimer from "@/components/CountdownTimer";
import { useLanguage } from "@/context/LanguageContext";
import { sponsors } from "@/data/seed";
import type { Team } from "@/types/tournament";
import { createClient } from "@/lib/supabase/client";
import { mapRowToTournament, type TournamentRow, type Tournament } from "@/types/tournament";
import { formatBDT, formatNumber } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type HomepageStats = { key: string; prize_pool_paid: number; teams_registered: number; tournaments_held: number; prize_pool_label: string; teams_registered_label: string; tournaments_held_label: string; stats_section_title: string; teams_section_title: string; payouts_section_title: string };
type HomepagePayout = { id: string; name: string; team: string | null; amount: number; tournament: string; date: string; method: string };

export default function HomePage() {
  const { t, lang } = useLanguage();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [homepageStats, setHomepageStats] = useState<HomepageStats | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [winners, setWinners] = useState<HomepagePayout[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    Promise.all([
      supabase.from("tournaments").select("*").order("start_at", { ascending: true }),
      supabase.from("homepage_stats").select("*").eq("key", "main").maybeSingle(),
      supabase.from("homepage_teams").select("*").order("rank", { ascending: true }),
      supabase.from("homepage_payouts").select("*").order("date", { ascending: false }),
    ]).then(([tournamentResult, statsResult, teamsResult, payoutsResult]) => {
      if (!active) return;
      setTournaments((tournamentResult.data ?? []).map((row) => mapRowToTournament(row as TournamentRow)));
      setHomepageStats(statsResult.data as HomepageStats | null);
      setTeams((teamsResult.data ?? []) as Team[]);
      setWinners((payoutsResult.data ?? []) as HomepagePayout[]);
      if (tournamentResult.error) console.error("Homepage tournaments load failed:", tournamentResult.error.message);
      if (statsResult.error) console.error("Homepage stats load failed:", statsResult.error.message);
      if (teamsResult.error) console.error("Homepage teams load failed:", teamsResult.error.message);
      if (payoutsResult.error) console.error("Homepage payouts load failed:", payoutsResult.error.message);
    });
    return () => { active = false; };
  }, []);

  const liveUpcoming = tournaments.filter((x) => x.status !== "ended");
  const prizePoolPaid = Number(homepageStats?.prize_pool_paid ?? 0);
  const teamsRegistered = Number(homepageStats?.teams_registered ?? 0);
  const tournamentsHeld = Number(homepageStats?.tournaments_held ?? 0);
  const featured = tournaments.find((x) => x.slug === "weekend-grand-squad") || tournaments[0];

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section id="home" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.cover} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
          <div className="absolute inset-0 bg-[#0B1221]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1221] via-[#0B1221]/50 to-[#0B1221]/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,92,0,0.22),transparent_55%)]" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/15 text-sm text-white/85 mb-7 backdrop-blur-md">
                <LiveBadge />
                <span className="hidden sm:inline font-medium">Next match soon</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-white leading-[1.08] tracking-tight drop-shadow-lg">
                {t("hero.headline")}
              </h1>
              <p className="mt-5 text-base sm:text-lg text-white/75 max-w-xl mx-auto leading-relaxed">
                {t("hero.sub")}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/tournaments" className="btn btn-primary w-full sm:w-auto min-w-[180px]">{t("hero.cta1")}</Link>
                <Link href="/tournaments" className="btn btn-secondary w-full sm:w-auto min-w-[180px]">{t("hero.cta2")}</Link>
              </div>
              <div className="mt-12 flex flex-wrap justify-center gap-3">
                <div className="stat-chip text-white flex items-center gap-2 shadow-lg">
                  <span className="text-[#FF5C00] font-bold">{formatBDT(prizePoolPaid)}</span>
                  <span className="text-white/60 text-xs">{homepageStats?.prize_pool_label || t("hero.stat1")}</span>
                </div>
                <div className="stat-chip text-white flex items-center gap-2 shadow-lg">
                  <span className="text-emerald-400 font-bold">{formatNumber(teamsRegistered)}+</span>
                  <span className="text-white/60 text-xs">{homepageStats?.teams_registered_label || t("hero.stat2")}</span>
                </div>
                <div className="stat-chip text-white flex items-center gap-2 shadow-lg">
                  <span className="text-sky-400 font-bold">{tournamentsHeld}+</span>
                  <span className="text-white/60 text-xs">{homepageStats?.tournaments_held_label || t("hero.stat3")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live strip */}
        <section id="live" className="section-dark py-16 md:py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8 gap-4">
              <SectionHeading title={t("live.title")} light align="left" className="mb-0" />
              <Link href="/tournaments" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#FF5C00] hover:text-[#FF7A33] transition-colors shrink-0">
                {t("live.viewAll")}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="live-marquee -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="All live and upcoming tournaments">
              {liveUpcoming.length > 0 && <div className="live-marquee-track">
                <div className="live-marquee-group">
                  {liveUpcoming.map((tour) => <div key={tour.id} className="shrink-0"><TournamentCard tournament={tour} /></div>)}
                </div>
                <div className="live-marquee-group" aria-hidden="true">
                  {liveUpcoming.map((tour) => <div key={`duplicate-${tour.id}`} className="shrink-0"><TournamentCard tournament={tour} /></div>)}
                </div>
              </div>}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="section-light py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading title={t("how.title")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {[
                { icon: UserPlus, title: t("how.step1"), desc: t("how.step1.desc") },
                { icon: CreditCard, title: t("how.step2"), desc: t("how.step2.desc") },
                { icon: KeyRound, title: t("how.step3"), desc: t("how.step3.desc") },
                { icon: Trophy, title: t("how.step4"), desc: t("how.step4.desc") },
              ].map((step, i) => (
                <div key={i} className="card-light p-6 flex flex-col items-start gap-4 relative hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5C00]/15 to-[#FF8A00]/10 flex items-center justify-center text-[#FF5C00]">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="absolute top-4 right-5 font-heading text-5xl font-bold text-slate-100/90 select-none">{i + 1}</div>
                  <h3 className="font-heading text-lg font-bold text-[#0F172A] relative z-10">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed relative z-10">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0B1221_0%,#121C2E_50%,#0B1221_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,92,0,0.12),transparent_60%)]" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading title={homepageStats?.stats_section_title || t("stats.title")} light />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-16">
              <StatCounter value={prizePoolPaid} label={homepageStats?.prize_pool_label || t("hero.stat1")} suffix="+" />
              <StatCounter value={teamsRegistered} label={homepageStats?.teams_registered_label || t("hero.stat2")} suffix="+" />
              <StatCounter value={tournamentsHeld} label={homepageStats?.tournaments_held_label || t("hero.stat3")} suffix="+" />
            </div>
          </div>
        </section>

        {/* Teams */}
        <section id="winners" className="section-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading title={homepageStats?.teams_section_title || t("teams.title")} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </div>
        </section>

        {/* Featured tournament banner */}
        {featured && <section className="relative py-16 md:py-20 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.cover} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
          <div className="absolute inset-0 bg-[#0B1221]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1221] via-[#0B1221]/70 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-[#FF5C00] font-heading font-bold text-sm uppercase tracking-wider mb-3">{t("featured.title")}</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white max-w-xl">
              {lang === "bn" ? featured.titleBn : featured.title}
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <PrizeBadge amount={featured.prizePool} />
              <span className="text-white/70 text-sm">{featured.mode} · {featured.map}</span>
              {featured.status !== "ended" && (
                <CountdownTimer target={featured.startAt} className="text-white" />
              )}
            </div>
            <Link href={`/tournaments/${featured.slug}`} className="btn btn-primary mt-8 inline-flex">
              {t("common.register")}
            </Link>
          </div>
        </section>}

        {/* Payouts */}
        <section className="section-light py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading title={homepageStats?.payouts_section_title || t("payout.title")} />
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {winners.map((w) => (
                <div key={w.id} className="card-light shrink-0 min-w-[240px] p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {w.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#0F172A] text-sm truncate">{w.name}</div>
                    <div className="text-xs text-slate-500 truncate">{w.tournament}</div>
                    <div className="text-[10px] text-slate-400 truncate">{w.team || new Date(w.date).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })}</div>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <div className="font-bold text-emerald-600 text-sm">{formatBDT(w.amount)}</div>
                    <div className="text-[10px] text-slate-400">{w.method}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sponsors */}
        <section className="section-white py-14 md:py-16 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading title={t("sponsors.title")} className="mb-8" />
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {sponsors.map((name) => (
                <div
                  key={name}
                  className="px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 font-heading font-bold text-slate-400 text-sm sm:text-base tracking-wide hover:text-[#FF5C00] hover:border-[#FF5C00]/30 transition-colors"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section-light py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading title={t("faq.title")} />
            <FAQAccordion lang={lang} />
          </div>
        </section>

        {/* Bottom CTA */}
        <section id="register" className="relative py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF5C00] to-[#FF8A00]" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white,transparent_50%)]" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white">{t("cta.title")}</h2>
            <p className="mt-4 text-white/90 text-base sm:text-lg">{t("cta.sub")}</p>
            <Link href="/tournaments" className="btn mt-8 bg-white text-[#FF5C00] hover:bg-white/95 shadow-xl min-w-[200px] inline-flex font-bold">
              {t("cta.button")}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
