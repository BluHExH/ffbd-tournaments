"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";

type WalletRequest = {
  id: string;
  user_id: string;
  amount_paisa: number;
  payment_method: string;
  sender_number?: string;
  recipient_number?: string;
  transaction_reference?: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const money = (paisa: number) => "৳" + (Number(paisa || 0) / 100).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function WalletAdminClient() {
  const [db] = useState(() => createClient());
  const [deposits, setDeposits] = useState<WalletRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [d, w] = await Promise.all([
      db.from("wallet_deposit_requests").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("wallet_withdrawal_requests").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (d.error || w.error) setError(d.error?.message || w.error?.message || "Unable to load wallet requests.");
    setDeposits((d.data ?? []) as WalletRequest[]);
    setWithdrawals((w.data ?? []) as WalletRequest[]);
    setLoading(false);
  }, [db]);

  useEffect(() => { void load(); }, [load]);

  async function review(kind: "deposit" | "withdrawal", request: WalletRequest, approve: boolean) {
    const label = kind === "deposit" ? "deposit" : "withdrawal";
    const question = approve ? `Approve this ${label} of ${money(request.amount_paisa)}?` : `Reject this ${label} of ${money(request.amount_paisa)}?`;
    if (!window.confirm(question)) return;
    setBusy(request.id); setError(""); setNotice("");
    const rpc = kind === "deposit" ? "admin_review_wallet_deposit" : "admin_review_wallet_withdrawal";
    const { error: rpcError } = await db.rpc(rpc, { p_request_id: request.id, p_approve: approve, p_note: null });
    setBusy(null);
    if (rpcError) { setError(rpcError.message); return; }
    setNotice(approve ? `${label} approved.` : `${label} rejected. Any reserved withdrawal amount has been refunded automatically.`);
    await load();
  }

  function section(title: string, items: WalletRequest[], kind: "deposit" | "withdrawal") {
    return <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121C2E]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div><h2 className="font-heading text-lg font-bold text-white">{title}</h2><p className="mt-1 text-xs text-white/40">{items.filter(x => x.status === "pending").length} pending · {items.length} total loaded</p></div>
      </div>
      {items.length === 0 ? <p className="p-8 text-center text-sm text-white/40">No requests found.</p> : <div className="divide-y divide-white/[0.06]">
        {items.map(item => <article key={item.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold text-white">{money(item.amount_paisa)} <span className="ml-1 text-xs font-semibold text-[#FF7130]">{item.payment_method}</span></p>
              <p className="mt-1 break-all text-xs text-white/55">Player ID: {item.user_id}</p>
              <p className="mt-1 text-xs text-white/45">{kind === "deposit" ? `Sender: ${item.sender_number || "—"} · Tx: ${item.transaction_reference || "—"}` : `Recipient: ${item.recipient_number || "—"}`}</p>
              <p className="mt-1 text-[10px] text-white/30">{new Date(item.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${item.status === "approved" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : item.status === "rejected" ? "border-red-400/20 bg-red-400/10 text-red-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>{item.status}</span>
          </div>
          {item.status === "pending" && <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={busy === item.id} onClick={() => void review(kind, item, true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300 disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/> Approve</button>
            <button disabled={busy === item.id} onClick={() => void review(kind, item, false)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-500/15 px-3 text-xs font-bold text-red-300 disabled:opacity-50"><XCircle className="h-4 w-4"/> Reject</button>
            {busy === item.id && <Loader2 className="h-4 w-4 animate-spin text-white/50"/>}
          </div>}
          {item.admin_note && <p className="mt-3 text-xs text-white/45">Admin note: {item.admin_note}</p>}
        </article>)}
      </div>}
    </section>;
  }

  return <main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-7 sm:px-6 sm:py-9 xl:px-9">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF7130]">Control center / Finance</p><h1 className="font-heading text-3xl font-bold text-white">Player Wallet</h1><p className="mt-2 text-sm text-white/40">Review deposits and withdrawals. Balance changes are performed by secure database functions.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/65 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/> Refresh</button></div>
    {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">{notice}</p>}
    {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 p-12 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin"/>Loading wallet requests…</div> : <div className="grid gap-5 xl:grid-cols-2">{section("Deposit requests", deposits, "deposit")}{section("Withdrawal requests", withdrawals, "withdrawal")}</div>}
  </main>;
}
