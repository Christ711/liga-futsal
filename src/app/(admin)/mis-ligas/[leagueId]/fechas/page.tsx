import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getLeagueAdmin } from "@/server/queries/league-admin";

import { MatchdaysSection } from "../matchdays-section";
import { loadOwnedLeague } from "../owned-league";

type Props = { params: Promise<{ leagueId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await loadOwnedLeague((await params).leagueId);
  return { title: `Fechas - ${league.name} - Liga Futsal` };
}

/** Fechas de la liga (plan D22). Una liga finalizada ya no las tiene (RF-75). */
export default async function LeagueMatchdaysPage({ params }: Props) {
  const { leagueId } = await params;
  await loadOwnedLeague(leagueId);
  const league = await getLeagueAdmin(leagueId);
  if (league.finalized) redirect(`/mis-ligas/${leagueId}`);

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-6">
      <MatchdaysSection
        leagueId={league.id}
        matchdays={league.matchdays}
        finalized={league.finalized}
        generateBlocker={league.generateBlocker}
      />
    </main>
  );
}
