import { requireAdmin } from "@/lib/admin/auth";
import { WalletAdminClient } from "./WalletAdminClient";

export default async function WalletAdminPage() {
  await requireAdmin();
  return <WalletAdminClient />;
}
