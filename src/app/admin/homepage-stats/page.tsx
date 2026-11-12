import { requireAdmin } from "@/lib/admin/auth";
import { AdminDataManager } from "../AdminDataManager";

export default async function HomepageStatsPage() {
  await requireAdmin();
  return <AdminDataManager
    title="Homepage Prize Pool & Stats"
    description="Edit the public homepage statistics, labels and section headings. Changes are reflected on the website."
    table="homepage_stats"
    primaryKey="key"
    orderBy="key"
    allowCreate={false}
    allowDelete={false}
    fields={[
      { key: "key", label: "Record Key (keep main)", required: true },
      { key: "prize_pool_paid", label: "Prize Pool Paid (BDT)", type: "number", required: true },
      { key: "teams_registered", label: "Teams Registered", type: "number", required: true },
      { key: "tournaments_held", label: "Tournaments Held", type: "number", required: true },
      { key: "prize_pool_label", label: "Prize Pool Label", required: true },
      { key: "teams_registered_label", label: "Teams Label", required: true },
      { key: "tournaments_held_label", label: "Tournaments Label", required: true },
      { key: "stats_section_title", label: "Stats Section Heading", required: true },
      { key: "teams_section_title", label: "Teams Section Heading", required: true },
      { key: "payouts_section_title", label: "Payouts Section Heading", required: true },
    ]}
  />;
}
