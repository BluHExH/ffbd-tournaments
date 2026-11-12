"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const fields = [
  {key:"rules",label:"General Rules (JSON array of strings)",sample:'["No hacks or third-party tools","Follow room instructions"]'},
  {key:"banned_items",label:"Banned Items (JSON array of strings)",sample:'["Emulator","Teaming with enemies"]'},
  {key:"penalties",label:"Penalties (JSON array)",sample:'[{"offense":{"en":"Cheating","bn":"প্রতারণা"},"action":{"en":"Disqualification","bn":"বাতিল"}}]'},
  {key:"placement_points",label:"Placement Points (JSON array)",sample:'[{"place":1,"points":12},{"place":2,"points":9},{"place":3,"points":8}]'},
  {key:"prizes",label:"Prize Distribution (JSON array)",sample:'[{"place":"1st","amount":500},{"place":"2nd","amount":300},{"place":"3rd","amount":200}]'},
  {key:"schedule",label:"Match Schedule (JSON array)",sample:'[{"match":1,"map":"Bermuda","time":"2026-11-15T15:00:00+06:00","status":"scheduled"}]'},
] as const;

export function TournamentContentForm({tournamentId,initial}:{tournamentId:string;initial?:Record<string,unknown>|null}) {
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(f=>[f.key,JSON.stringify(initial?.[f.key] ?? JSON.parse(f.sample),null,2)])));
  const [organizerNote,setOrganizerNote]=useState(String(initial?.organizer_note ?? ""));
  const [matchesDescription,setMatchesDescription]=useState(String(initial?.matches_description ?? ""));
  const [saving,setSaving]=useState(false); const [error,setError]=useState(""); const [saved,setSaved]=useState(false);
  const router=useRouter(); const [db]=useState(()=>createClient());
  async function submit(e:React.FormEvent){e.preventDefault();setSaving(true);setError("");setSaved(false);
    try {const payload:Record<string,unknown>={tournament_id:tournamentId,organizer_note:organizerNote,matches_description:matchesDescription};
      for(const f of fields){const parsed=JSON.parse(values[f.key]||"[]");if(!Array.isArray(parsed))throw new Error(f.label+" must be a JSON array.");payload[f.key]=parsed;}
      const {error}=await db.from("tournament_content").upsert(payload,{onConflict:"tournament_id"});
      if(error)throw error;setSaved(true);router.refresh();
    }catch(err){setError(err instanceof Error?err.message:"Could not save tournament content.");}finally{setSaving(false);}
  }
  const cls="w-full rounded-xl border border-white/10 bg-[#0B1221] p-3 font-mono text-xs leading-5 text-white/85 outline-none focus:border-[#FF7130]";
  return <form onSubmit={submit} className="space-y-5">
    <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-5 text-sky-100/70">Edit the content shown inside this tournament&apos;s Rules, Schedule and Prizes tabs. JSON must be valid. The examples show the expected structure.</div>
    {fields.map(f=><label key={f.key} className="block rounded-xl border border-white/10 bg-white/[0.025] p-4"><span className="mb-2 block text-sm font-semibold text-white">{f.label}</span><textarea required rows={5} className={cls} value={values[f.key]} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))}/><span className="mt-2 block text-[10px] text-white/35">Example: {f.sample}</span></label>)}
    <label className="block"><span className="mb-2 block text-sm font-semibold text-white">Organizer Note</span><textarea rows={3} className={cls} value={organizerNote} onChange={e=>setOrganizerNote(e.target.value)}/></label>
    <label className="block"><span className="mb-2 block text-sm font-semibold text-white">Matches Description</span><textarea rows={2} className={cls} value={matchesDescription} onChange={e=>setMatchesDescription(e.target.value)}/></label>
    {error&&<p className="rounded-lg bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}{saved&&<p className="rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-300">Tournament detail content saved.</p>}
    <button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF5C00] px-6 text-sm font-bold text-white disabled:opacity-50">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Save Detail Content</button>
  </form>;
}