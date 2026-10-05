import "server-only";

import { computeStandings, computeTopScorers } from "@/domain/standings";
import { db } from "@/server/db/client";
import { DOMAIN_MATCH_SELECT, toDomainMatch } from "@/server/db/matches";

/**
 * Tabla de posiciones y de goleadores de una liga en curso, calculadas al leer
 * desde los partidos guardados (ADR 009). Solo cuentan los terminados (RF-59).
 */
export async function getLeagueTables(leagueId: string) {
  const [teams, players, matches, deductions] = await Promise.all([
    db.team.findMany({ where: { leagueId }, select: { id: true, name: true } }),
    db.player.findMany({ where: { leagueId }, select: { id: true, name: true, teamId: true } }),
    db.match.findMany({ where: { matchday: { leagueId } }, select: DOMAIN_MATCH_SELECT }),
    db.pointDeduction.findMany({
      where: { team: { leagueId } },
      orderBy: { createdAt: "asc" },
      select: { teamId: true, points: true, reason: true },
    }),
  ]);
  const domainMatches = matches.map(toDomainMatch);
  return {
    standings: computeStandings({ teams, matches: domainMatches, deductions }),
    topScorers: computeTopScorers({ teams, players, matches: domainMatches }),
  };
}
