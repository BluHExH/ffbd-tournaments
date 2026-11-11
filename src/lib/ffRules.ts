/** Standard Free Fire tournament / esports rules used in BD + international cups */

export const GENERAL_RULES = {
  en: [
    "All players must use their own Free Fire account. Account sharing is not allowed.",
    "Join the custom room within the given time. Late join may lead to forfeit of that match.",
    "Team names and in-game names must not contain offensive, political, or banned words.",
    "Players must stay in the lobby until the match starts. Leaving early can result in a penalty.",
    "Only the registered players/slots may play. Substitutes need organizer approval before the match.",
    "Internet or device issues are the player's responsibility. Matches will not be restarted for lag alone.",
    "Screenshot or recording of results may be requested by admins for verification.",
    "Organizer decisions on disputes are final after review of evidence.",
    "Respect opponents and staff. Toxic behaviour in chat or voice may lead to a warning or ban.",
    "Prize is paid only to the registered bKash / Nagad number after result confirmation.",
  ],
  bn: [
    "সবাই নিজের ফ্রি ফায়ার অ্যাকাউন্ট ব্যবহার করবে। অ্যাকাউন্ট শেয়ার করা যাবে না।",
    "নির্ধারিত সময়ের মধ্যে কাস্টম রুমে জয়েন করতে হবে। দেরি হলে সেই ম্যাচ ফরফিট হতে পারে।",
    "টিম নাম ও ইন-গেম নামে খারাপ, রাজনৈতিক বা নিষিদ্ধ শব্দ থাকতে পারবে না।",
    "ম্যাচ শুরু না হওয়া পর্যন্ত লবিতে থাকতে হবে। আগে বের হলে পেনাল্টি হতে পারে।",
    "শুধু রেজিস্টার্ড প্লেয়ার/স্লট খেলতে পারবে। সাবস্টিটিউট হলে আগে অ্যাডমিন অনুমোদন লাগবে।",
    "ইন্টারনেট বা ডিভাইস সমস্যা প্লেয়ারের দায়। শুধু ল্যাগের জন্য ম্যাচ রিস্টার্ট হবে না।",
    "রেজাল্ট ভেরিফাই করতে অ্যাডমিন স্ক্রিনশট বা রেকর্ডিং চাইতে পারে।",
    "বিবাদের ক্ষেত্রে প্রমাণ দেখে আয়োজকের সিদ্ধান্তই চূড়ান্ত।",
    "প্রতিপক্ষ ও স্টাফকে সম্মান করুন। চ্যাট/ভয়েসে টক্সিক আচরণে সতর্কতা বা ব্যান হতে পারে।",
    "রেজাল্ট কনফার্মের পর শুধু রেজিস্টার্ড বিকাশ/নগদ নম্বরে প্রাইজ দেওয়া হবে।",
  ],
};

export const BANNED = {
  en: [
    "Any hack, mod menu, aimbot, wallhack, or third-party cheat",
    "Emulator (unless the cup is marked Emulator-allowed)",
    "Teaming with another squad/solo in BR matches",
    "Account boosting / rank boosting services",
    "Ghosting (stream sniping or outside help during live match)",
    "Intentionally disconnecting to avoid loss or abuse matchmaking",
  ],
  bn: [
    "হ্যাক, মড মেনু, এইমবট, ওয়ালহ্যাক বা যেকোনো থার্ড-পার্টি চিট",
    "এমুলেটর (কাপে Emulator-allowed না লেখা থাকলে)",
    "অন্য স্কোয়াড/সোলোর সাথে টিমিং",
    "অ্যাকাউন্ট বুস্টিং / র‍্যাঙ্ক বুস্টিং সার্ভিস",
    "ঘোস্টিং (স্ট্রিম স্নাইপ বা বাইরে থেকে সাহায্য)",
    "ইচ্ছাকৃত ডিসকানেক্ট করে ম্যাচ এড়ানো",
  ],
};

