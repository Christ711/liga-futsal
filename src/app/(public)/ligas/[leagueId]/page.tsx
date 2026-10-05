import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { FinalizedTeams } from "@/components/league/finalized-teams";
import { MatchResult } from "@/components/matchday/match-result";
import { MatchdayStatusBadge } from "@/components/matchday/status-badge";
import { DeductionNotes } from "@/components/standings/deduction-note";
import { StandingsTable } from "@/components/standings/standings-table";
import { TopScorersTable } from "@/components/standings/top-scorers-table";
import { formatDay } from "@/lib/dates";
import { isAdminEmail } from "@/server/auth/admin";
import { getSession } from "@/server/auth/session";
import { getPublicLeague, type PublicMatchday } from "@/server/queries/public-league";

// Plan D13: la liga pública se renderiza en cada visita para mostrar datos vigentes (RF-83).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ leagueId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await getPublicLeague((await params).leagueId);
  return { title: league ? `${league.name} - Liga Futsal` : "Liga Futsal" };
}

/** Vista pública de una liga, en curso (RF-81) o finalizada (RF-82), sin iniciar sesión. */
export default async function PublicLeaguePage({ params }: Props) {
  const { leagueId } = await params;
  const [league, session] = await Promise.all([getPublicLeague(leagueId), getSession()]);
  if (!league) notFound();
  // Al dueño o al administrador se les ofrece volver a la administración (RF-93, RF-109).
  const canAdminister =
    session !== null && (session.user.id === league.ownerId || isAdminEmail(session.user.email));
  const finalized = league.status === "finalized";
  const tables = finalized ? league.snapshot : league.tables;

  return (
    <main className="mx-auto grid w-full max-w-lg gap-8 px-4 py-6">
      <div className="grid gap-1">
        <Link href="/" className="text-sm text-muted-foreground underline">
          Todas las ligas
        </Link>
        <h1 className="text-2xl font-semibold wrap-anywhere">{league.name}</h1>
        <p className="text-sm text-muted-foreground">
          Semestre {league.semester} ·{" "}
          <span className="font-medium text-foreground">
            {finalized ? "Finalizada" : "En curso"}
          </span>
        </p>
        {canAdminister ? (
          <Link href={`/mis-ligas/${league.id}`} className="text-sm font-medium underline">
            Administrar esta liga
          </Link>
        ) : null}
      </div>

      <Section id="tabla" title={finalized ? "Tabla final" : "Tabla de posiciones"}>
        <StandingsTable rows={tables.standings} />
        <DeductionNotes rows={tables.standings} />
      </Section>

      <Section id="goleadores" title="Goleadores">
        <TopScorersTable rows={tables.topScorers} />
      </Section>

      {league.status === "finalized" ? (
        <Section id="equipos" title="Equipos">
          <FinalizedTeams teams={league.teams} />
        </Section>
      ) : (
        <Section id="fechas" title="Fechas">
          {league.matchdays.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay fechas.</p>
          ) : (
            league.matchdays.map((matchday, index) => (
              <MatchdayResults key={matchday.id} matchday={matchday} open={index === 0} />
            ))
          )}
        </Section>
      )}
    </main>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Una fecha con su número, día, estado y partidos; la más reciente se muestra abierta. */
function MatchdayResults({ matchday, open }: { matchday: PublicMatchday; open: boolean }) {
  return (
    <details
      open={open}
      aria-label={`Fecha ${matchday.number}`}
      className="group/fecha overflow-hidden rounded-xl border bg-card"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid min-w-0 flex-1 gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">Fecha {matchday.number}</span>
            <MatchdayStatusBadge status={matchday.status} pendingCount={matchday.pendingCount} />
          </span>
          <span className="text-sm text-muted-foreground first-letter:uppercase">
            {formatDay(matchday.playDate)}
          </span>
        </span>
        <span className="text-sm text-muted-foreground underline">
          <span className="group-open/fecha:hidden">Ver</span>
          <span className="hidden group-open/fecha:inline">Ocultar</span>
        </span>
      </summary>
      <ol className="grid divide-y border-t">
        {matchday.matches.map((match) => (
          <MatchResult
            key={match.id}
            teamA={match.teamA}
            teamB={match.teamB}
            status={match.status}
            score={match.score}
          />
        ))}
      </ol>
    </details>
  );
}
