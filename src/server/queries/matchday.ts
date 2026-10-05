import "server-only";

import { numberMatchdays } from "@/domain/matchdays";
import type { MatchdayView } from "@/lib/matchday-view";
import { db } from "@/server/db/client";
import { fromDbDay } from "@/server/db/days";

/**
 * Datos de la vista de una fecha: sus partidos en orden con sus goles, y los
 * equipos con sus jugadores actuales para elegir autores (RF-52, RF-53). La
 * autorización la hace quien llama; devuelve `null` si la fecha no es de la liga.
 */
export async function getMatchdayView(
  leagueId: string,
  matchdayId: string,
): Promise<MatchdayView | null> {
  const matchday = await db.matchday.findFirst({
    where: { id: matchdayId, leagueId },
    select: {
      id: true,
      playDate: true,
      finalizedAt: true,
      league: { select: { status: true } },
      matches: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          teamAId: true,
          teamBId: true,
          status: true,
          locked: true,
          goals: {
            orderBy: { createdAt: "asc" },
            select: { id: true, teamId: true, scorer: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  if (!matchday) return null;

  const [days, teams] = await Promise.all([
    db.matchday.findMany({ where: { leagueId }, select: { id: true, playDate: true } }),
    db.team.findMany({
      where: { leagueId },
      orderBy: { nameKey: "asc" },
      select: {
        id: true,
        name: true,
        crest: { select: { hash: true } },
        players: { orderBy: { nameKey: "asc" }, select: { id: true, name: true } },
      },
    }),
  ]);
  // RF-43: el número de la fecha depende de su día entre todas las de la liga.
  const numbered = numberMatchdays(
    days.map((day) => ({ id: day.id, playDate: fromDbDay(day.playDate) })),
  );

  return {
    leagueId,
    matchday: {
      id: matchday.id,
      number: numbered.find((day) => day.id === matchday.id)!.number,
      playDate: fromDbDay(matchday.playDate),
      finalized: matchday.finalizedAt !== null,
    },
    editable: matchday.league.status === "IN_PROGRESS",
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      crestHash: team.crest?.hash ?? null,
      players: team.players,
    })),
    matches: matchday.matches.map((match) => ({
      ...match,
      status: match.status === "FINISHED" ? "finished" : "pending",
    })),
  };
}
