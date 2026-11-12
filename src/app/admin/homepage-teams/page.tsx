import { requireAdmin } from "@/lib/admin/auth";
import { AdminDataManager } from "../AdminDataManager";

export default async function HomepageTeamsPage() {
  await requireAdmin();
  return <AdminDataManager
    title="Homepage Top Teams"
    description="Add, edit, reorder or remove the teams shown on the public homepage. Lower rank numbers appear first."
    table="homepage_teams"
    orderBy="rank"
    orderAscending
    fields={[
      { key: "name", label: "Team Name", required: true },
      { key: "logo", label: "Logo URL" },
      { key: "kills", label: "Kills", type: "number", required: true },
      { key: "points", label: "Points", type: "number", required: true },
      { key: "wins", label: "Wins", type: "number", required: true },
      { key: "rank", label: "Rank", type: "number", required: true },
    ]}
  />;
}
