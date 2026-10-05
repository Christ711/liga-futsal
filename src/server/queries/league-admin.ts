import "server-only";

import { MIN_TEAMS_FOR_MATCHDAY } from "@/domain/league-rules";
import { matchdayStatus, numberMatchdays } from "@/domain/matchdays";
import { db } from "@/server/db/client";
import { fromDbDay } from "@/server/db/days";

/** Datos de la página de administración de una liga; la autorización ya la hizo el layout. */
export async function getLeagueAdmin(leagueId: string) {
  const [league, deductions, matchdays] = await Promise.all([
    db.league.findUniqueOrThrow({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        semester: true,
        status: true,
        teams: {
          orderBy: { nameKey: "asc" },
          select: {
            id: true,
            name: true,
            crest: { select: { hash: true } },
            players: { orderBy: { nameKey: "asc" }, select: { id: true, name: true } },
          },
        },
      },
    }),
    db.pointDeduction.findMany({
      where: { team: { leagueId } },
      // En el orden en que se aplicaron (RF-67).
      orderBy: { createdAt: "asc" },
      select: { id: true, points: true, reason: true, team: { select: { id: true, name: true } } },
    }),
    db.matchday.findMany({
      where: { leagueId },
      select: {
        id: true,
        playDate: true,
        finalizedAt: true,
        matches: { select: { status: true } },
      },
    }),
  ]);
  const hasOpenMatchday = matchdays.some((matchday) => matchday.finalizedAt === null);
  const finalized = league.status === "FINALIZED";
  return {
    id: league.id,
    name: league.name,
    semester: league.semester,
    finalized,
    // RF-23, RF-24: equipos solo mientras la liga está en curso y sin fechas.
    canChangeTeams: !finalized && matchdays.length === 0,
    // RF-41, RF-100: el motivo por el que no se puede generar una fecha, si lo hay.
    generateBlocker: finalized
      ? null
      : league.teams.length < MIN_TEAMS_FOR_MATCHDAY
        ? ("NOT_ENOUGH_TEAMS" as const)
        : hasOpenMatchday
          ? ("MATCHDAY_OPEN" as const)
          : null,
    // RF-73: partidos pendientes que se descartarían al finalizar la liga.
    pendingCount: matchdays
      .flatMap((matchday) => matchday.matches)
      .filter((match) => match.status === "PENDING").length,
    // RF-43, RF-48, RF-104, RF-105: número y estado se calculan, no se guardan (plan D3).
    matchdays: numberMatchdays(
      matchdays.map((matchday) => {
        const matches = matchday.matches.map((match) =>
          match.status === "FINISHED" ? ("finished" as const) : ("pending" as const),
        );
        return {
          id: matchday.id,
          playDate: fromDbDay(matchday.playDate),
          finishedCount: matches.filter((status) => status === "finished").length,
          ...matchdayStatus({
            finalized: matchday.finalizedAt !== null,
            matches: matches.map((status) => ({ status })),
          }),
        };
      }),
    ),
    teams: league.teams.map((team) => ({
      id: team.id,
      name: team.name,
      crestHash: team.crest?.hash ?? null,
      players: team.players,
    })),
    deductions: deductions.map(({ team, ...deduction }) => ({
      ...deduction,
      teamId: team.id,
      teamName: team.name,
    })),
  };
}
