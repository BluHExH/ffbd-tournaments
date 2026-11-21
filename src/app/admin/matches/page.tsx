import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDataManager } from "../AdminDataManager";
import { TournamentResultsManager } from "./TournamentResultsManager";

export default async function MatchesPage() {
  await requireAdmin();
  const db = await createClient();
  const { data } = await db.from("tournaments").select("id,uid,title").order("created_at", { ascending: false });
  const options = data || [];

  return <div className="space-y-8">
    <AdminDataManager
      title="Matches"
      description="Create match schedules and update their status. Room credentials remain private in the dedicated admin-only tournament field."
      table="tournament_matches"
      tournamentOptions={options}
      fields={[
        { key: "tournament_id", label: "Tournament", required: true },
        { key: "match_number", label: "Match Number", type: "number" },
        { key: "map", label: "Map", type: "select", options: ["Bermuda", "Purgatory", "Kalahari", "Alpine"] },
        { key: "start_at", label: "Start Date / Time", type: "date" },
        { key: "status", label: "Status", type: "select", options: ["scheduled", "live", "completed", "cancelled"] },
        { key: "notes", label: "Notes", type: "textarea" }
      ]}
    />
    <TournamentResultsManager tournaments={options} />
  </div>;
}
