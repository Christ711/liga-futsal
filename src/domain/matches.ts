/** Gol de un partido. `teamId` es el equipo cuyo marcador sube (plan D5). */
export type Goal = {
  teamId: string;
  /** Jugador que lo marcó, o `null` si es un "Gol sin autor" (RF-56). */
  scorerId: string | null;
};

/**
 * Partido entre dos equipos. Son "equipo A" y "equipo B" solo para nombrarlos:
 * no hay local ni visita (RF-47).
 */
export type Match = {
  teamAId: string;
  teamBId: string;
  goals: readonly Goal[];
};

export type MatchScore = {
  teamA: number;
  teamB: number;
};

function assertPlays(match: Match, teamId: string): void {
  if (teamId !== match.teamAId && teamId !== match.teamBId) {
    throw new Error(`El equipo "${teamId}" no juega este partido.`);
  }
}

/** Goles registrados a favor de un equipo en el partido (RF-55). */
export function goalsFor(match: Match, teamId: string): number {
  assertPlays(match, teamId);
  let count = 0;
  for (const goal of match.goals) {
    assertPlays(match, goal.teamId);
    if (goal.teamId === teamId) count += 1;
  }
  return count;
}

/** Marcador del partido, calculado desde sus goles (RF-55). */
export function matchScore(match: Match): MatchScore {
  return {
    teamA: goalsFor(match, match.teamAId),
    teamB: goalsFor(match, match.teamBId),
  };
}
