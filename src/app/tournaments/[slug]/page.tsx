import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTournamentBySlug, getRelatedTournaments } from "@/services/tournamentService";
import TournamentDetailClient from "./TournamentDetailClient";
import { createClient } from "@/lib/supabase/server";

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
  const db = await createClient();
  const [
    { data: content },
    { data: participants },
    { data: results },
    { data: matches },
  ] = await Promise.all([
    db.from("tournament_content").select("*").eq("tournament_id", tournament.id).maybeSingle(),
    db.rpc("get_public_tournament_roster", { p_tournament_id: tournament.id }),
    db.rpc("get_public_tournament_results", { p_tournament_id: tournament.id }),
    db.from("tournament_matches").select("id,match_number,map,start_at,status,notes").eq("tournament_id", tournament.id).order("match_number", { ascending: true }),
  ]);
  return <TournamentDetailClient tournament={tournament} related={related} content={content} participants={participants || []} results={results || []} matches={matches || []} />;
}
