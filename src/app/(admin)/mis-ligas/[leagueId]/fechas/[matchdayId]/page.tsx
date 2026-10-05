import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchdayStatusBadge } from "@/components/matchday/status-badge";
import { matchdayStatus } from "@/domain/matchdays";
import { formatDay } from "@/lib/dates";
import { getMatchdayView } from "@/server/queries/matchday";

import { loadOwnedLeague } from "../../owned-league";
import { MatchdayMatches } from "./matchday-view";

type Props = { params: Promise<{ leagueId: string; matchdayId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leagueId } = await params;
  const league = await loadOwnedLeague(leagueId);
  return { title: `Fecha - ${league.name} - Liga Futsal` };
}

/** Vista de una fecha para usar en la cancha (RF-52). La autoriza el layout de la liga. */
export default async function MatchdayPage({ params }: Props) {
  const { leagueId, matchdayId } = await params;
  const league = await loadOwnedLeague(leagueId);
  const view = await getMatchdayView(leagueId, matchdayId);
  if (!view) notFound();
  const { status, pendingCount } = matchdayStatus({
    finalized: view.matchday.finalized,
    matches: view.matches,
  });

  return (
    <main className="mx-auto grid w-full max-w-lg gap-5 px-4 py-6">
      <div className="grid gap-1">
        <Link
          href={`/mis-ligas/${leagueId}`}
          className="text-sm wrap-anywhere text-muted-foreground underline"
        >
          {league.name}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold">Fecha {view.matchday.number}</h1>
          <MatchdayStatusBadge status={status} pendingCount={pendingCount} />
        </div>
        <p className="text-sm text-muted-foreground first-letter:uppercase">
          {formatDay(view.matchday.playDate)}
        </p>
      </div>
      <MatchdayMatches initialView={view} />
    </main>
  );
}
