import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, ArrowLeft, Pencil } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { DeleteTournamentButton } from "./DeleteTournamentButton";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminTournamentsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("start_at", { ascending: true });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B1221]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-heading font-bold text-sm">Tournaments</span>
          </div>
          <Link
            href="/admin/tournaments/new"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#FF5C00] text-white text-xs font-heading font-semibold hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {!tournaments || tournaments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm mb-4">No tournaments yet</p>
            <Link
              href="/admin/tournaments/new"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] text-white text-sm font-heading font-semibold"
            >
              <Plus className="w-4 h-4" />
              Create first tournament
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white/35 border-b border-white/8 bg-white/[0.02]">
              <div className="col-span-1">UID</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-1">Mode</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Prize</div>
              <div className="col-span-2">Slots</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-white/5">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-white/[0.02] transition"
                >
                  <div className="md:col-span-1">
                    <span className="text-xs font-mono text-white/40">{t.uid}</span>
                  </div>
                  <div className="md:col-span-3 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-[11px] text-white/30 truncate md:hidden">
                      {t.mode} - {t.status}
                    </p>
                  </div>
                  <div className="hidden md:block md:col-span-1 text-xs text-white/50">{t.mode}</div>
                  <div className="hidden md:block md:col-span-1">
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="hidden md:block md:col-span-2 text-xs text-white/60">
                    {formatBDT(t.prize_pool)}
                  </div>
                  <div className="hidden md:block md:col-span-2 text-xs text-white/50">
                    {t.slots_filled}/{t.slots}
                  </div>
                  <div className="md:col-span-2 flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/tournaments/${t.id}/edit`}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <DeleteTournamentButton id={t.id} title={t.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-red-500/15 text-red-400 border-red-500/25",
    upcoming: "bg-sky-500/15 text-sky-400 border-sky-500/25",
    ended: "bg-white/5 text-white/40 border-white/10",
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
        styles[status] || styles.ended
      }`}
    >
      {status}
    </span>
  );
}
