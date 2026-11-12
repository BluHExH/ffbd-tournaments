import Link from "next/link";
import { Plus, Pencil, Search, Trophy, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBDT } from "@/lib/utils";
import { DeleteTournamentButton } from "./DeleteTournamentButton";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminTournamentsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("start_at", { ascending: true });

  const rows = tournaments ?? [];
  const liveCount = rows.filter((item) => item.status === "live").length;
  const upcomingCount = rows.filter((item) => item.status === "upcoming").length;

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 xl:px-9">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF7130]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C00]" />
            Control center / Management
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Tournaments</h1>
          <p className="mt-2 text-sm text-white/40">Create, organize and manage your competitions.</p>
        </div>
        <Link href="/admin/tournaments/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] px-5 text-sm font-bold text-white shadow-[0_8px_28px_rgba(255,92,0,0.2)] transition hover:-translate-y-0.5">
          <Plus className="h-4 w-4" /> Create tournament
        </Link>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat label="Total tournaments" value={rows.length} />
        <MiniStat label="Live now" value={liveCount} tone="live" />
        <MiniStat label="Upcoming" value={upcomingCount} tone="upcoming" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121C2E]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-white">All tournaments</h2>
            <p className="mt-0.5 text-xs text-white/35">{rows.length} tournament records</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-white/30">
            <Search className="h-3.5 w-3.5" /> Full list
          </div>
        </div>

        {error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-red-300">Could not load tournaments</p>
            <p className="mt-1 text-xs text-white/40">Please refresh the page or check the database connection.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF5C00]/20 bg-[#FF5C00]/10 text-[#FF7130]"><Trophy className="h-5 w-5" /></div>
            <p className="text-sm font-semibold text-white/80">No tournaments yet</p>
            <p className="mt-1 text-xs text-white/35">Create your first tournament to see it listed here.</p>
            <Link href="/admin/tournaments/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FF5C00] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#FF7130]">
              <Plus className="h-3.5 w-3.5" /> Create tournament
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-12 gap-3 border-b border-white/[0.06] bg-white/[0.02] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30 md:grid">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Tournament</div>
              <div className="col-span-1">Mode</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Prize pool</div>
              <div className="col-span-1">Slots</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-white/[0.055]">
              {rows.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-white/[0.025] sm:px-6 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-1"><span className="font-mono text-[11px] text-white/35">{item.uid}</span></div>
                  <div className="min-w-0 md:col-span-3">
                    <p className="truncate text-sm font-semibold text-white/85">{item.title}</p>
                    <p className="mt-1 text-[10px] text-white/30 md:hidden">{item.mode} · {formatBDT(item.prize_pool)}</p>
                  </div>
                  <div className="hidden text-xs text-white/45 md:col-span-1 md:block">{item.mode}</div>
                  <div className="md:col-span-2"><StatusBadge status={item.status} /></div>
                  <div className="hidden text-xs font-semibold text-white/65 md:col-span-2 md:block">{formatBDT(item.prize_pool)}</div>
                  <div className="hidden text-xs text-white/45 md:col-span-1 md:block">{item.slots_filled}/{item.slots}</div>
                  <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Link href={`/admin/tournaments/${item.id}/edit`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 text-xs font-semibold text-white/60 transition hover:border-[#FF5C00]/30 hover:bg-[#FF5C00]/[0.06] hover:text-white">
                      <Pencil className="h-3.5 w-3.5" /> Edit <ArrowUpRight className="h-3 w-3 opacity-40" />
                    </Link>
                    <DeleteTournamentButton id={item.id} title={item.title} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "live" | "upcoming" }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#121C2E] px-5 py-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`mt-2 font-heading text-2xl font-bold ${tone === "live" ? "text-red-300" : tone === "upcoming" ? "text-sky-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "border-red-400/20 bg-red-400/10 text-red-300",
    upcoming: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    ended: "border-white/10 bg-white/[0.04] text-white/40",
  };
  return <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[status] || styles.ended}`}>{status}</span>;
}
