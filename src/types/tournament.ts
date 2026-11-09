export type TournamentMode = "Solo" | "Duo" | "Squad";
export type TournamentStatus = "live" | "upcoming" | "ended";
export type MapName = "Bermuda" | "Purgatory" | "Kalahari" | "Alpine";

export interface Tournament {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
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
  matchCount: number;
  teamSize: number;
  organizerNote: string;
  organizerNoteBn: string;
  rules: string[];
  rulesBn: string[];
  bannedItems: string[];
  bannedItemsBn: string[];
  penalties: { offense: string; offenseBn: string; penalty: string; penaltyBn: string }[];
  placementPoints: { place: number; points: number }[];
  killPoint: number;
  schedule: ScheduleItem[];
  prizes: PrizeRow[];
  specialAwards: { name: string; nameBn: string; amount: number }[];
  registeredTeams: RegisteredTeam[];
  results?: MatchResult[];
}

export interface ScheduleItem {
  id: string;
  matchNumber: number;
  map: MapName;
  startAt: string;
  status: "upcoming" | "live" | "completed";
}

export interface PrizeRow {
  position: number | string;
  amount: number;
  label?: string;
  labelBn?: string;
}

export interface RegisteredTeam {
  id: string;
  name: string;
  logo?: string;
  members?: string[];
}

export interface MatchResult {
  matchId: string;
  matchNumber: number;
  map: MapName;
  rankings: {
    rank: number;
    teamId: string;
    teamName: string;
    kills: number;
    placementPoints: number;
    totalPoints: number;
  }[];
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

export type SortOption = "starting-soon" | "biggest-prize" | "lowest-entry";
export type EntryFilter = "all" | "free" | "paid";
export type ModeFilter = "all" | "Solo" | "Duo" | "Squad";
export type StatusFilter = "all" | "upcoming" | "live" | "ended";
export type MapFilter = "all" | MapName;