export const PENALTIES = [
  { offense: { en: "Late to room (after match start)", bn: "রুম দেরি (ম্যাচ শুরুর পর)" }, action: { en: "Match forfeit / 0 points", bn: "ম্যাচ ফরফিট / ০ পয়েন্ট" } },
  { offense: { en: "Wrong slot / wrong player", bn: "ভুল স্লট / ভুল প্লেয়ার" }, action: { en: "Warning or disqualification", bn: "সতর্কতা বা ডিসকোয়ালিফাই" } },
  { offense: { en: "Toxic chat / abuse", bn: "টক্সিক চ্যাট / গালি" }, action: { en: "Warning → ban from cup", bn: "সতর্কতা → কাপ থেকে ব্যান" } },
  { offense: { en: "Proven cheat / hack", bn: "প্রমাণিত চিট / হ্যাক" }, action: { en: "Immediate DQ + permanent ban", bn: "তৎক্ষণাৎ DQ + স্থায়ী ব্যান" } },
  { offense: { en: "Teaming", bn: "টিমিং" }, action: { en: "DQ from that match or full cup", bn: "সেই ম্যাচ বা পুরো কাপ থেকে DQ" } },
  { offense: { en: "No-show without notice", bn: "নোটিস ছাড়া নো-শো" }, action: { en: "Slot lost, no refund (paid cups)", bn: "স্লট বাতিল, রিফান্ড নেই (পেইড কাপ)" } },
];

/** Classic BR placement points used in many Free Fire community cups */
export const PLACEMENT_POINTS: { place: number; points: number }[] = [
  { place: 1, points: 12 },
  { place: 2, points: 9 },
  { place: 3, points: 8 },
  { place: 4, points: 7 },
  { place: 5, points: 6 },
  { place: 6, points: 5 },
  { place: 7, points: 4 },
  { place: 8, points: 3 },
  { place: 9, points: 2 },
  { place: 10, points: 1 },
  { place: 11, points: 0 },
  { place: 12, points: 0 },
];

export const KILL_POINT = 1;

export function defaultPrizes(prizePool: number, mode: string) {
  if (mode === "Solo") {
    return [
      { place: "1st", amount: Math.round(prizePool * 0.4) },
      { place: "2nd", amount: Math.round(prizePool * 0.25) },
      { place: "3rd", amount: Math.round(prizePool * 0.15) },
      { place: "4th–5th", amount: Math.round(prizePool * 0.1) },
      { place: "MVP (most kills)", amount: Math.round(prizePool * 0.1) },
    ];
  }
  if (mode === "Duo") {
    return [
      { place: "1st", amount: Math.round(prizePool * 0.4) },
      { place: "2nd", amount: Math.round(prizePool * 0.25) },
      { place: "3rd", amount: Math.round(prizePool * 0.15) },
      { place: "4th", amount: Math.round(prizePool * 0.1) },
      { place: "Most kills", amount: Math.round(prizePool * 0.1) },
    ];
  }
  return [
    { place: "1st", amount: Math.round(prizePool * 0.4) },
    { place: "2nd", amount: Math.round(prizePool * 0.25) },
    { place: "3rd", amount: Math.round(prizePool * 0.15) },
    { place: "4th", amount: Math.round(prizePool * 0.1) },
    { place: "MVP / Most kills", amount: Math.round(prizePool * 0.1) },
  ];
}

export function defaultSchedule(startAt: string, map: string) {
  const start = new Date(startAt);
  const maps = [map, "Bermuda", "Purgatory", "Kalahari"].filter(
    (m, i, a) => a.indexOf(m) === i
  );
  return [1, 2, 3].map((n, i) => {
    const t = new Date(start.getTime() + i * 35 * 60 * 1000);
    return {
      match: n,
      map: maps[i % maps.length],
      time: t.toISOString(),
      status: i === 0 ? "upcoming" : "scheduled",
    };
  });
}
