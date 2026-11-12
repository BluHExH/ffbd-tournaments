import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { TournamentContentForm } from "./TournamentContentForm";
export default async function TournamentContentPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; await requireAdmin(); const db=await createClient();
 const [{data:tournament},{data:content,error}]=await Promise.all([
  db.from("tournaments").select("id,uid,title").eq("id",id).maybeSingle(),
  db.from("tournament_content").select("*").eq("tournament_id",id).maybeSingle()
 ]);
 if(!tournament)notFound(); if(error)throw new Error(error.message);
 return <main className="mx-auto max-w-4xl px-4 py-7 sm:px-6"><header className="mb-7 flex items-center gap-3"><Link href={`/admin/tournaments/${id}/edit`} className="rounded-lg border border-white/10 p-2 text-white/60"><ArrowLeft className="h-4 w-4"/></Link><div><p className="text-[10px] uppercase tracking-widest text-[#FF7130]">{tournament.uid}</p><h1 className="font-heading text-2xl font-bold text-white">Edit Tournament Detail</h1><p className="text-sm text-white/45">{tournament.title}</p></div></header><TournamentContentForm tournamentId={id} initial={content}/></main>;
}