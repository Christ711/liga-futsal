import { fail, ok, type Result } from "./result";

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
  /** Solo los partidos terminados cuentan en las tablas (RF-59). */
  status: MatchStatus;
  /** Queda en `true` al finalizar su fecha; desde ahí no se modifica (RF-102, RF-103). */
  locked: boolean;
};

export type MatchStatus = "pending" | "finished";

/** Gol que se quiere registrar o el nuevo destino de un gol reasignado. */
export type NewGoal = {
  teamId: string;
  /** Autor con su equipo actual, o `null` para "Gol sin autor". */
  scorer: { id: string; teamId: string } | null;
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

function checkUnlocked(match: Match): Result<null> {
  return match.locked ? fail("MATCH_LOCKED") : ok(null);
}

function checkGoalTarget(match: Match, goal: NewGoal): Result<null> {
  const unlocked = checkUnlocked(match);
  if (!unlocked.ok) return unlocked;
  if (goal.teamId !== match.teamAId && goal.teamId !== match.teamBId) {
    return fail("TEAM_NOT_IN_MATCH");
  }
  // El autor debe ser un jugador actual del equipo al que suma el gol (RF-53, RF-57).
  if (goal.scorer && goal.scorer.teamId !== goal.teamId) {
    return fail("SCORER_NOT_IN_TEAM");
  }
  return ok(null);
}

/** Registrar un gol en un partido pendiente o terminado, mientras no esté bloqueado (RF-103). */
export function checkAddGoal(match: Match, goal: NewGoal): Result<null> {
  return checkGoalTarget(match, goal);
}

/** Reasignar un gol a otro jugador o a "Gol sin autor" de cualquiera de los dos equipos (RF-57). */
export function checkReassignGoal(match: Match, goal: NewGoal): Result<null> {
  return checkGoalTarget(match, goal);
}

/** Quitar un gol registrado (RF-57). */
export function checkRemoveGoal(match: Match): Result<null> {
  return checkUnlocked(match);
}

/** Terminar un partido con el marcador que tenga, incluido 0-0 (RF-58). */
export function checkFinishMatch(match: Match): Result<null> {
  const unlocked = checkUnlocked(match);
  if (!unlocked.ok) return unlocked;
  return match.status === "finished" ? fail("MATCH_ALREADY_FINISHED") : ok(null);
}

/** Devolver a pendiente un partido terminado no bloqueado; sus goles se conservan (RF-84). */
export function checkRevertMatch(match: Match): Result<null> {
  const unlocked = checkUnlocked(match);
  if (!unlocked.ok) return unlocked;
  return match.status === "pending" ? fail("MATCH_NOT_FINISHED") : ok(null);
}
