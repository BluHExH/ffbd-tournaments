"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveBadge from "@/components/LiveBadge";
import PrizeBadge from "@/components/PrizeBadge";
import CountdownTimer from "@/components/CountdownTimer";
import { useLanguage } from "@/context/LanguageContext";
import { formatBDT } from "@/lib/utils";

type AnyTournament = {
  id: string;
  slug: string;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  mode: string;
  entryFee: number;
  prizePool: number;
  slots: number;
  slotsFilled: number;
  status: string;
  startAt: string;
  map?: string;
};

export default function TournamentDetailClient({
  tournament: t,
  related = [],
}: {
  tournament: AnyTournament;
  related?: AnyTournament[];
}) {
  const { lang, t: tr } = useLanguage();
  const title = lang === "bn" && t.titleBn ? t.titleBn : t.title;
  const slotsLeft = Math.max(0, t.slots - t.slotsFilled);
  const isFull = t.slotsFilled >= t.slots;
  const isClosed = t.status === "ended";
  const canRegister = !isFull && !isClosed;

  return (
    <>
      <Navbar />
      <main className="section-dark min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {t.status === "live" && <LiveBadge />}
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/10 text-white/80 border border-white/15">
              {t.mode}
            </span>
            {t.map && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/10 text-white/80 border border-white/15">
                {t.map}
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            {title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-6 items-center">
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
              <span>{slotsLeft} left</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF5C00]"
                style={{
                  width: `${Math.min(100, Math.round((t.slotsFilled / t.slots) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="button"
              disabled={!canRegister}
              className={`btn ${canRegister ? "btn-primary" : "bg-white/10 text-white/50 cursor-not-allowed"}`}
            >
              {isClosed
                ? tr("detail.closed")
                : isFull
                  ? tr("detail.full")
                  : tr("detail.register")}
            </button>
          </div>

          <div className="mt-10 card-dark p-6 max-w-lg">
            <h2 className="font-heading text-lg font-bold text-white mb-2">
              {tr("detail.room")}
            </h2>
            <p className="text-sm text-white/60">{tr("detail.roomLocked")}</p>
          </div>

          <div className="mt-10">
            <Link href="/tournaments" className="text-[#FF5C00] font-semibold hover:underline">
              ← {tr("tournaments.title")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
