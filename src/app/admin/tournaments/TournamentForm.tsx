"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { TournamentMode, TournamentStatus, MapName } from "@/types/tournament";

export type TournamentFormData = {
  id?: string;
  uid: string;
  slug: string;
  title: string;
  titleBn: string;
  mode: TournamentMode;
  entryFee: number;
  prizePool: number;
  slots: number;
  slotsFilled: number;
  status: TournamentStatus;
  startAt: string;
  cover: string;
  region: string;
  map: MapName;
  description: string;
  descriptionBn: string;
  roomId: string;
  roomPassword: string;
};

const MODES: TournamentMode[] = ["Solo", "Duo", "Squad"];
const STATUSES: TournamentStatus[] = ["upcoming", "live", "ended"];
const MAPS: MapName[] = ["Bermuda", "Purgatory", "Kalahari", "Alpine"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function toLocalDatetimeValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function TournamentForm({
  initial,
  mode,
}: {
  initial?: Partial<TournamentFormData>;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<TournamentFormData>({
    uid: initial?.uid || "",
    slug: initial?.slug || "",
    title: initial?.title || "",
    titleBn: initial?.titleBn || "",
    mode: initial?.mode || "Squad",
    entryFee: initial?.entryFee ?? 0,
    prizePool: initial?.prizePool ?? 0,
    slots: initial?.slots ?? 48,
    slotsFilled: initial?.slotsFilled ?? 0,
    status: initial?.status || "upcoming",
    startAt: initial?.startAt || new Date(Date.now() + 86400000).toISOString(),
    cover: initial?.cover || "",
    region: initial?.region || "BD",
    map: initial?.map || "Bermuda",
    description: initial?.description || "",
    descriptionBn: initial?.descriptionBn || "",
    roomId: initial?.roomId || "",
    roomPassword: initial?.roomPassword || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof TournamentFormData>(
    key: K,
    value: TournamentFormData[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && mode === "create") {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      uid: form.uid.trim(),
      slug: form.slug.trim(),
      title: form.title.trim(),
      title_bn: form.titleBn.trim(),
      mode: form.mode,
      entry_fee: Number(form.entryFee) || 0,
      prize_pool: Number(form.prizePool) || 0,
      slots: Number(form.slots) || 0,
      slots_filled: Number(form.slotsFilled) || 0,
      status: form.status,
      start_at: new Date(form.startAt).toISOString(),
      cover: form.cover.trim() || null,
      region: form.region.trim() || "BD",
      map: form.map,
      description: form.description.trim() || null,
      description_bn: form.descriptionBn.trim() || null,
      room_id: form.roomId.trim() || null,
      room_password: form.roomPassword.trim() || null,
    };

    try {
      if (mode === "create") {
        const { error: insertError } = await supabase
          .from("tournaments")
          .insert(payload);

        if (insertError) {
          setError(insertError.message);
          setLoading(false);
          return;
        }
      } else {
        const { error: updateError } = await supabase
          .from("tournaments")
          .update(payload)
          .eq("id", initial?.id);

        if (updateError) {
          setError(updateError.message);
          setLoading(false);
          return;
        }
      }

      router.push("/admin/tournaments");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Section title="Basic Info">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="UID" required hint="e.g. #FF001">
            <input
              required
              value={form.uid}
              onChange={(e) => update("uid", e.target.value)}
              className={inputCls}
              placeholder="#FF001"
            />
          </Field>
          <Field label="Slug" required hint="URL path">
            <input
              required
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className={inputCls}
              placeholder="night-squad-championship"
            />
          </Field>
        </div>

        <Field label="Title (English)" required>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputCls}
            placeholder="Night Squad Championship"
          />
        </Field>

        <Field label="Title (Bangla)" required>
          <input
            required
            value={form.titleBn}
            onChange={(e) => update("titleBn", e.target.value)}
            className={inputCls}
            placeholder="নাইট স্কোয়াড চ্যাম্পিয়নশিপ"
          />
        </Field>
      </Section>

      <Section title="Tournament Settings">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Mode">
            <select
              value={form.mode}
              onChange={(e) => update("mode", e.target.value as TournamentMode)}
              className={inputCls}
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Map">
            <select
              value={form.map}
              onChange={(e) => update("map", e.target.value as MapName)}
              className={inputCls}
            >
              {MAPS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) =>
                update("status", e.target.value as TournamentStatus)
              }
              className={inputCls}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Entry Fee (BDT)">
            <input
              type="number"
              min={0}
              value={form.entryFee}
              onChange={(e) => update("entryFee", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Prize Pool (BDT)">
            <input
              type="number"
              min={0}
              value={form.prizePool}
              onChange={(e) => update("prizePool", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="TotalSlots">
            <input
              type="number"
              min={1}
              value={form.slots}
              onChange={(e) => update("slots", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Slots Filled">
            <input
              type="number"
              min={0}
              value={form.slotsFilled}
              onChange={(e) => update("slotsFilled", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Start Date and Time" required>
          <input
            type="datetime-local"
            required
            value={toLocalDatetimeValue(form.startAt)}
            onChange={(e) =>
              update("startAt", new Date(e.target.value).toISOString())
            }
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Room Details (optional)">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Room ID">
            <input
              value={form.roomId}
              onChange={(e) => update("roomId", e.target.value)}
              className={inputCls}
              placeholder="18695130"
            />
          </Field>
          <Field label="Room Password">
            <input
              value={form.roomPassword}
              onChange={(e) => update("roomPassword", e.target.value)}
              className={inputCls}
              placeholder="2569"
            />
          </Field>
        </div>
      </Section>

      <Section title="Extra">
        <Field label="Cover Image URL">
          <input
            value={form.cover}
            onChange={(e) => update("cover", e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>
        <Field label="Description (English)">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputCls + " min-h-[80px] resize-y"}
            rows={3}
          />
        </Field>
        <Field label="Description (Bangla)">
          <textarea
            value={form.descriptionBn}
            onChange={(e) => update("descriptionBn", e.target.value)}
            className={inputCls + " min-h-[80px] resize-y"}
            rows={3}
          />
        </Field>
      </Section>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] text-white font-heading font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition disabled:opacity-60 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : mode === "create" ? (
            "Create Tournament"
          ) : (
            "Save Changes"
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 px-4 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF5C00]/50 focus:ring-1 focus:ring-[#FF5C00]/30 transition";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 sm:p-5 space-y-4">
      <h3 className="font-heading font-semibold text-sm text-white/80">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-1.5">
        {label}
        {required && <span className="text-[#FF5C00]">*</span>}
        {hint && (
          <span className="text-white/25 font-normal normal-case">({hint})</span>
        )}
      </label>
      {children}
    </div>
  );
}
