import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Trophy,
  Plus,
  LayoutDashboard,
  Calendar,
  Users,
  Shield,
} from "lucide-react";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { formatBDT } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { count: totalTournaments } = await supabase
    .from("tournaments")
    .select("*", { count: "exact", head: true });

  const { count: liveCount } = await supabase
    .from("tournaments")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  const { count: upcomingCount } = await supabase
    .from("tournaments")
    .select("*", { count: "exact", head: true })
    .eq("status", "upcoming");

  const { data: prizeData } = await supabase
    .from("tournaments")
    .select("prize_pool");

  const totalPrize =
    prizeData?.reduce((sum, t) => sum + (t.prize_pool || 0), 0) || 0;

  const { data: recent } = await supabase
    .from("tournaments")
    .select("id, uid, title, status, prize_pool, start_at, mode")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B1221]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#FF5C00]" />
            </div>
            <span className="font-heading font-bold text-sm tracking-wide">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-white/40">
              {admin.email}
            </span>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-white/45 mt-0.5">Manage tournaments and settings</p>
          </div>
          <Link
            href="/admin/tournaments/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] text-white text-sm font-heading font-semibold hover:opacity-95 active:scale-[0.98] transition"
          >
            <Plus className="w-4 h-4" />
            New Tournament
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard icon={<Trophy className="w-4 h-4" />} label="Total Tournaments" value={String(totalTournaments ?? 0)} />
          <StatCard icon={<Calendar className="w-4 h-4" />} label="Live Now" value={String(liveCount ?? 0)} accent="live" />
          <StatCard icon={<Users className="w-4 h-4" />} label="Upcoming" value={String(upcomingCount ?? 0)} />
          <StatCard icon={<LayoutDashboard className="w-4 h-4" />} label="Total Prize Pool" value={formatBDT(totalPrize)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <Link href="/admin/tournaments" className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-[#FF5C00]/40 hover:bg-white/[0.05] transition group">
            <div className="w-10 h-10 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 flex items-center justify-center group-hover:bg-[#FF5C00]/20 transition">
              <Trophy className="w-5 h-5 text-[#FF5C00]" />
            </div>
            <div>
              <p className="font-heading font-semibold text-sm">All Tournaments</p>
              <p className="text-xs text-white/40">View, edit and manage cards</p>
            </div>
          </Link>
          <Link href="/admin/tournaments/new" className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-[#FF5C00]/40 hover:bg-white/[0.05] transition group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-heading font-semibold text-sm">Create Tournament</p>
              <p className="text-xs text-white/40">Add a new tournament card</p>
            </div>
          </Link>
        </div>

        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 bg-white/[0.02]">
            <h2 className="font-heading font-semibold text-sm">Recent Tournaments</h2>
          </div>
          {!recent || recent.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-white/40">
              No tournaments yet.{" "}
              <Link href="/admin/tournaments/new" className="text-[#FF5C00] hover:underline">
                Create the first one
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/tournaments/${t.id}/edit`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-white/35 shrink-0">{t.uid}</span>
                    <span className="text-sm font-medium truncate">{t.title}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-white/40">
                    <span className="hidden sm:inline">{t.mode}</span>
                    <span>{formatBDT(t.prize_pool)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "live";
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-white/40 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`font-heading text-xl font-bold tracking-tight ${accent === "live" ? "text-red-400" : "text-white"}`}>
        {value}
      </p>
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
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${styles[status] || styles.ended}`}>
      {status}
    </span>
  );
}
