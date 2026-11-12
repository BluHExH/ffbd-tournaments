import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDataManager } from "../AdminDataManager";
export default async function RegistrationsPage() {
  await requireAdmin(); const db = await createClient();
  const { data } = await db.from("tournaments").select("id,uid,title").order("created_at",{ascending:false});
  return <AdminDataManager title="Players & Registrations" description="Add, edit, confirm or remove player and team registrations. Names entered here appear on the tournament detail page." table="tournament_participants" tournamentOptions={data || []} fields={[
    {key:"tournament_id",label:"Tournament",required:true},{key:"display_name",label:"Player / Captain Name",required:true},{key:"team_name",label:"Team Name"},{key:"game_uid",label:"Free Fire UID"},{key:"contact",label:"Contact"},{key:"slot_number",label:"Slot Number",type:"number"},{key:"status",label:"Status",type:"select",options:["registered","confirmed","rejected","cancelled"]}
  ]}/>;
}