"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Pencil, Plus, RefreshCw, XCircle } from "lucide-react";

type Tournament = {
  id: string;
  uid: string;
  title: string;
};

type Registration = {
  id: string;
  tournament_id: string;
  display_name: string;
  team_name: string | null;
  game_uid: string | null;
  slot_number: number | null;
  status: string;
  created_at: string;
  tournaments: { title: string; uid: string } | null;
};

type FormValues = {
  tournament_id: string;
  display_name: string;
  team_name: string;
  game_uid: string;
  status: "registered" | "confirmed";
};

const emptyForm: FormValues = {
  tournament_id: "",
  display_name: "",
  team_name: "",
  game_uid: "",
  status: "registered",
};

export function RegistrationAdminClient({
  tournaments,
}: {
  tournaments: Tournament[];
}) {
  const [db] = useState(() => createClient());
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filterTournament, setFilterTournament] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    let query = db
      .from("tournament_participants")
      .select("id,tournament_id,display_name,team_name,game_uid,slot_number,status,created_at,tournaments(title,uid)")
      .order("created_at", { ascending: false })
      .limit(300);

    if (filterTournament) {
      query = query.eq("tournament_id", filterTournament);
    }

    const { data, error: loadError } = await query;

    if (loadError) {
      setError(loadError.message);
    } else {
      setRows((data ?? []) as unknown as Registration[]);
    }

    setLoading(false);
  }, [db, filterTournament]);

  useEffect(() => {
    void load();
  }, [load]);

  function beginCreate() {
    setEditing(null);
    setValues({
      ...emptyForm,
      tournament_id: filterTournament || tournaments[0]?.id || "",
    });
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function beginEdit(row: Registration) {
    setEditing(row.id);
    setValues({
      tournament_id: row.tournament_id,
      display_name: row.display_name,
      team_name: row.team_name ?? "",
      game_uid: row.game_uid ?? "",
      status: "registered",
    });
    setShowForm(true);
    setError("");
    setNotice("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.display_name.trim()) {
      setError("Player name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const result = editing
      ? await db.rpc("admin_update_tournament_participant", {
          p_participant_id: editing,
          p_display_name: values.display_name.trim(),
          p_team_name: values.team_name.trim() || null,
          p_game_uid: values.game_uid.trim() || null,
        })
      : await db.rpc("admin_create_tournament_registration", {
          p_tournament_id: values.tournament_id,
          p_display_name: values.display_name.trim(),
          p_team_name: values.team_name.trim() || null,
          p_game_uid: values.game_uid.trim() || null,
          p_status: values.status,
        });

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setShowForm(false);
    setNotice(editing ? "Player details updated." : "Registration created successfully.");
    await load();
  }

  async function deactivate(row: Registration, status: "rejected" | "cancelled") {
    const action = status === "rejected" ? "Reject" : "Cancel";

    if (!window.confirm(
      `${action} registration for ${row.display_name}?\n\nThe active slot will be released. If this player paid through the wallet, the eligible entry fee will be refunded.`
    )) {
      return;
    }

    const note = window.prompt("Optional Admin note:", "");
    if (note === null) return;

    setBusyId(row.id);
    setError("");
    setNotice("");

    const { error: rpcError } = await db.rpc(
      "admin_deactivate_tournament_participant",
      {
        p_participant_id: row.id,
        p_status: status,
        p_note: note.trim() || null,
      }
    );

    setBusyId(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setNotice(
      status === "rejected"
        ? "Registration rejected. Its active slot has been released."
        : "Registration cancelled. Its active slot has been released."
    );

    await load();
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0B1221] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF7130]";

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 xl:px-9">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF7130]">
            Control center / Management
          </p>
          <h1 className="font-heading text-3xl font-bold text-white">
            Players & Registrations
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Manage player details and registration status. Slot allocation and wallet adjustments are handled securely by the database.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-white/65 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={beginCreate}
            disabled={tournaments.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C00] px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Registration
          </button>
        </div>
      </div>

      <div className="mb-5 max-w-md">
        <label className="mb-1.5 block text-xs text-white/55">Filter by tournament</label>
        <select
          className={inputClass}
          value={filterTournament}
          onChange={(event) => setFilterTournament(event.target.value)}
        >
          <option value="">All tournaments</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.uid} · {tournament.title}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
          {notice}
        </p>
      )}

      {showForm && (
        <form onSubmit={save} className="mb-6 rounded-2xl border border-[#FF5C00]/25 bg-[#121C2E] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-white">
              {editing ? "Edit player details" : "Add player registration"}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/50">
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {!editing && (
              <label>
                <span className="mb-1.5 block text-xs text-white/55">Tournament</span>
                <select
                  required
                  className={inputClass}
                  value={values.tournament_id}
                  onChange={(event) => setValues((current) => ({ ...current, tournament_id: event.target.value }))}
                >
                  <option value="">Choose tournament</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.uid} · {tournament.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              <span className="mb-1.5 block text-xs text-white/55">Player / Captain Name</span>
              <input
                required
                maxLength={100}
                className={inputClass}
                value={values.display_name}
                onChange={(event) => setValues((current) => ({ ...current, display_name: event.target.value }))}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs text-white/55">Team Name</span>
              <input
                maxLength={100}
                className={inputClass}
                value={values.team_name}
                onChange={(event) => setValues((current) => ({ ...current, team_name: event.target.value }))}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs text-white/55">Free Fire UID</span>
              <input
                maxLength={50}
                className={inputClass}
                value={values.game_uid}
                onChange={(event) => setValues((current) => ({ ...current, game_uid: event.target.value }))}
              />
            </label>

            {!editing && (
              <label>
                <span className="mb-1.5 block text-xs text-white/55">Initial registration status</span>
                <select
                  className={inputClass}
                  value={values.status}
                  onChange={(event) => setValues((current) => ({
                    ...current,
                    status: event.target.value as FormValues["status"],
                  }))}
                >
                  <option value="registered">Registered</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </label>
            )}
          </div>

          <p className="mt-4 text-xs text-white/40">
            Slot numbers are assigned automatically. Admin-created registrations do not charge a player&apos;s wallet.
          </p>

          <div className="mt-5 flex gap-2">
            <button
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#FF5C00] px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-10 rounded-lg border border-white/10 px-4 text-sm text-white/60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121C2E]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-white/45">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading registrations...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-white/40">
            No registrations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Tournament</th>
                  <th className="px-4 py-3">Team / UID</th>
                  <th className="px-4 py-3">Slot</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rows.map((row) => {
                  const active = row.status === "registered" || row.status === "confirmed";
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white/85">{row.display_name}</p>
                        <p className="mt-1 text-[10px] text-white/35">
                          {new Date(row.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white/75">{row.tournaments?.title ?? "Unknown tournament"}</p>
                        <p className="mt-1 text-xs text-white/35">{row.tournaments?.uid ?? row.tournament_id}</p>
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        <p>{row.team_name || "—"}</p>
                        <p className="mt-1 text-xs text-white/35">{row.game_uid || "UID not set"}</p>
                      </td>
                      <td className="px-4 py-3 text-white/70">{row.slot_number ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                          row.status === "confirmed"
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : row.status === "registered"
                              ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                              : "border-white/10 bg-white/5 text-white/45"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => beginEdit(row)}
                            aria-label="Edit player details"
                            className="rounded-lg border border-white/10 p-2 text-white/65 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {active && (
                            <>
                              <button
                                disabled={busyId === row.id}
                                onClick={() => void deactivate(row, "rejected")}
                                className="rounded-lg border border-red-400/15 px-2.5 py-2 text-xs text-red-300/80 hover:text-red-300 disabled:opacity-40"
                              >
                                Reject
                              </button>
                              <button
                                disabled={busyId === row.id}
                                onClick={() => void deactivate(row, "cancelled")}
                                className="rounded-lg border border-white/10 px-2.5 py-2 text-xs text-white/55 hover:text-white disabled:opacity-40"
                              >
                                Cancel
                              </button>
                              {busyId === row.id && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}