import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { TournamentForm } from "../../TournamentForm";
import {
  mapRowToTournament,
  type TournamentRow,
  type RoomCredentialsRow,
} from "@/types/tournament";
import { requireAdmin } from "@/lib/admin/auth";

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) notFound();

  const { data: creds } = await supabase
    .from("tournament_room_credentials")
    .select("*")
    .eq("tournament_id", id)
    .maybeSingle();

  const t = mapRowToTournament(
    row as TournamentRow,
    (creds as RoomCredentialsRow) || null
  );

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
          <div className="min-w-0">
            <span className="font-heading font-bold text-sm">Edit Tournament</span>
            <span className={"ml-2 text-xs text-white/35 font-mono"}>{t.uid}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <TournamentForm
          mode="edit"
          initial={{
            id: t.id,
            uid: t.uid,
            slug: t.slug,
            title: t.title,
            titleBn: t.titleBn,
            mode: t.mode,
            entryFee: t.entryFee,
            prizePool: t.prizePool,
            slots: t.slots,
            slotsFilled: t.slotsFilled,
            status: t.status,
            startAt: t.startAt,
            cover: t.cover,
            region: t.region,
            map: t.map,
            description: t.description || "",
            descriptionBn: t.descriptionBn || "",
            roomId: t.roomId || "",
            roomPassword: t.roomPassword || "",
          }}
        />
      </main>
    </div>
  );
}
