"use client";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {Bell,Loader2,Send} from "lucide-react";

type Player={user_id:string;username:string};
export function NotificationsAdminClient(){
 const [db]=useState(()=>createClient());
 const [players,setPlayers]=useState<Player[]>([]);
 const [recipient,setRecipient]=useState("all");
 const [title,setTitle]=useState("");
 const [body,setBody]=useState("");
 const [kind,setKind]=useState("general");
 const [loading,setLoading]=useState(true);
 const [sending,setSending]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>{let active=true;const load=async()=>{const {data,error}=await db.from("player_profiles").select("user_id,username").order("username").limit(1000);if(!active)return;if(error)setError(error.message);setPlayers((data??[]) as Player[]);setLoading(false)};void load();return()=>{active=false}},[db]);
 async function send(e:React.FormEvent){e.preventDefault();setError("");setNotice("");if(!title.trim()||!body.trim()){setError("Title and message are required.");return}const targets=recipient==="all"?players:players.filter(p=>p.user_id===recipient);if(!targets.length){setError("No eligible player accounts found.");return}setSending(true);const payload=targets.map(p=>({user_id:p.user_id,title:title.trim(),body:body.trim(),notification_type:kind}));const {error}=await db.from("player_notifications").insert(payload);setSending(false);if(error){setError(error.message);return}setNotice(`Notification sent to ${targets.length} player account(s).`);setTitle("");setBody("")}
 const input="w-full rounded-xl border border-white/10 bg-[#0B1221] px-3 py-3 text-sm text-white outline-none focus:border-[#FF7130]";
 return <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"><div className="mb-7"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF7130]">Control center / Community</p><h1 className="font-heading text-3xl font-bold text-white">Player Notifications</h1><p className="mt-2 text-sm text-white/45">Send an in-app notification to one player or all registered player accounts.</p></div>
 {error&&<p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}{notice&&<p role="status" className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">{notice}</p>}
 <form onSubmit={send} className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#121C2E] p-5 sm:p-7"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF5C00]/10 text-[#FF7130]"><Bell className="h-5 w-5"/></span><div><h2 className="font-heading text-lg font-bold text-white">Compose notification</h2><p className="text-xs text-white/40">{players.length} player profiles available</p></div></div>
 <label className="block"><span className="mb-2 block text-xs font-semibold text-white/60">Recipient</span><select value={recipient} onChange={e=>setRecipient(e.target.value)} className={input}><option value="all">All players</option>{players.map(p=><option key={p.user_id} value={p.user_id}>{p.username}</option>)}</select></label>
 <label className="block"><span className="mb-2 block text-xs font-semibold text-white/60">Notification type</span><select value={kind} onChange={e=>setKind(e.target.value)} className={input}><option value="general">General</option><option value="tournament">Tournament</option><option value="payment">Payment</option><option value="result">Result</option><option value="account">Account</option></select></label>
 <label className="block"><span className="mb-2 block text-xs font-semibold text-white/60">Title</span><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} className={input} placeholder="Notification title" required/></label>
 <label className="block"><span className="mb-2 block text-xs font-semibold text-white/60">Message</span><textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={1000} rows={5} className={input} placeholder="Write the update for players…" required/></label>
 <button disabled={sending||loading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF5C00] px-5 text-sm font-bold text-white disabled:opacity-50">{sending?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}Send notification</button></form></main>;
}
