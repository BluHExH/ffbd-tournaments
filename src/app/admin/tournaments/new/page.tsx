import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { TournamentForm } from "../TournamentForm";

export default async function NewTournamentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin) redirect("/admin/login");

  // Suggest next UID
  const { data: last } = await supabase
    .from("tournaments")
    .select("uid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextUid = "#FF001";
  if (last?.uid) {
    const num = parseInt(last.uid.replace(/\D/g, ""), 10);
    if (!isNaN(num)) {
      nextUid = `#FF${String(num + 1).padStart(3, "0")}`;
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B1221]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/admin/tournaments"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-heading font-bold text-sm">New Tournament</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <TournamentForm mode="create" initial={{ uid: nextUid }} />
      </main>
    </div>
  );
}
