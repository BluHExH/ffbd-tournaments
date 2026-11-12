import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTournamentBySlug, getRelatedTournaments } from "@/services/tournamentService";
import TournamentDetailClient from "./TournamentDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTournamentBySlug(slug);
  if (!t) return { title: "Tournament not found" };
  return {
    title: `${t.title} | FFBD Tournaments`,
    description: t.description || t.title,
    openGraph: {
      title: t.title,
      description: t.description || t.title,
      images: t.cover ? [{ url: t.cover }] : [],
      type: "website",
    },
  };
}

export default async function TournamentDetailPage({ params }: Props) {
  const { slug } = await params;
  const [tournament, related] = await Promise.all([
    getTournamentBySlug(slug),
    getRelatedTournaments(slug, 3),
  ]);
  if (!tournament) notFound();
  return <TournamentDetailClient tournament={tournament} related={related} />;
}
