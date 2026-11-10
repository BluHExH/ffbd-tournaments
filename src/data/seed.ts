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

export const tournaments: Tournament[] = [
  {
    id: "t1",
    slug: "ffbd-weekly-solo-cup",
    title: "FFBD Weekly Solo Cup",
    titleBn: "এফএফবিডি উইকলি সোলো কাপ",
    mode: "Solo",
    entryFee: 0,
    prizePool: 15000,
    slots: 48,
    slotsFilled: 41,
    status: "live",
    startAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    cover: "/images/cover-solo.jpg",
    region: "BD",
    map: "Bermuda",
  },
  {
    id: "t2",
    slug: "night-squad-championship",
    title: "Night Squad Championship",
    titleBn: "নাইট স্কোয়াড চ্যাম্পিয়নশিপ",
    mode: "Squad",
    entryFee: 100,
    prizePool: 50000,
    slots: 24,
    slotsFilled: 18,
    status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    cover: "/images/cover-squad.jpg",
    region: "BD",
    map: "Bermuda",
  },
  {
    id: "t3",
    slug: "duo-rush-friday",
    title: "Duo Rush Friday",
    titleBn: "ডুও রাশ ফ্রাইডে",
    mode: "Duo",
    entryFee: 50,
    prizePool: 25000,
    slots: 36,
    slotsFilled: 29,
    status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
    cover: "/images/cover-duo.jpg",
    region: "BD",
    map: "Purgatory",
  },
  {
    id: "t4",
    slug: "free-entry-squad-clash",
    title: "Free Entry Squad Clash",
    titleBn: "ফ্রি এন্ট্রি স্কোয়াড ক্ল্যাশ",
    mode: "Squad",
    entryFee: 0,
    prizePool: 20000,
    slots: 20,
    slotsFilled: 12,
    status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 50).toISOString(),
    cover: "/images/cover-free.jpg",
    region: "BD",
    map: "Kalahari",
  },
  {
    id: "t5",
    slug: "pro-solo-showdown",
    title: "Pro Solo Showdown",
    titleBn: "প্রো সোলো শোডাউন",
    mode: "Solo",
    entryFee: 80,
    prizePool: 35000,
    slots: 48,
    slotsFilled: 48,
    status: "ended",
    startAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    cover: "/images/cover-pro.jpg",
    region: "BD",
    map: "Alpine",
  },
  {
    id: "t6",
    slug: "weekend-grand-squad",
    title: "Weekend Grand Squad",
    titleBn: "উইকেন্ড গ্র্যান্ড স্কোয়াড",
    mode: "Squad",
    entryFee: 150,
    prizePool: 100000,
    slots: 16,
    slotsFilled: 9,
    status: "upcoming",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    cover: "/images/cover-grand.jpg",
    region: "BD",
    map: "Bermuda",
  },
];

export const teams: Team[] = [
  { id: "tm1", name: "Dhaka Dominators", logo: "/images/teams/dhaka.png", kills: 312, points: 1840, wins: 7, rank: 1 },
  { id: "tm2", name: "Chittagong Wolves", logo: "/images/teams/ctg.png", kills: 287, points: 1720, wins: 5, rank: 2 },
  { id: "tm3", name: "Sylhet Snipers", logo: "/images/teams/sylhet.png", kills: 265, points: 1655, wins: 4, rank: 3 },
  { id: "tm4", name: "Rajshahi Royals", logo: "/images/teams/raj.png", kills: 241, points: 1510, wins: 3, rank: 4 },
  { id: "tm5", name: "Khulna Kings", logo: "/images/teams/khulna.png", kills: 228, points: 1420, wins: 3, rank: 5 },
  { id: "tm6", name: "Barisal Blaze", logo: "/images/teams/barisal.png", kills: 198, points: 1290, wins: 2, rank: 6 },
  { id: "tm7", name: "Rangpur Raiders", logo: "/images/teams/rangpur.png", kills: 176, points: 1180, wins: 2, rank: 7 },
  { id: "tm8", name: "Mymensingh Mayhem", logo: "/images/teams/mym.png", kills: 154, points: 1050, wins: 1, rank: 8 },
];

export const winners: Winner[] = [
  { id: "w1", name: "Rafi Ahmed", team: "Dhaka Dominators", amount: 12000, tournament: "Pro Solo Showdown", date: "2026-11-07", method: "bKash" },
  { id: "w2", name: "Nusrat Jahan", team: "Chittagong Wolves", amount: 8500, tournament: "Duo Rush", date: "2026-11-06", method: "Nagad" },
  { id: "w3", name: "Karim Hossain", amount: 5000, tournament: "FFBD Weekly Solo", date: "2026-11-05", method: "bKash" },
  { id: "w4", name: "Sadia Akter", team: "Sylhet Snipers", amount: 15000, tournament: "Night Squad", date: "2026-11-04", method: "Nagad" },
  { id: "w5", name: "Imran Khan", amount: 3500, tournament: "Free Entry Clash", date: "2026-11-03", method: "bKash" },
];

export const stats = {
  prizePoolPaid: 2450000,
  teamsRegistered: 18420,
  tournamentsHeld: 312,
};
