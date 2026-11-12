import { requireAdmin } from "@/lib/admin/auth";
import { AdminDataManager } from "../AdminDataManager";
export default async function WebsiteSettingsPage() {
  await requireAdmin();
  return <AdminDataManager title="Website Settings" description="Manage public website configuration values. Only authorized admins can read or edit this section." table="website_settings" primaryKey="key" orderBy="key" fields={[
    {key:"key",label:"Setting Key",required:true},{key:"value",label:"Value",type:"textarea",required:true},{key:"description",label:"Description",type:"textarea"}
  ]}/>;
}