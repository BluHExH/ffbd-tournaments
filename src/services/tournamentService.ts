import { tournaments } from "@/data/seed";
import type {
  Tournament,
  ModeFilter,
  EntryFilter,
  StatusFilter,
  MapFilter,
  SortOption,
} from "@/types/tournament";

export interface TournamentFilters {
  mode?: ModeFilter;
  entry?: EntryFilter;
  status?: StatusFilter;
  map?: MapFilter;
  search?: string;
  sort?: SortOption;
}

export function getTournaments(filters: TournamentFilters = {}): Tournament[] {
  let list = [...tournaments] as Tournament[];

  if (filters.mode && filters.mode !== "all") {
    list = list.filter((t) => t.mode === filters.mode);
  }
  if (filters.entry === "free") {
    list = list.filter((t) => t.entryFee === 0);
  } else if (filters.entry === "paid") {
    list = list.filter((t) => t.entryFee > 0);
  }
  if (filters.status && filters.status !== "all") {
    list = list.filter((t) => t.status === filters.status);
  }
  if (filters.map && filters.map !== "all") {
    list = list.filter((t) => t.map === filters.map);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.titleBn.includes(q) ||
        t.mode.toLowerCase().includes(q) ||
        t.map.toLowerCase().includes(q)
    );
  }

  const sort = filters.sort ?? "starting-soon";
  list.sort((a, b) => {
    if (sort === "biggest-prize") return b.prizePool - a.prizePool;
    if (sort === "lowest-entry") return a.entryFee - b.entryFee;
    const order = { live: 0, upcoming: 1, ended: 2 } as const;
    const oa = order[a.status];
    const ob = order[b.status];
    if (oa !== ob) return oa - ob;
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  return list;
}

export function getTournamentBySlug(slug: string): Tournament | undefined {
  return (tournaments as Tournament[]).find((t) => t.slug === slug);
}

export function getRelatedTournaments(slug: string, limit = 3): Tournament[] {
  const current = getTournamentBySlug(slug);
  if (!current) return getTournaments({ status: "upcoming" }).slice(0, limit);
  return getTournaments({ mode: current.mode, status: "upcoming" })
    .filter((t) => t.slug !== slug)
    .slice(0, limit);
}

export function getAllSlugs(): string[] {
  return tournaments.map((t) => t.slug);
}
