import "server-only";

import type { Match as DomainMatch } from "@/domain/matches";

type MatchRow = {
  teamAId: string;
  teamBId: string;
  status: "PENDING" | "FINISHED";
  locked: boolean;
  goals: { teamId: string; scorerId: string | null }[];
};

/** Partido de la base en el formato del dominio (ADR 008). */
export function toDomainMatch(match: MatchRow): DomainMatch {
  return {
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    status: match.status === "FINISHED" ? "finished" : "pending",
    locked: match.locked,
    goals: match.goals.map((goal) => ({ teamId: goal.teamId, scorerId: goal.scorerId })),
  };
}

/** Columnas de un partido que necesita `toDomainMatch`. */
export const DOMAIN_MATCH_SELECT = {
  teamAId: true,
  teamBId: true,
  status: true,
  locked: true,
  goals: { select: { teamId: true, scorerId: true } },
} as const;
