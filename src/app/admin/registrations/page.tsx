import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { RegistrationAdminClient } from "./RegistrationAdminClient";

export default async function RegistrationsPage() {
  await requireAdmin();

  const db = await createClient();
  const { data, error } = await db
    .from("tournaments")
    .select("id,uid,title")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load tournaments: ${error.message}`);
  }

  return <RegistrationAdminClient tournaments={data ?? []} />;
}