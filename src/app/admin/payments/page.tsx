import { requireAdmin } from "@/lib/admin/auth";
import { TournamentPaymentAdminClient } from "./TournamentPaymentAdminClient";

export default async function PaymentsPage() {
  await requireAdmin();
  return <TournamentPaymentAdminClient />;
}
