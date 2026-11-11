import { BRAND } from "@/lib/brand";

export type TournamentMode = "Solo" | "Duo" | "Squad";
export type TournamentStatus = "live" | "upcoming" | "ended";
export type MapName = "Bermuda" | "Purgatory" | "Kalahari" | "Alpine";

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

const C = BRAND.cover;

export const tournaments: Tournament[] = [
  {
    id: "t1", slug: "ffbd-weekly-solo-cup", title: "FFBD Weekly Solo Cup", titleBn: "এফএফবিডি উইকলি সোলো কাপ",
    mode: "Solo", entryFee: 0, prizePool: 15000, slots: 48, slotsFilled: 41, status: "live",
    startAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(), cover: C, region: "BD", map: "Bermuda",
  },
  {
    id: "t2", slug: "night-squad-championship", title: "Night Squad Championship", titleBn: "নাইট স্কোয়াড চ্যাম্পিয়নশিপ",
    mode: "Squad", entryFee: 100, prizePool: 50000, slots: 24, slotsFilled: 18, status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), cover: C, region: "BD", map: "Bermuda",
  },
  {
    id: "t3", slug: "duo-rush-friday", title: "Duo Rush Friday", titleBn: "ডুও রাশ ফ্রাইডে",
    mode: "Duo", entryFee: 50, prizePool: 25000, slots: 36, slotsFilled: 29, status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(), cover: C, region: "BD", map: "Purgatory",
  },
  {
    id: "t4", slug: "free-entry-squad-clash", title: "Free Entry Squad Clash", titleBn: "ফ্রি এন্ট্রি স্কোয়াড ক্ল্যাশ",
    mode: "Squad", entryFee: 0, prizePool: 20000, slots: 20, slotsFilled: 12, status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 50).toISOString(), cover: C, region: "BD", map: "Kalahari",
  },
  {
    id: "t5", slug: "pro-solo-showdown", title: "Pro Solo Showdown", titleBn: "প্রো সোলো শোডাউন",
    mode: "Solo", entryFee: 80, prizePool: 35000, slots: 48, slotsFilled: 48, status: "ended",
    startAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), cover: C, region: "BD", map: "Alpine",
  },
  {
    id: "t6", slug: "weekend-grand-squad", title: "Weekend Grand Squad", titleBn: "উইকেন্ড গ্র্যান্ড স্কোয়াড",
    mode: "Squad", entryFee: 150, prizePool: 100000, slots: 16, slotsFilled: 9, status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(), cover: C, region: "BD", map: "Bermuda",
  },
  {
    id: "t7", slug: "midnight-solo-blitz", title: "Midnight Solo Blitz", titleBn: "মিডনাইট সোলো ব্লিটজ",
    mode: "Solo", entryFee: 30, prizePool: 12000, slots: 48, slotsFilled: 22, status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), cover: C, region: "BD", map: "Purgatory",
  },
  {
    id: "t8", slug: "dhaka-duo-open", title: "Dhaka Duo Open", titleBn: "ঢাকা ডুও ওপেন",
    mode: "Duo", entryFee: 0, prizePool: 18000, slots: 40, slotsFilled: 31, status: "live",
    startAt: new Date(Date.now() + 1000 * 60 * 90).toISOString(), cover: C, region: "BD", map: "Bermuda",
  },
  {
    id: "t9", slug: "kalahari-squad-wars", title: "Kalahari Squad Wars", titleBn: "কালাহারি স্কোয়াড ওয়ার্স",
    mode: "Squad", entryFee: 120, prizePool: 60000, slots: 20, slotsFilled: 20, status: "ended",
    startAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), cover: C, region: "BD", map: "Kalahari",
  },
  {
    id: "t10", slug: "alpine-pro-duo", title: "Alpine Pro Duo", titleBn: "আলপাইন প্রো ডুও",
    mode: "Duo", entryFee: 70, prizePool: 28000, slots: 32, slotsFilled: 14, status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(), cover: C, region: "BD", map: "Alpine",
  },
  {
    id: "t11", slug: "free-solo-friday", title: "Free Solo Friday", titleBn: "ফ্রি সোলো ফ্রাইডে",
    mode: "Solo", entryFee: 0, prizePool: 10000, slots: 48, slotsFilled: 8, status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(), cover: C, region: "BD", map: "Bermuda",
  },
  {
    id: "t12", slug: "champions-squad-final", title: "Champions Squad Final", titleBn: "চ্যাম্পিয়নস স্কোয়াড ফাইনাল",
    mode: "Squad", entryFee: 200, prizePool: 150000, slots: 12, slotsFilled: 6, status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(), cover: C, region: "BD", map: "Purgatory",
  },
];

export const teams: Team[] = [
  { id: "tm1", name: "Dhaka Dominators", logo: "", kills: 312, points: 1840, wins: 7, rank: 1 },
  { id: "tm2", name: "Chittagong Wolves", logo: "", kills: 287, points: 1720, wins: 5, rank: 2 },
  { id: "tm3", name: "Sylhet Snipers", logo: "", kills: 265, points: 1655, wins: 4, rank: 3 },
  { id: "tm4", name: "Rajshahi Royals", logo: "", kills: 241, points: 1510, wins: 3, rank: 4 },
  { id: "tm5", name: "Khulna Kings", logo: "", kills: 228, points: 1420, wins: 3, rank: 5 },
  { id: "tm6", name: "Barisal Blaze", logo: "", kills: 198, points: 1290, wins: 2, rank: 6 },
  { id: "tm7", name: "Rangpur Raiders", logo: "", kills: 176, points: 1180, wins: 2, rank: 7 },
  { id: "tm8", name: "Mymensingh Mayhem", logo: "", kills: 154, points: 1050, wins: 1, rank: 8 },
];

export const winners: Winner[] = [
  { id: "w1", name: "Rafi Ahmed", team: "Dhaka Dominators", amount: 12000, tournament: "Pro Solo Showdown", date: "2026-11-07", method: "bKash" },
  { id: "w2", name: "Nusrat Jahan", team: "Chittagong Wolves", amount: 8500, tournament: "Duo Rush", date: "2026-11-06", method: "Nagad" },
  { id: "w3", name: "Karim Hossain", amount: 5000, tournament: "FFBD Weekly Solo", date: "2026-11-05", method: "bKash" },
  { id: "w4", name: "Sadia Akter", team: "Sylhet Snipers", amount: 15000, tournament: "Night Squad", date: "2026-11-04", method: "Nagad" },
  { id: "w5", name: "Imran Khan", amount: 3500, tournament: "Free Entry Clash", date: "2026-11-03", method: "bKash" },
  { id: "w6", name: "Tanvir Islam", team: "Rajshahi Royals", amount: 22000, tournament: "Kalahari Squad Wars", date: "2026-11-02", method: "bKash" },
  { id: "w7", name: "Fahim Hasan", amount: 4000, tournament: "Midnight Solo Blitz", date: "2026-11-01", method: "Nagad" },
];

export const sponsors = [
  "bKash", "Nagad", "Garena", "Redmi", "Robi", "Daraz",
];

export const stats = {
  prizePoolPaid: 2450000,
  teamsRegistered: 18420,
  tournamentsHeld: 312,
};
