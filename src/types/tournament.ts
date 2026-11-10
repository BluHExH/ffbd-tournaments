export type TournamentMode = "Solo" | "Duo" | "Squad";
export type TournamentStatus = "live" | "upcoming" | "ended";
export type MapName = "Bermuda" | "Purgatory" | "Kalahari" | "Alpine";

export type ModeFilter = TournamentMode | "all";
export type EntryFilter = "all" | "free" | "paid";
export type StatusFilter = TournamentStatus | "all";
export type MapFilter = MapName | "all";
export type SortOption = "starting-soon" | "biggest-prize" | "lowest-entry";

export interface Tournament {
  id: string;
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
  description?: string;
  descriptionBn?: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  kills: number;
  points: number;
  wins: number;
  rank: number;
}

export interface Winner {
  id: string;
  name: string;
  team?: string;
  amount: number;
  tournament: string;
  date: string;
  method: "bKash" | "Nagad";
}
