"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, Plus, RefreshCw, Trophy, Trash2 } from "lucide-react";

type Tournament = { id: string; uid: string; title: string };
type Participant = { id: string; user_id: string | null; display_name: string; team_name: string | null; game_uid: string | null; status: string };
type Draft = { participant_id: string; rank: string; kills: string; points: string; prize_amount: string };
type Saved = { id: string; participant_id: string | null; participant_name: string; team_name: string | null; rank: number; kills: number; points: number; prize_amount: number; finalized_at: string | null };

const money = (value: number) => "৳" + Number(value || 0).toLocaleString("en-BD");

export function TournamentResultsManager({ tournaments }: { tournaments: Tournament[] }) {
  const [db] = useState(() => createClient());
  const [tournamentId, setTournamentId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(false);

  const finalized = saved.some((row) => Boolean(row.finalized_at));
  const activeParticipants = useMemo(
    () => participants.filter((row) => row.user_id && ["registered", "confirmed"].includes(row.status)),
    [participants]
  );
  const selectedDrafts = drafts.filter((row) => row.rank.trim() !== "");
  const totalPrize = selectedDrafts.reduce((sum, row) => sum + Math.max(0, Number(row.prize_amount) || 0), 0);

  const load = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError("");
    setNotice("");
    const [roster, results] = await Promise.all([
      db.from("tournament_participants")
        .select("id,user_id,display_name,team_name,game_uid,status")
        .eq("tournament_id", id)
        .in("status", ["registered", "confirmed"])
        .order("created_at", { ascending: true }),
      db.from("tournament_results")
        .select("id,participant_id,participant_name,team_name,rank,kills,points,prize_amount,finalized_at")
        .eq("tournament_id", id)
        .order("rank", { ascending: true }),
    ]);
    if (roster.error || results.error) {
      setError(roster.error?.message || results.error?.message || "Unable to load tournament results.");
      setLoading(false);
      return;
    }
    const people = (roster.data ?? []) as Participant[];
    const existing = (results.data ?? []) as Saved[];
    setParticipants(people);
    setSaved(existing);
    setDrafts(existing.length ? existing.map((row) => ({
      participant_id: row.participant_id ?? "",
      rank: String(row.rank),
      kills: String(row.kills),
      points: String(row.points),
      prize_amount: String(row.prize_amount),
    })) : []);
    setLoading(false);
  }, [db]);

  useEffect(() => { if (tournamentId) void load(tournamentId); }, [tournamentId, load]);

  function addParticipant() {
    const used = new Set(drafts.map((row) => row.participant_id));
    const next = activeParticipants.find((row) => !used.has(row.id));
    if (!next) return;
    setDrafts((rows) => [...rows, { participant_id: next.id, rank: "", kills: "0", points: "0", prize_amount: "0" }]);
  }

  function update(index: number, key: keyof Draft, value: string) {
    setDrafts((rows) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }

  async function finalize() {
    if (!tournamentId || !selectedDrafts.length) return;
    setSaving(true);
    setError("");
    setNotice("");
    const payload = selectedDrafts.map((row) => ({
      participant_id: row.participant_id,
      rank: Number(row.rank),
      kills: Number(row.kills || 0),
      points: Number(row.points || 0),
      prize_amount: Number(row.prize_amount || 0),
    }));
    const { data, error: rpcError } = await db.rpc("admin_finalize_tournament_results", {
      p_tournament_id: tournamentId,
      p_results: payload,
    });
    setSaving(false);
    setConfirm(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const result = data as { results_saved?: number; wallet_awards?: number } | null;
    setNotice(`Finalized ${result?.results_saved ?? payload.length} results. ${result?.wallet_awards ?? 0} captain wallet(s) credited.`);
    await load(tournamentId);
  }

  return <section className="rounded-2xl border border-white/[0.08] bg-[#121C2E] p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF7130]"><Trophy className="h-3.5 w-3.5"/> Prize distribution</div>
        <h2 className="font-heading text-xl font-bold text-white">Finalize Results &amp; Award Prizes</h2>
        <p className="mt-1 text-sm text-white/45">Verified results are saved and each prize is credited to the registered captain's wallet.</p></div>
      <button onClick={() => tournamentId && void load(tournamentId)} disabled={!tournamentId || loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-white/65 disabled:opacity-40"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}/> Refresh</button>
    </div>
    <label className="block max-w-xl"><span className="mb-1.5 block text-xs text-white/55">Tournament</span>
      <select value={tournamentId} onChange={(event) => { setTournamentId(event.target.value); setDrafts([]); setSaved([]); setConfirm(false); }} className="w-full rounded-lg border border-white/10 bg-[#0B1221] px-3 py-3 text-sm text-white outline-none focus:border-[#FF7130]">
        <option value="">Choose tournament</option>{tournaments.map((row) => <option key={row.id} value={row.id}>{row.uid} · {row.title}</option>)}
      </select>
    </label>
    {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">{notice}</p>}
    {!tournamentId ? <p className="py-10 text-center text-sm text-white/35">Choose a tournament to enter verified match results.</p>
    : loading ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin"/>Loading registered captains…</div>
    : finalized ? <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4"/> Results finalized</div>
      <p className="mt-2 text-xs text-white/50">Prize awards have been posted to the registered captains' wallet ledger. This tournament cannot be finalized again.</p>
      <div className="mt-4 space-y-2">{saved.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-white/75">#{row.rank} · {row.team_name || row.participant_name}</span><span className="font-semibold text-emerald-300">{money(row.prize_amount)}</span></div>)}</div>
    </div>
    : <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-white">Match standings</h3><p className="mt-1 text-xs text-white/40">Only registered captains linked to a player account can receive awards.</p></div>
        <button onClick={addParticipant} disabled={activeParticipants.length <= drafts.length} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#FF5C00]/30 px-3 text-xs font-semibold text-[#FF9A61] disabled:opacity-40"><Plus className="h-3.5 w-3.5"/> Add player / team</button>
      </div>
      {activeParticipants.length === 0 ? <p className="mt-4 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-200">No registered captain with a linked account was found for this tournament. Prize distribution is blocked until a valid registration exists.</p>
      : drafts.length === 0 ? <p className="py-8 text-center text-sm text-white/35">Add the players or teams that appeared in the match.</p>
      : <div className="mt-4 space-y-3">{drafts.map((row, index) => {
        const person = activeParticipants.find((item) => item.id === row.participant_id);
        return <div key={row.participant_id} className="rounded-xl border border-white/[0.08] bg-[#0B1221] p-3">
          <div className="mb-3 flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{person?.team_name || person?.display_name || "Unknown captain"}</p><p className="mt-1 truncate text-[11px] text-white/40">{person?.display_name} · UID {person?.game_uid || "Not set"} · Captain wallet recipient</p></div>
            <button onClick={() => setDrafts((rows) => rows.filter((_, i) => i !== index))} aria-label="Remove result row" className="rounded-lg p-2 text-red-300/70 hover:bg-red-400/10"><Trash2 className="h-4 w-4"/></button></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([["rank","Rank"],["kills","Kills"],["points","Points"],["prize_amount","Prize (BDT)"]] as const).map(([key,label]) => <label key={key}><span className="mb-1 block text-[10px] text-white/45">{label}</span><input type="number" min={key === "rank" ? 1 : 0} step="1" value={row[key]} onChange={(event) => update(index,key,event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#121C2E] px-2.5 py-2 text-sm text-white outline-none focus:border-[#FF7130]"/></label>)}
          </div>
        </div>;
      })}</div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4"><div><p className="text-xs text-white/45">{selectedDrafts.length} result row(s) · Total prize</p><p className="mt-1 text-xl font-bold text-white">{money(totalPrize)}</p></div>
        <button onClick={() => setConfirm(true)} disabled={!selectedDrafts.length || saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF5C00] px-5 text-sm font-bold text-white disabled:opacity-40">{saving && <Loader2 className="h-4 w-4 animate-spin"/>}Preview &amp; Finalize</button>
      </div>
      {confirm && <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
        <h3 className="font-bold text-amber-200">Confirm prize distribution</h3><p className="mt-2 text-sm text-white/65">This permanently publishes {selectedDrafts.length} result(s) and credits {money(totalPrize)} across the selected registered captains' wallets. This action cannot be repeated.</p>
        <div className="mt-3 space-y-1">{selectedDrafts.map((row) => { const person=activeParticipants.find((item)=>item.id===row.participant_id); return <p key={row.participant_id} className="text-xs text-white/65">Rank {row.rank}: {person?.team_name || person?.display_name} — {money(Number(row.prize_amount)||0)}</p>; })}</div>
        <div className="mt-4 flex gap-2"><button onClick={() => void finalize()} disabled={saving} className="rounded-lg bg-[#FF5C00] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">Confirm &amp; award</button><button onClick={() => setConfirm(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-white/70">Go back</button></div>
      </div>}
    </>}
  </section>;
}
