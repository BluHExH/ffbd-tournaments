import { requireAdmin } from "@/lib/admin/auth";
import { AdminDataManager } from "../AdminDataManager";

export default async function HomepageBannersPage() {
  await requireAdmin();
  return <AdminDataManager title="Homepage Banner Slider" description="Manage up to seven active mobile banner images. Use HTTPS image URLs and set the sort order." table="homepage_banners" orderBy="sort_order" orderAscending fields={[
    {key:"image_url",label:"Image URL",required:true},
    {key:"title",label:"Banner Title"},
    {key:"target_url",label:"Tap Destination URL"},
    {key:"is_active",label:"Active",type:"select",options:["true","false"]},
    {key:"sort_order",label:"Sort Order",type:"number",required:true}
  ]}/>;
}
