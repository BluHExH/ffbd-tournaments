import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDataManager } from "../AdminDataManager";
export default async function PaymentsPage() {
  await requireAdmin(); const db = await createClient();
  const { data } = await db.from("tournaments").select("id,uid,title").order("created_at",{ascending:false});
  return <AdminDataManager title="Payments" description="Track entry-fee payments and manually approve or reject transactions. Payment records are private to admins." table="tournament_payments" tournamentOptions={data || []} fields={[
    {key:"tournament_id",label:"Tournament",required:true},{key:"participant_name",label:"Player Name",required:true},{key:"amount",label:"Amount (BDT)",type:"number"},{key:"method",label:"Payment Method",type:"select",options:["bKash","Nagad","Rocket","Bank","Cash"]},{key:"transaction_id",label:"Transaction ID"},{key:"sender_number",label:"Sender Number"},{key:"status",label:"Status",type:"select",options:["pending","approved","rejected","refunded"]},{key:"note",label:"Admin Note",type:"textarea"}
  ]}/>;
}