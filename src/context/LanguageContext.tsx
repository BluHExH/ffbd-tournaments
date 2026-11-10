"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Lang = "en" | "bn";

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const translations: Record<string, { en: string; bn: string }> = {
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.tournaments": { en: "Tournaments", bn: "টুর্নামেন্ট" },
  "nav.how": { en: "How it Works", bn: "কিভাবে খেলবেন" },
  "nav.winners": { en: "Winners", bn: "বিজয়ী" },
  "nav.faq": { en: "FAQ", bn: "জিজ্ঞাসা" },
  "nav.login": { en: "Login", bn: "লগইন" },
  "nav.join": { en: "Join Now", bn: "যোগ দিন" },
  "hero.headline": {
    en: "Bangladesh's Biggest Free Fire Tournaments",
    bn: "বাংলাদেশের সবচেয়ে বড় ফ্রি ফায়ার টুর্নামেন্ট",
  },
  "hero.sub": {
    en: "Free entry & paid cups. Instant room ID. Real bKash / Nagad payouts. Play fair, win big.",
    bn: "ফ্রি এন্ট্রি ও পেইড কাপ। ইনস্ট্যান্ট রুম আইডি। আসল বিকাশ / নগদ পেআউট। ফেয়ার প্লে, বড় জয়।",
  },
  "hero.cta1": { en: "Register Now", bn: "এখনই রেজিস্টার" },
  "hero.cta2": { en: "View Tournaments", bn: "টুর্নামেন্ট দেখুন" },
  "hero.stat1": { en: "Prize Pool Paid", bn: "প্রাইজ পুল প্রদান" },
  "hero.stat2": { en: "Teams Registered", bn: "টিম রেজিস্টার্ড" },
  "hero.stat3": { en: "Tournaments Held", bn: "টুর্নামেন্ট অনুষ্ঠিত" },
  "live.title": { en: "Live & Upcoming", bn: "লাইভ ও আসন্ন" },
  "live.viewAll": { en: "View All", bn: "সব দেখুন" },
  "how.title": { en: "How It Works", bn: "কিভাবে কাজ করে" },
  "how.step1": { en: "Register", bn: "রেজিস্টার করুন" },
  "how.step1.desc": {
    en: "Create free account & pick your tournament",
    bn: "ফ্রি অ্যাকাউন্ট তৈরি করে টুর্নামেন্ট বেছে নিন",
  },
  "how.step2": { en: "Pay via bKash / Nagad", bn: "বিকাশ / নগদে পেমেন্ট" },
  "how.step2.desc": {
    en: "Secure payment for paid cups. Free cups need no payment.",
    bn: "পেইড কাপের জন্য নিরাপদ পেমেন্ট। ফ্রি কাপে পেমেন্ট লাগে না।",
  },
  "how.step3": { en: "Get Room ID", bn: "রুম আইডি পান" },
  "how.step3.desc": {
    en: "Room ID & password sent before match starts",
    bn: "ম্যাচ শুরুর আগে রুম আইডি ও পাসওয়ার্ড পাঠানো হয়",
  },
  "how.step4": { en: "Play & Win", bn: "খেলুন ও জিতুন" },
  "how.step4.desc": {
    en: "Compete fairly and get prize instantly on bKash/Nagad",
    bn: "ফেয়ার খেলে বিকাশ/নগদে তাৎক্ষণিক প্রাইজ পান",
  },
  "stats.title": { en: "Prize Pool & Stats", bn: "প্রাইজ পুল ও পরিসংখ্যান" },
  "teams.title": { en: "Top Teams & Recent Winners", bn: "শীর্ষ টিম ও সাম্প্রতিক বিজয়ী" },
  "featured.title": { en: "Featured Tournament", bn: "ফিচার্ড টুর্নামেন্ট" },
  "payout.title": { en: "Recent Payouts", bn: "সাম্প্রতিক পেআউট" },
  "sponsors.title": { en: "Our Partners", bn: "আমাদের পার্টনার" },
  "faq.title": { en: "Frequently Asked Questions", bn: "সাধারণ জিজ্ঞাসা" },
  "cta.title": { en: "Ready to dominate the battlefield?", bn: "যুদ্ধক্ষেত্র দখল করতে প্রস্তুত?" },
  "cta.sub": {
    en: "Join thousands of Bangladeshi Free Fire players. Next tournament starts soon.",
    bn: "হাজার হাজার বাংলাদেশি ফ্রি ফায়ার খেলোয়াড়ের সাথে যোগ দিন। পরবর্তী টুর্নামেন্ট শীঘ্রই শুরু।",
  },
  "cta.button": { en: "Create Free Account", bn: "ফ্রি অ্যাকাউন্ট তৈরি করুন" },
  "footer.tagline": {
    en: "Bangladesh's most trusted Free Fire tournament platform.",
    bn: "বাংলাদেশের সবচেয়ে বিশ্বস্ত ফ্রি ফায়ার টুর্নামেন্ট প্ল্যাটফর্ম।",
  },
  "footer.rights": { en: "All rights reserved.", bn: "সর্বস্বত্ব সংরক্ষিত।" },
  "footer.quick": { en: "Quick Links", bn: "দ্রুত লিংক" },
  "footer.support": { en: "Support", bn: "সাপোর্ট" },
  "footer.social": { en: "Follow Us", bn: "ফলো করুন" },
  "common.free": { en: "FREE", bn: "ফ্রি" },
  "common.paid": { en: "PAID", bn: "পেইড" },
  "common.solo": { en: "Solo", bn: "সোলো" },
  "common.duo": { en: "Duo", bn: "ডুও" },
  "common.squad": { en: "Squad", bn: "স্কোয়াড" },
  "common.live": { en: "LIVE", bn: "লাইভ" },
  "common.upcoming": { en: "Upcoming", bn: "আসন্ন" },
  "common.ended": { en: "Ended", bn: "সমাপ্ত" },
  "common.slots": { en: "slots left", bn: "স্লট বাকি" },
  "common.prize": { en: "Prize Pool", bn: "প্রাইজ পুল" },
  "common.entry": { en: "Entry Fee", bn: "এন্ট্রি ফি" },
  "common.register": { en: "Register", bn: "রেজিস্টার" },
  "common.kills": { en: "Kills", bn: "কিল" },
  "common.points": { en: "Points", bn: "পয়েন্ট" },
  "tournaments.title": { en: "Tournaments", bn: "টুর্নামেন্ট" },
  "tournaments.subtitle": {
    en: "Browse free and paid Free Fire cups. Filter by mode, map and status.",
    bn: "ফ্রি ও পেইড ফ্রি ফায়ার কাপ ব্রাউজ করুন। মোড, ম্যাপ ও স্ট্যাটাস দিয়ে ফিল্টার করুন।",
  },
  "tournaments.search": { en: "Search tournaments...", bn: "টুর্নামেন্ট খুঁজুন..." },
  "tournaments.mode": { en: "Mode", bn: "মোড" },
  "tournaments.entry": { en: "Entry", bn: "এন্ট্রি" },
  "tournaments.status": { en: "Status", bn: "স্ট্যাটাস" },
  "tournaments.map": { en: "Map", bn: "ম্যাপ" },
  "tournaments.sort": { en: "Sort", bn: "সাজান" },
  "tournaments.sort.soon": { en: "Starting soon", bn: "শীঘ্রই শুরু" },
  "tournaments.sort.prize": { en: "Biggest prize", bn: "সবচেয়ে বড় প্রাইজ" },
  "tournaments.sort.entry": { en: "Lowest entry", bn: "সবচেয়ে কম এন্ট্রি" },
  "tournaments.reset": { en: "Reset filters", bn: "ফিল্টার রিসেট" },
  "tournaments.empty": { en: "No tournaments match your filters", bn: "আপনার ফিল্টারের সাথে কোনো টুর্নামেন্ট মিলেনি" },
  "tournaments.loadMore": { en: "Load more", bn: "আরো দেখুন" },
  "tournaments.all": { en: "All", bn: "সব" },
  "detail.register": { en: "Register Now", bn: "এখনই রেজিস্টার" },
  "detail.full": { en: "Tournament full", bn: "টুর্নামেন্ট পূর্ণ" },
  "detail.closed": { en: "Registration closed", bn: "রেজিস্ট্রেশন বন্ধ" },
  "detail.slots": { en: "Slots filled", bn: "স্লট পূর্ণ" },
  "detail.overview": { en: "Overview", bn: "ওভারভিউ" },
  "detail.rules": { en: "Rules", bn: "নিয়ম" },
  "detail.schedule": { en: "Schedule", bn: "শিডিউল" },
  "detail.prizes": { en: "Prizes", bn: "প্রাইজ" },
  "detail.teams": { en: "Teams", bn: "টিম" },
  "detail.results": { en: "Results", bn: "রেজাল্ট" },
  "detail.room": { en: "Room details", bn: "রুম ডিটেইলস" },
  "detail.roomLocked": {
    en: "Room ID and password unlock 10 minutes before start",
    bn: "রুম আইডি ও পাসওয়ার্ড শুরুর ১০ মিনিট আগে আনলক হবে",
  },
  "detail.share": { en: "Share", bn: "শেয়ার" },
  "detail.related": { en: "Related tournaments", bn: "সম্পর্কিত টুর্নামেন্ট" },
  "detail.points": { en: "Points system", bn: "পয়েন্ট সিস্টেম" },
  "detail.placement": { en: "Placement", bn: "প্লেসমেন্ট" },
  "detail.killPoint": { en: "1 point per kill", bn: "প্রতি কিল ১ পয়েন্ট" },
  "detail.banned": { en: "Banned", bn: "নিষিদ্ধ" },
  "detail.penalties": { en: "Penalties", bn: "পেনাল্টি" },
  "detail.format": { en: "Format", bn: "ফরম্যাট" },
  "detail.matches": { en: "Matches", bn: "ম্যাচ" },
  "detail.start": { en: "Start time (BD)", bn: "শুরুর সময় (বাংলাদেশ)" },
  "detail.organizer": { en: "Organizer note", bn: "আয়োজকের নোট" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("ffbd-lang") as Lang | null;
    if (saved === "en" || saved === "bn") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("ffbd-lang", l);
    document.documentElement.lang = l === "bn" ? "bn" : "en";
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry.en;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
