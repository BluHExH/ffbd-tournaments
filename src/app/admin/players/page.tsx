import { requireAdmin } from "@/lib/admin/auth";
import { AdminDataManager } from "../AdminDataManager";

export default async function PlayersPage() {
  await requireAdmin();
  return <div className="space-y-8">
    <AdminDataManager title="Player Accounts" description="Review player usernames, game UIDs and profile pictures. User IDs are locked to prevent account reassignment." table="player_profiles" primaryKey="user_id" orderBy="username" orderAscending allowCreate={false} allowDelete={false} fields={[
      {key:"user_id",label:"User ID",readOnly:true,required:true},
      {key:"username",label:"Username",required:true},
      {key:"game_uid",label:"Free Fire UID"},
      {key:"avatar_url",label:"Profile Image URL"}
    ]}/>
    <AdminDataManager title="Private Player Contact" description="Restricted admin view of player phone numbers. These details are not exposed publicly." table="player_private_profiles" primaryKey="user_id" orderBy="updated_at" allowCreate={false} allowDelete={false} fields={[
      {key:"user_id",label:"User ID",readOnly:true,required:true},
      {key:"phone_number",label:"Phone Number"}
    ]}/>
  </div>;
}
