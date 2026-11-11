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
  description?: string;
  descriptionBn?: string;
  roomId?: string | null;
  roomPassword?: string | null;
}

export interface TournamentRow {
  id: string;
  uid: string;
  slug: string;
  title: string;
  title_bn: string;
  mode: TournamentMode;
  entry_fee: number;
  prize_pool: number;
  slots: number;
  slots_filled: number;
  status: TournamentStatus;
  start_at: string;
  cover: string | null;
  region: string;
  map: MapName;
  description: string | null;
  description_bn: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomCredentialsRow {
  tournament_id: string;
  room_id: string | null;
  room_password: string | null;
  updated_at: string;
}

export function mapRowToTournament(
  row: TournamentRow,
  credentials?: RoomCredentialsRow | null
): Tournament {
  return {
    id: row.id,
    uid: row.uid,
    slug: row.slug,
    title: row.title,
    titleBn: row.title_bn,
    mode: row.mode,
    entryFee: row.entry_fee,
    prizePool: row.prize_pool,
    slots: row.slots,
    slotsFilled: row.slots_filled,
    status: row.status,
    startAt: row.start_at,
    cover: row.cover || "",
    region: row.region,
    map: row.map,
    description: row.description || undefined,
    descriptionBn: row.description_bn || undefined,
    roomId: credentials?.room_id ?? null,
    roomPassword: credentials?.room_password ?? null,
  };
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
