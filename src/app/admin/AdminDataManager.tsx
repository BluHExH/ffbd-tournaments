"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";

type Field = { key: string; label: string; type?: "text" | "number" | "date" | "textarea" | "select"; required?: boolean; options?: string[] };
type Row = Record<string, unknown> & { id?: string; key?: string };

export function AdminDataManager({
  title, description, table, fields, tournamentOptions = [], orderBy = "created_at", primaryKey = "id", allowCreate = true, allowDelete = true,
}: {
  title: string; description: string; table: string; fields: Field[];
  tournamentOptions?: { id: string; title: string; uid: string }[];
  orderBy?: string; primaryKey?: string; allowCreate?: boolean; allowDelete?: boolean;
}) {
  const [supabase] = useState(() => createClient());
  const [rows, setRows] = useState<Row[]>([]);
  const [values, setValues] = useState<Row>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const query = supabase.from(table).select("*");
    const result = await (orderBy ? query.order(orderBy, { ascending: false }) : query);
    if (result.error) setError(result.error.message);
    else setRows((result.data || []) as Row[]);
    setLoading(false);
  }, [supabase, table, orderBy]);

  useEffect(() => { void load(); }, [load]);

  function begin(row?: Row) {
    setEditing(row ? String(row[primaryKey] ?? "") : null);
    setValues(row ? { ...row } : {});
    setShowForm(true); setError(""); setNotice("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    const payload: Row = {};
    for (const field of fields) {
      const raw = values[field.key];
      payload[field.key] = field.type === "number" ? (raw === "" || raw == null ? 0 : Number(raw)) : field.type === "date" && raw ? new Date(String(raw)).toISOString() : raw ?? field.options?.[0] ?? "";
    }
    const result = editing
      ? await supabase.from(table).update(payload).eq(primaryKey, editing)
      : await supabase.from(table).insert(payload);
    if (result.error) setError(result.error.message);
    else { setNotice(editing ? "Changes saved." : "Record created."); setShowForm(false); await load(); }
    setSaving(false);
  }

  async function remove(row: Row) {
    const id = row[primaryKey];
    if (!id || !window.confirm("Delete this record permanently?")) return;
    const result = await supabase.from(table).delete().eq(primaryKey, id);
    if (result.error) setError(result.error.message);
    else { setNotice("Record deleted."); await load(); }
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-[#0B1221] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF7130]";
  const display = (row: Row, field: Field) => {
    const value = row[field.key];
    if (value == null || value === "") return "—";
    if (field.type === "date") return new Date(String(value)).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
    return String(value);
  };

  return <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 xl:px-9">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF7130]">Control center / Management</div>
        <h1 className="font-heading text-3xl font-bold text-white">{title}</h1><p className="mt-2 text-sm text-white/40">{description}</p></div>
      <div className="flex gap-2"><button onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-white/65"><RefreshCw className="h-4 w-4"/> Refresh</button>
        {allowCreate && <button onClick={() => begin()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C00] px-4 text-sm font-bold text-white"><Plus className="h-4 w-4"/> Add New</button>}</div>
    </div>
    {error && <p className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
    {notice && <p className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">{notice}</p>}
    {showForm && <form onSubmit={save} className="mb-6 rounded-2xl border border-[#FF5C00]/25 bg-[#121C2E] p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-lg font-bold text-white">{editing ? "Edit record" : "Add record"}</h2><button type="button" onClick={() => setShowForm(false)} className="text-white/50"><X className="h-5 w-5"/></button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(field => <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs text-white/55">{field.label}</span>
          {field.key === "tournament_id" ? <select required={field.required} className={inputClass} value={String(values[field.key] ?? "")} onChange={e => setValues(v => ({...v,[field.key]:e.target.value}))}><option value="">Choose tournament</option>{tournamentOptions.map(t => <option key={t.id} value={t.id}>{t.uid} · {t.title}</option>)}</select>
          : field.type === "select" ? <select className={inputClass} value={String(values[field.key] ?? field.options?.[0] ?? "")} onChange={e => setValues(v => ({...v,[field.key]:e.target.value}))}>{(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}</select>
          : field.type === "textarea" ? <textarea required={field.required} rows={3} className={inputClass} value={String(values[field.key] ?? "")} onChange={e => setValues(v => ({...v,[field.key]:e.target.value}))}/>
          : <input required={field.required} type={field.type === "number" ? "number" : field.type === "date" ? "datetime-local" : "text"} min={field.type === "number" ? 0 : undefined} className={inputClass} value={String(values[field.key] ?? "").slice(0,16)} onChange={e => setValues(v => ({...v,[field.key]:e.target.value}))}/>}
        </label>)}
      </div>
      <div className="mt-5 flex gap-2"><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#FF5C00] px-5 text-sm font-bold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin"/>}Save</button><button type="button" onClick={() => setShowForm(false)} className="h-10 rounded-lg border border-white/10 px-4 text-sm text-white/60">Cancel</button></div>
    </form>}
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121C2E]">
      {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin"/>Loading records…</div> : rows.length === 0 ? <div className="p-12 text-center text-sm text-white/40">No records yet. Use Add New to create one.</div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/40"><tr>{fields.map(f => <th key={f.key} className="px-4 py-3">{f.label}</th>)}<th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-white/[0.06]">{rows.map((row,i) => <tr key={String(row[primaryKey] ?? i)} className="hover:bg-white/[0.02]">{fields.map(f => <td key={f.key} className="max-w-[240px] truncate px-4 py-3 text-white/70">{display(row,f)}</td>)}<td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => begin(row)} aria-label="Edit" className="rounded-lg border border-white/10 p-2 text-white/65 hover:text-white"><Pencil className="h-4 w-4"/></button>{allowDelete && <button onClick={() => void remove(row)} aria-label="Delete" className="rounded-lg border border-red-400/15 p-2 text-red-300/70 hover:text-red-300"><Trash2 className="h-4 w-4"/></button>}</div></td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
