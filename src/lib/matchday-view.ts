/**
 * Datos de la vista de la fecha tal como viajan del servidor al navegador
 * (ruta GET y carga inicial), y los cambios optimistas que aplica la caché de
 * TanStack Query antes de que responda el servidor (ADR 011).
 */

export type ViewPlayer = { id: string; name: string };

export type ViewTeam = {
  id: string;
  name: string;
  crestHash: string | null;
  /** Jugadores actuales, para elegir el autor de un gol (RF-53). */
  players: ViewPlayer[];
};

export type ViewGoal = {
  id: string;
  teamId: string;
  /** `null` en un "Gol sin autor" (RF-56). */
  scorer: ViewPlayer | null;
};

export type ViewMatch = {
  id: string;
  position: number;
  teamAId: string;
  teamBId: string;
  status: "pending" | "finished";
  locked: boolean;
  goals: ViewGoal[];
};

export type MatchdayView = {
  leagueId: string;
  matchday: { id: string; number: number; playDate: string; finalized: boolean };
  /** La liga está en curso: se pueden registrar goles y cambiar partidos (RF-76). */
  editable: boolean;
  teams: ViewTeam[];
  matches: ViewMatch[];
};

export type GoalTarget = { teamId: string; scorerId: string | null };

function updateMatch(
  view: MatchdayView,
  matchId: string,
  change: (match: ViewMatch) => ViewMatch,
): MatchdayView {
  return {
    ...view,
    matches: view.matches.map((match) => (match.id === matchId ? change(match) : match)),
  };
}

function scorerOf(view: MatchdayView, target: GoalTarget): ViewPlayer | null {
  if (target.scorerId === null) return null;
  const players = view.teams.flatMap((team) => team.players);
  return players.find((player) => player.id === target.scorerId) ?? null;
}

export function withGoalAdded(
  view: MatchdayView,
  goal: GoalTarget & { id: string; matchId: string },
): MatchdayView {
  return updateMatch(view, goal.matchId, (match) => ({
    ...match,
    goals: [...match.goals, { id: goal.id, teamId: goal.teamId, scorer: scorerOf(view, goal) }],
  }));
}

export function withGoalRemoved(view: MatchdayView, goalId: string): MatchdayView {
  return {
    ...view,
    matches: view.matches.map((match) => ({
      ...match,
      goals: match.goals.filter((goal) => goal.id !== goalId),
    })),
  };
}

export function withGoalReassigned(
  view: MatchdayView,
  change: GoalTarget & { goalId: string },
): MatchdayView {
  return {
    ...view,
    matches: view.matches.map((match) => ({
      ...match,
      goals: match.goals.map((goal) =>
        goal.id === change.goalId
          ? { id: goal.id, teamId: change.teamId, scorer: scorerOf(view, change) }
          : goal,
      ),
    })),
  };
}

export function withMatchStatus(
  view: MatchdayView,
  matchId: string,
  status: ViewMatch["status"],
): MatchdayView {
  return updateMatch(view, matchId, (match) => ({ ...match, status }));
}

/** Intercambia el partido con su vecino, como el caso de uso (RF-46). */
export function withMatchMoved(
  view: MatchdayView,
  matchId: string,
  direction: "up" | "down",
): MatchdayView {
  const matches = [...view.matches];
  const index = matches.findIndex((match) => match.id === matchId);
  const other = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || other < 0 || other >= matches.length) return view;
  [matches[index], matches[other]] = [matches[other]!, matches[index]!];
  return { ...view, matches: matches.map((match, i) => ({ ...match, position: i + 1 })) };
}
