"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Share2,
  Copy,
  Check,
  MapPin,
  Users,
  Swords,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveBadge from "@/components/LiveBadge";
import PrizeBadge from "@/components/PrizeBadge";
import CountdownTimer from "@/components/CountdownTimer";
import TournamentCard from "@/components/TournamentCard";
import { useLanguage } from "@/context/LanguageContext";
import { formatBDT, cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import {
  GENERAL_RULES,
  BANNED,
  PENALTIES,
  PLACEMENT_POINTS,
  KILL_POINT,
  defaultPrizes,
  defaultSchedule,
} from "@/lib/ffRules";

type AnyTournament = {
  id: string;
  slug: string;
  title: string;
  titleBn?: string;
  mode: string;
  entryFee: number;
  prizePool: number;
  slots: number;
  slotsFilled: number;
  status: string;
  startAt: string;
  map?: string;
  cover?: string;
};
type DetailContent = { rules?: unknown; banned_items?: unknown; penalties?: unknown; placement_points?: unknown; prizes?: unknown; schedule?: unknown; organizer_note?: string | null; matches_description?: string | null };
type Participant = { id: string; display_name: string; team_name?: string | null; game_uid?: string | null; slot_number?: number | null; status: string };
type ResultRow = { id: string; participant_name: string; team_name?: string | null; rank: number; kills: number; points: number; prize_amount?: number };
type MatchRow = { id: string; match_number: number; map: string; start_at?: string | null; status: string; notes?: string | null };

const TABS = [
  "overview",
  "rules",
  "schedule",
  "prizes",
  "teams",
  "results",
] as const;

type Tab = (typeof TABS)[number];

export default function TournamentDetailClient({
  tournament: t,
  related = [],
  content,
  participants = [],
  results = [],
  matches = [],
}: {
  tournament: AnyTournament;
  related?: AnyTournament[];
  content?: DetailContent | null;
  participants?: Participant[];
  results?: ResultRow[];
  matches?: MatchRow[];
}) {
  const { lang, t: tr } = useLanguage();
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  const title = lang === "bn" && t.titleBn ? t.titleBn : t.title;
  const slotsLeft = Math.max(0, t.slots - t.slotsFilled);
  const isFull = t.slotsFilled >= t.slots;
  const isClosed = t.status === "ended";
  const canRegister = !isFull && !isClosed;
  const map = t.map || "Bermuda";
  const prizes = Array.isArray(content?.prizes) ? content.prizes as {place:string;amount:number}[] : defaultPrizes(t.prizePool, t.mode);
  const schedule = matches.length ? matches.map(m => ({ match: m.match_number, map: m.map, time: m.start_at || "", status: m.status })) : Array.isArray(content?.schedule) ? content.schedule as {match:number;map:string;time:string;status:string}[] : defaultSchedule(t.startAt, map);
  const rules = Array.isArray(content?.rules) ? content.rules as string[] : GENERAL_RULES[lang];
  const bannedItems = Array.isArray(content?.banned_items) ? content.banned_items as string[] : BANNED[lang];
  const penalties = Array.isArray(content?.penalties) ? content.penalties as {offense:Record<string,string>;action:Record<string,string>}[] : PENALTIES;
  const placementPoints = Array.isArray(content?.placement_points) ? content.placement_points as {place:number;points:number}[] : PLACEMENT_POINTS;
  const cover = t.cover || BRAND.cover;

  const tabLabel = (key: Tab) => {
    const map: Record<Tab, string> = {
      overview: tr("detail.overview"),
      rules: tr("detail.rules"),
      schedule: tr("detail.schedule"),
      prizes: tr("detail.prizes"),
      teams: tr("detail.teams"),
      results: tr("detail.results"),
    };
    return map[key];
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const shareWhatsApp = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    window.open(
      `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
      "_blank"
    );
  };

  const bdTime = (iso: string) =>
    new Date(iso).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", {
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-16">
        {/* Hero banner */}
        <section className="relative pt-20 pb-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-[#0B1221]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1221] via-[#0B1221]/60 to-[#0B1221]/40" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {t.status === "live" && <LiveBadge />}
              {t.status === "upcoming" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {tr("common.upcoming")}
                </span>
              )}
              {t.status === "ended" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-500/30 text-slate-300 border border-slate-500/40">
                  {tr("common.ended")}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-white/10 text-white/80 border border-white/15">
                {t.mode}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-white/10 text-white/80 border border-white/15 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {map}
              </span>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                  t.entryFee === 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                )}
              >
                {t.entryFee === 0 ? tr("common.free") : tr("common.paid")}
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight max-w-3xl">
              {title}
            </h1>

            <div className="mt-6 flex flex-wrap gap-6 items-end">
              <div>
                <div className="text-xs text-white/50 mb-1">{tr("common.prize")}</div>
                <PrizeBadge amount={t.prizePool} />
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">{tr("common.entry")}</div>
                <span className="font-heading font-bold text-white text-lg">
                  {t.entryFee === 0 ? tr("common.free") : formatBDT(t.entryFee)}
                </span>
              </div>
              {t.status !== "ended" && (
                <div>
                  <div className="text-xs text-white/50 mb-1">Countdown</div>
                  <CountdownTimer target={t.startAt} className="text-white" />
                </div>
              )}
            </div>

            <div className="mt-6 max-w-md">
              <div className="flex justify-between text-xs text-white/60 mb-1.5">
                <span>
                  {tr("detail.slots")}: {t.slotsFilled}/{t.slots}
                </span>
                <span>
                  {slotsLeft} {tr("common.slots")}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FF5C00] transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((t.slotsFilled / t.slots) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canRegister}
                className={cn(
                  "btn",
                  canRegister
                    ? "btn-primary"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
                )}
              >
                {isClosed
                  ? tr("detail.closed")
                  : isFull
                    ? tr("detail.full")
                    : tr("detail.register")}
              </button>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="btn btn-secondary gap-2"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="btn btn-secondary gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : tr("detail.share")}
              </button>
            </div>
          </div>
        </section>

        {/* Sticky tabs */}
        <div className="sticky top-16 z-30 bg-[#0B1221]/95 backdrop-blur-md border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div
              className="flex gap-1 overflow-x-auto hide-scrollbar py-2"
              role="tablist"
            >
              {TABS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors",
                    tab === key
                      ? "bg-[#FF5C00] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {tabLabel(key)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="section-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="font-heading text-2xl font-bold text-white">
                    {tr("detail.overview")}
                  </h2>
                  <ul className="space-y-3 text-sm text-white/75">
                    <li className="flex gap-3">
                      <Swords className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">{tr("detail.format")}:</strong>{" "}
                        {t.mode} Battle Royale · {map}
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Users className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Team size:</strong>{" "}
                        {t.mode === "Solo" ? "1" : t.mode === "Duo" ? "2" : "4"}{" "}
                        · Slots {t.slotsFilled}/{t.slots}
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Clock className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">{tr("detail.start")}:</strong>{" "}
                        {bdTime(t.startAt)} (GMT+6)
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <MapPin className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">{tr("detail.matches")}:</strong>{" "}
                        3 matches · Total points decide rank
                      </span>
                    </li>
                  </ul>
                  <div className="card-dark p-4 text-sm text-white/70 leading-relaxed">
                    <strong className="text-white block mb-1">{tr("detail.organizer")}</strong>
                    {content?.organizer_note || (lang === "bn" ? "রুম আইডি ম্যাচের ১০ মিনিট আগে আনলক হবে। পেইড কাপে পেমেন্ট কনফার্ম না হলে স্লট বাতিল হতে পারে। ফেয়ার প্লে করুন।" : "Room ID unlocks 10 minutes before start. Paid cups need payment confirmation or the slot may be cancelled. Play fair.")}
                  </div>
                </div>

                <div className="card-dark p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-white font-heading font-bold">
                    <Lock className="w-4 h-4 text-[#FF5C00]" />
                    {tr("detail.room")}
                  </div>
                  <p className="text-sm text-white/60">{tr("detail.roomLocked")}</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                      <div className="text-[10px] uppercase text-white/40 mb-1">Room ID</div>
                      <div className="font-mono text-white/30 blur-sm select-none">••••••••</div>
                    </div>
                    <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                      <div className="text-[10px] uppercase text-white/40 mb-1">Password</div>
                      <div className="font-mono text-white/30 blur-sm select-none">••••</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RULES */}
            {tab === "rules" && (
              <div className="space-y-10 max-w-3xl">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-white mb-4">
                    {tr("detail.rules")}
                  </h2>
                  <ol className="space-y-3 list-decimal list-inside text-sm text-white/80 leading-relaxed">
                    {rules.map((rule, i) => (
                      <li key={i} className="pl-1">
                        {rule}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">
                    {tr("detail.banned")}
                  </h3>
                  <ul className="space-y-2">
                    {bannedItems.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-red-300/90 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                      >
                        <span className="text-red-400 font-bold">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">
                    {tr("detail.penalties")}
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white/5 text-white/60 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3">{lang === "bn" ? "অপরাধ" : "Offense"}</th>
                          <th className="px-4 py-3">{lang === "bn" ? "শাস্তি" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80">
                        {penalties.map((row, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="px-4 py-3">{row.offense[lang] || row.offense.en || ""}</td>
                            <td className="px-4 py-3 text-[#FF5C00]">{row.action[lang] || row.action.en || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">
                    {tr("detail.points")}
                  </h3>
                  <p className="text-sm text-white/60 mb-3">
                    {tr("detail.killPoint")} · Placement + kills = total
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white/5 text-white/60 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3">{tr("detail.placement")}</th>
                          <th className="px-4 py-3">{tr("common.points")}</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80">
                        {placementPoints.map((row) => (
                          <tr key={row.place} className="border-t border-white/5">
                            <td className="px-4 py-2.5">#{row.place}</td>
                            <td className="px-4 py-2.5 font-semibold text-[#FF5C00]">
                              {row.points}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-white/10 bg-white/5">
                          <td className="px-4 py-2.5">{lang === "bn" ? "প্রতি কিল" : "Per kill"}</td>
                          <td className="px-4 py-2.5 font-semibold text-emerald-400">
                            +{KILL_POINT}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SCHEDULE */}
            {tab === "schedule" && (
              <div className="max-w-xl space-y-4">
                <h2 className="font-heading text-2xl font-bold text-white mb-2">
                  {tr("detail.schedule")}
                </h2>
                {schedule.map((m, i) => (
                  <div
                    key={m.match ?? i}
                    className="card-dark p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] font-heading font-bold flex items-center justify-center">
                      M{m.match}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">
                        Match {m.match} · {m.map}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {m.time ? bdTime(m.time) : "Time to be announced"}
                      </div>
                    </div>
                    <span className="text-xs uppercase font-bold text-white/40">
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* PRIZES */}
            {tab === "prizes" && (
              <div className="max-w-xl">
                <h2 className="font-heading text-2xl font-bold text-white mb-2">
                  {tr("detail.prizes")}
                </h2>
                <p className="text-sm text-white/50 mb-4">
                  Total pool: {formatBDT(t.prizePool)} · Paid via bKash / Nagad
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-white/60 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3">{tr("detail.placement")}</th>
                        <th className="px-4 py-3">BDT</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      {prizes.map((row, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="px-4 py-3 font-medium">{row.place}</td>
                          <td className="px-4 py-3 font-bold text-emerald-400">
                            {formatBDT(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TEAMS */}
            {tab === "teams" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-2xl font-bold text-white">
                    {tr("detail.teams")}
                  </h2>
                  <span className="text-sm text-white/50">
                    {slotsLeft} {tr("common.slots")}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {participants.map((player, i) => (
                    <div key={player.id} className="card-dark p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF5C00]/40 to-[#FF8A00]/20 flex items-center justify-center text-white font-heading font-bold text-sm">{player.slot_number || i + 1}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{player.team_name || player.display_name}</div>
                        <div className="text-[10px] text-white/40 truncate">{player.display_name}{player.game_uid ? " · UID " + player.game_uid : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {participants.length === 0 && (
                  <p className="text-white/50 text-sm">No teams registered yet.</p>
                )}
              </div>
            )}

            {/* RESULTS */}
            {tab === "results" && (
              <div className="max-w-2xl">
                <h2 className="font-heading text-2xl font-bold text-white mb-4">
                  {tr("detail.results")}
                </h2>
                {t.status !== "ended" && results.length === 0 ? (
                  <div className="card-dark p-8 text-center text-white/50 text-sm">
                    {lang === "bn"
                      ? "রেজাল্ট টুর্নামেন্ট শেষ হওয়ার পর এখানে দেখা যাবে।"
                      : "Results will appear here after the tournament is completed."}
                  </div>
                ) : results.length === 0 ? (
                  <div className="card-dark p-8 text-center text-white/50 text-sm">No results have been published yet.</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white/5 text-white/60 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Team / Player</th>
                          <th className="px-4 py-3">{tr("common.kills")}</th>
                          <th className="px-4 py-3">{tr("common.points")}</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80">
                        {results.map((row) => (
                          <tr key={row.id} className="border-t border-white/5">
                            <td className="px-4 py-3 font-bold text-[#FF5C00]">{row.rank}</td>
                            <td className="px-4 py-3">{row.team_name || row.participant_name}</td>
                            <td className="px-4 py-3">{row.kills}</td>
                            <td className="px-4 py-3 font-semibold">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <div className="mt-16 pt-10 border-t border-white/10">
                <h2 className="font-heading text-xl font-bold text-white mb-5">
                  {tr("detail.related")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {related.map((r) => (
                    <TournamentCard key={r.id} tournament={r} fluid />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10">
              <Link
                href="/tournaments"
                className="text-sm font-semibold text-[#FF5C00] hover:text-[#FF7A33]"
              >
                ← {tr("tournaments.title")}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
