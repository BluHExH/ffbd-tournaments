import { createClient } from "@/lib/supabase/server";
import { mapRowToTournament, type TournamentRow, type Tournament } from "@/types/tournament";

export interface TournamentFilters {
  mode?: "Solo" | "Duo" | "Squad" | "all";
  entry?: "all" | "free" | "paid";
  status?: "live" | "upcoming" | "ended" | "all";
  map?: "Bermuda" | "Purgatory" | "Kalahari" | "Alpine" | "all";
  search?: string;
  sort?: "starting-soon" | "biggest-prize" | "lowest-entry";
}

export async function getTournaments(filters: TournamentFilters = {}): Promise<Tournament[]> {
  const supabase = await createClient();
  let query = supabase.from("tournaments").select("*");
  if (filters.mode && filters.mode !== "all") query = query.eq("mode", filters.mode);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.map && filters.map !== "all") query = query.eq("map", filters.map);
  if (filters.entry === "free") query = query.eq("entry_fee", 0);
  if (filters.entry === "paid") query = query.gt("entry_fee", 0);
  if (filters.search?.trim()) {
    const q = filters.search.trim().replace(/[,%()]/g, " ");
    query = query.or(`title.ilike.%${q}%,title_bn.ilike.%${q}%,mode.ilike.%${q}%,map.ilike.%${q}%`);
  }
  const sort = filters.sort ?? "starting-soon";
  if (sort === "biggest-prize") query = query.order("prize_pool", { ascending: false });
  else if (sort === "lowest-entry") query = query.order("entry_fee", { ascending: true });
  else query = query.order("start_at", { ascending: true });
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load tournaments: ${error.message}`);
  return (data ?? []).map((row) => mapRowToTournament(row as TournamentRow));
}

export async function getTournamentBySlug(slug: string): Promise<Tournament | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tournaments").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Unable to load tournament: ${error.message}`);
  return data ? mapRowToTournament(data as TournamentRow) : undefined;
}

export async function getRelatedTournaments(slug: string, limit = 3): Promise<Tournament[]> {
  const current = await getTournamentBySlug(slug);
  const supabase = await createClient();
  let query = supabase.from("tournaments").select("*").eq("status", "upcoming").neq("slug", slug);
  if (current) query = query.eq("mode", current.mode);
  const { data, error } = await query.order("start_at", { ascending: true }).limit(limit);
  if (error) throw new Error(`Unable to load related tournaments: ${error.message}`);
  return (data ?? []).map((row) => mapRowToTournament(row as TournamentRow));
}
