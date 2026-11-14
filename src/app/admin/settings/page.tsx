import { requireAdmin } from "@/lib/admin/auth";
import { AdminDataManager } from "../AdminDataManager";
export default async function WebsiteSettingsPage() {
  await requireAdmin();
  return <AdminDataManager title="Website Settings" description="Manage public website configuration. For player payments, add or edit payment_bkash_number, payment_nagad_number and payment_rocket_number with your official receiving numbers. Leave them blank until verified. Only authorized admins can edit settings." table="website_settings" primaryKey="key" orderBy="key" fields={[
    {key:"key",label:"Setting Key",required:true},{key:"value",label:"Value",type:"textarea",required:true},{key:"description",label:"Description",type:"textarea"}
  ]}/>;
}