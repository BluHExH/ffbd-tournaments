import { requireAdmin } from "@/lib/admin/auth";
import { AdminDataManager } from "../AdminDataManager";

export default async function HomepagePayoutsPage() {
  await requireAdmin();
  return <AdminDataManager
    title="Homepage Recent Payouts"
    description="Manage the payout cards shown on the public homepage. Add, edit or delete payout records."
    table="homepage_payouts"
    orderBy="date"
    fields={[
      { key: "name", label: "Player Name", required: true },
      { key: "team", label: "Team Name" },
      { key: "amount", label: "Payout Amount (BDT)", type: "number", required: true },
      { key: "tournament", label: "Tournament", required: true },
      { key: "date", label: "Payout Date / Time", type: "date", required: true },
      { key: "method", label: "Payment Method", required: true },
    ]}
  />;
}
