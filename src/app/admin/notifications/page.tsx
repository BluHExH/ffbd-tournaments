import { requireAdmin } from "@/lib/admin/auth";
import { NotificationsAdminClient } from "./NotificationsAdminClient";

export default async function AdminNotificationsPage() {
  await requireAdmin();
  return <NotificationsAdminClient />;
}
