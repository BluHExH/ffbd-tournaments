"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TournamentCard from "@/components/TournamentCard";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";
import { tournaments } from "@/data/seed";
import { BRAND } from "@/lib/brand";

export default function TournamentsPage() {
  const { t } = useLanguage();

  return (
    <>
      <Navbar />
      <main>
        {/* Header with cover strip */}
        <section className="relative pt-24 pb-12 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND.cover}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-[#0B1221]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1221]/40 to-[#0B1221]" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              title={t("tournaments.title")}
              subtitle={t("tournaments.subtitle")}
              light
              align="left"
              className="mb-0"
            />
          </div>
        </section>

        {/* Grid */}
        <section className="section-dark py-10 md:py-14 min-h-[50vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/50 text-sm">
                <span className="text-white font-semibold">{tournaments.length}</span> tournaments
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tournaments.map((tour) => (
                <TournamentCard key={tour.id} tournament={tour as any} fluid />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF5C00] hover:text-[#FF7A33] transition-colors"
              >
                ← Home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
