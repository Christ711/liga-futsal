import "server-only";

import { matchScore } from "@/domain/matches";
import { matchdayStatus, numberMatchdays, type MatchdayStatus } from "@/domain/matchdays";
import type { LeagueSnapshot } from "@/domain/snapshot";
import type { StandingsRow, TopScorerRow } from "@/domain/standings";
import { db } from "@/server/db/client";
import { fromDbDay } from "@/server/db/days";
import { toDomainMatch } from "@/server/db/matches";

import { parseSnapshot } from "./snapshot-schema";
import { getLeagueTables } from "./tables";

export type PublicTeam = { id: string; name: string; crestHash: string | null };

export type PublicMatch = {
  id: string;
  teamA: PublicTeam;
  teamB: PublicTeam;
  status: "pending" | "finished";
  score: { teamA: number; teamB: number };
};

export type PublicMatchday = {
  id: string;
  number: number;
  playDate: string;
  status: MatchdayStatus;
  pendingCount: number;
  matches: PublicMatch[];
};

type Base = { id: string; name: string; semester: string; ownerId: string };

export type PublicLeague =
  | (Base & {
      status: "in_progress";
      tables: { standings: StandingsRow[]; topScorers: TopScorerRow[] };
      /** De la más reciente a la más antigua. */
      matchdays: PublicMatchday[];
    })
  | (Base & {
      status: "finalized";
      snapshot: LeagueSnapshot;
      teams: (PublicTeam & { players: { id: string; name: string }[] })[];
    });

/**
 * Datos de la vista pública de una liga (RF-81, RF-82). Nunca selecciona datos
 * de la cuenta del dueño (RF-14); `ownerId` solo sirve para ofrecerle el
 * acceso a administrarla y no se muestra.
 */
export async function getPublicLeague(leagueId: string): Promise<PublicLeague | null> {
  const league = await db.league.findUnique({
    where: { id: leagueId },
    select: {
      id: true,
      name: true,
      semester: true,
      status: true,
      ownerId: true,
      snapshot: { select: { standings: true, topScorers: true } },
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
  });
  if (!league) return null;
  const base = {
    id: league.id,
    name: league.name,
    semester: league.semester,
    ownerId: league.ownerId,
  };
  const teams = league.teams.map((team) => ({
    id: team.id,
    name: team.name,
    crestHash: team.crest?.hash ?? null,
    players: team.players,
  }));

  if (league.status === "FINALIZED") {
    if (!league.snapshot) throw new Error(`La liga finalizada ${league.id} no tiene snapshot.`);
    return { ...base, status: "finalized", snapshot: parseSnapshot(league.snapshot), teams };
  }

  const [tables, matchdays] = await Promise.all([
    getLeagueTables(leagueId),
    db.matchday.findMany({
      where: { leagueId },
      select: {
        id: true,
        playDate: true,
        finalizedAt: true,
        matches: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            teamAId: true,
            teamBId: true,
            status: true,
            locked: true,
            goals: { select: { teamId: true, scorerId: true } },
          },
        },
      },
    }),
  ]);
  const teamById = new Map(
    teams.map((team) => [team.id, { id: team.id, name: team.name, crestHash: team.crestHash }]),
  );
  const numbered = numberMatchdays(
    matchdays.map((matchday) => {
      const matches = matchday.matches.map((match) => {
        const domain = toDomainMatch(match);
        return {
          id: match.id,
          teamA: teamById.get(match.teamAId)!,
          teamB: teamById.get(match.teamBId)!,
          status: domain.status,
          score: matchScore(domain),
        };
      });
      return {
        id: matchday.id,
        playDate: fromDbDay(matchday.playDate),
        matches,
        ...matchdayStatus({ finalized: matchday.finalizedAt !== null, matches }),
      };
    }),
  );
  return { ...base, status: "in_progress", tables, matchdays: numbered.reverse() };
}
