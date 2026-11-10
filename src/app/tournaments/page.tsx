"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TournamentCard from "@/components/TournamentCard";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";
import { tournaments } from "@/data/seed";

export default function TournamentsPage() {
  const { t } = useLanguage();

  return (
    <>
      <Navbar />
      <main>
        <section className="relative pt-24 pb-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0B1221_0%,#121C2E_50%,#0B1221_100%)]" />
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

        <section className="section-dark py-10 md:py-14 min-h-[50vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-white/50 text-sm mb-6">
              {tournaments.length} tournaments
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tournaments.map((tour) => (
                <TournamentCard key={tour.id} tournament={tour as any} fluid />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/" className="text-[#FF5C00] font-semibold hover:underline">
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
