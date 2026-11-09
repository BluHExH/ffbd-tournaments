import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTournamentBySlug, getAllSlugs, getRelatedTournaments } from "@/services/tournamentService";
import TournamentDetailClient from "./TournamentDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTournamentBySlug(slug);
  if (!t) return { title: "Tournament not found" };
  return {
    title: `${t.title} | FFBD Tournaments`,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      images: t.cover ? [{ url: t.cover }] : [],
      type: "website",
    },
  };
}

export default async function TournamentDetailPage({ params }: Props) {
  const { slug } = await params;
  const tournament = getTournamentBySlug(slug);
  if (!tournament) notFound();
  const related = getRelatedTournaments(slug, 3);

  return (
    <TournamentDetailClient tournament={tournament} related={related} />
  );
}
