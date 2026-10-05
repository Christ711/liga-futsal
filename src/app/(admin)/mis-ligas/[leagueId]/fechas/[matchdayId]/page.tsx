import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMatchdayView } from "@/server/queries/matchday";
import { getLeagueTables } from "@/server/queries/tables";

import { loadOwnedLeague } from "../../owned-league";
import { MatchdayScreen } from "./matchday-view";

type Props = { params: Promise<{ leagueId: string; matchdayId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leagueId } = await params;
  const league = await loadOwnedLeague(leagueId);
  return { title: `Fecha - ${league.name} - Liga Futsal` };
}

/** Vista de una fecha para usar en la cancha (RF-52). La autoriza el layout de la liga. */
export default async function MatchdayPage({ params }: Props) {
  const { leagueId, matchdayId } = await params;
  await loadOwnedLeague(leagueId);
  const [view, tables] = await Promise.all([
    getMatchdayView(leagueId, matchdayId),
    getLeagueTables(leagueId),
  ]);
  if (!view) notFound();

  return (
    <main className="mx-auto grid w-full max-w-lg px-4 py-6">
      <MatchdayScreen initialView={view} initialTables={tables} />
    </main>
  );
}
