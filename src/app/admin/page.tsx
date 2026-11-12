import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Plus,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBDT } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [
    totalResult,
    liveResult,
    upcomingResult,
    prizeResult,
    recentResult,
  ] = await Promise.all([
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("status", "live"),
    supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("tournaments").select("prize_pool"),
    supabase.from("tournaments")
      .select("id, uid, title, status, prize_pool, start_at, mode, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const totalPrize = prizeResult.data?.reduce((sum, item) => sum + (item.prize_pool || 0), 0) ?? 0;
  const recent = recentResult.data ?? [];
  const stats = [
    { label: "Total tournaments", value: String(totalResult.count ?? 0), icon: Trophy, detail: "All records" },
    { label: "Live tournaments", value: String(liveResult.count ?? 0), icon: Activity, detail: "Currently running", live: true },
    { label: "Upcoming", value: String(upcomingResult.count ?? 0), icon: CalendarDays, detail: "Scheduled events" },
    { label: "Total prize pool", value: formatBDT(totalPrize), icon: Users, detail: "Across all tournaments" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 xl:px-9">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF7130]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C00]" />
            Control center / Overview
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Dashboard overview</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
            Welcome back{admin.email ? `, ${admin.email}` : ""}. Here’s what’s happening across BANGLAR TOURNAMENTS.
          </p>
        </div>
        <Link
          href="/admin/tournaments/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] px-5 text-sm font-bold text-white shadow-[0_8px_28px_rgba(255,92,0,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(255,92,0,0.3)]"
        >
          <Plus className="h-4 w-4" />
          Create tournament
        </Link>
      </div>

      <section aria-label="Tournament statistics" className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, detail, live }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121C2E] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
            <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-[#FF5C00]/[0.06] blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white/45">{label}</p>
                <p className={`mt-3 font-heading text-3xl font-bold tracking-tight ${live ? "text-red-400" : "text-white"}`}>{value}</p>
                <p className="mt-1.5 text-[11px] text-white/30">{detail}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${live ? "border-red-400/20 bg-red-400/10 text-red-400" : "border-[#FF5C00]/20 bg-[#FF5C00]/10 text-[#FF7130]"}`}>
                <Icon className="h-[18px] w-[18px]" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121C2E]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-heading text-lg font-bold text-white">Recent tournaments</h2>
              <p className="mt-0.5 text-xs text-white/35">Latest tournament records from your database</p>
            </div>
            <Link href="/admin/tournaments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7130] transition hover:text-[#FF9A66]">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF5C00]/20 bg-[#FF5C00]/10 text-[#FF7130]">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-white/80">No tournaments yet</p>
              <p className="mt-1 text-xs text-white/35">Create your first tournament to get started.</p>
              <Link href="/admin/tournaments/new" className="mt-4 text-xs font-semibold text-[#FF7130] hover:text-[#FF9A66]">Create tournament <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {recent.map((tournament) => (
                <Link key={tournament.id} href={`/admin/tournaments/${tournament.id}/edit`} className="group flex flex-col gap-3 px-5 py-4 transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-[#FF7130]">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-white/30">{tournament.uid}</span>
                        <StatusBadge status={tournament.status} />
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-white/85 transition group-hover:text-white">{tournament.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pl-[52px] text-xs sm:pl-0">
                    <span className="text-white/35">{tournament.mode}</span>
                    <span className="font-semibold text-white/65">{formatBDT(tournament.prize_pool)}</span>
                    <ArrowUpRight className="h-4 w-4 text-white/20 transition group-hover:text-[#FF7130]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#FF5C00]/20 bg-[radial-gradient(ellipse_at_top_right,rgba(255,92,0,0.13),transparent_55%),#121C2E] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[#FF7130]">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Security status</span>
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold text-white">Your admin session is protected</h2>
            <p className="mt-2 text-xs leading-5 text-white/45">Admin pages require an authorized account and an elevated MFA session.</p>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">Authenticated session</span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#121C2E] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#FF7130]" />
              <h2 className="font-heading text-base font-bold text-white">Quick actions</h2>
            </div>
            <div className="mt-4 space-y-2">
              <QuickAction href="/admin/tournaments" title="Manage tournaments" description="Edit, review or remove events" />
              <QuickAction href="/admin/tournaments/new" title="Create a tournament" description="Set up a new competition" />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function QuickAction({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 transition hover:border-[#FF5C00]/25 hover:bg-[#FF5C00]/[0.04]">
      <span>
        <span className="block text-xs font-semibold text-white/80 group-hover:text-white">{title}</span>
        <span className="mt-1 block text-[10px] text-white/35">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-[#FF7130]" />
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "border-red-400/20 bg-red-400/10 text-red-300",
    upcoming: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    ended: "border-white/10 bg-white/[0.04] text-white/40",
  };
  return (
    <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[status] || styles.ended}`}>
      {status}
    </span>
  );
}
