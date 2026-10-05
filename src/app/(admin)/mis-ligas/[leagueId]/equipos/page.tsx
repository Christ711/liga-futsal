import type { Metadata } from "next";

import { getLeagueAdmin } from "@/server/queries/league-admin";

import { loadOwnedLeague } from "../owned-league";
import { TeamsSection } from "../teams-section";

type Props = { params: Promise<{ leagueId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await loadOwnedLeague((await params).leagueId);
  return { title: `Equipos - ${league.name} - Liga Futsal` };
}

/** Equipos de la liga con sus escudos y jugadores (plan D22). */
export default async function LeagueTeamsPage({ params }: Props) {
  const { leagueId } = await params;
  await loadOwnedLeague(leagueId);
  const league = await getLeagueAdmin(leagueId);

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-6">
      <TeamsSection
        leagueId={league.id}
        teams={league.teams}
        finalized={league.finalized}
        canChangeTeams={league.canChangeTeams}
      />
    </main>
  );
}
