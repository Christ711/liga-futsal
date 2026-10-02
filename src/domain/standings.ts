import { matchScore, type Match } from "./matches";

/** Puntos por resultado (RF-63). */
const POINTS = { win: 3, draw: 1, loss: 0 } as const;

export type StandingsTeam = {
  id: string;
  name: string;
};

/** Descuento de puntos aplicado a un equipo (RF-67). */
export type PointDeduction = {
  teamId: string;
  points: number;
  reason: string;
};

/** Fila de la tabla de posiciones (RF-62). */
export type StandingsRow = {
  teamId: string;
  teamName: string;
  /** Posición en la tabla; los equipos empatados en todos los criterios la comparten (RF-66). */
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  /** Puntos de partidos terminados menos la suma de descuentos; puede ser negativo (RF-64, RF-69). */
  points: number;
  /** Descuentos del equipo, para mostrar el asterisco con cada motivo y cantidad (RF-70). */
  deductions: { points: number; reason: string }[];
};

type Tally = Omit<
  StandingsRow,
  "teamId" | "teamName" | "position" | "goalDifference" | "points" | "deductions"
> & {
  matchPoints: number;
};

const emptyTally = (): Tally => ({
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  matchPoints: 0,
});

function addResult(tally: Tally, scored: number, conceded: number): void {
  tally.played += 1;
  tally.goalsFor += scored;
  tally.goalsAgainst += conceded;
  if (scored > conceded) {
    tally.won += 1;
    tally.matchPoints += POINTS.win;
  } else if (scored === conceded) {
    tally.drawn += 1;
    tally.matchPoints += POINTS.draw;
  } else {
    tally.lost += 1;
    tally.matchPoints += POINTS.loss;
  }
}

/** Acumula los resultados de los partidos terminados entre los equipos dados (RF-59). */
function tallyMatches(teamIds: readonly string[], matches: readonly Match[]): Map<string, Tally> {
  const tallies = new Map(teamIds.map((teamId) => [teamId, emptyTally()]));
  for (const match of matches) {
    if (match.status !== "finished") continue;
    const tallyA = tallies.get(match.teamAId);
    const tallyB = tallies.get(match.teamBId);
    if (!tallyA || !tallyB) {
      const missing = tallyA ? match.teamBId : match.teamAId;
      throw new Error(`El equipo "${missing}" de un partido no pertenece a la liga.`);
    }
    const score = matchScore(match);
    addResult(tallyA, score.teamA, score.teamB);
    addResult(tallyB, score.teamB, score.teamA);
  }
  return tallies;
}

type UnrankedRow = Omit<StandingsRow, "position">;

/** Compara por puntos, diferencia de gol y goles a favor, de mayor a menor (RF-65). */
function compareByTotals(a: UnrankedRow, b: UnrankedRow): number {
  return b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor;
}

/**
 * Ordena la tabla y asigna posiciones (RF-65, RF-66, RF-107). Los equipos
 * empatados en puntos, diferencia de gol y goles a favor se ordenan por los
 * puntos obtenidos en los partidos entre todos ellos, calculados una sola vez;
 * los que sigan empatados comparten posición.
 */
function rank(rows: readonly UnrankedRow[], matches: readonly Match[]): StandingsRow[] {
  const sorted = [...rows].sort(compareByTotals);
  const ranked: StandingsRow[] = [];

  let start = 0;
  while (start < sorted.length) {
    let end = start + 1;
    while (end < sorted.length && compareByTotals(sorted[start]!, sorted[end]!) === 0) end += 1;
    const group = sorted.slice(start, end);

    const groupIds = group.map((row) => row.teamId);
    const headToHead = tallyMatches(
      groupIds,
      matches.filter(
        (match) => groupIds.includes(match.teamAId) && groupIds.includes(match.teamBId),
      ),
    );
    const directPoints = (row: UnrankedRow) => headToHead.get(row.teamId)!.matchPoints;

    // Dentro de una posición compartida se ordena por nombre para que la tabla sea estable.
    const ordered = [...group].sort(
      (a, b) => directPoints(b) - directPoints(a) || a.teamName.localeCompare(b.teamName, "es"),
    );
    ordered.forEach((row, index) => {
      const previous = ordered[index - 1];
      const sharesPosition = previous !== undefined && directPoints(previous) === directPoints(row);
      const position = sharesPosition ? ranked[ranked.length - 1]!.position : start + index + 1;
      ranked.push({ ...row, position });
    });

    start = end;
  }
  return ranked;
}

/**
 * Tabla de posiciones de una liga, calculada desde sus partidos terminados
 * (ADR 009). No se guarda mientras la liga está en curso.
 */
export function computeStandings(input: {
  teams: readonly StandingsTeam[];
  matches: readonly Match[];
  deductions: readonly PointDeduction[];
}): StandingsRow[] {
  const tallies = tallyMatches(
    input.teams.map((team) => team.id),
    input.matches,
  );
  const deductionsByTeam = new Map<string, StandingsRow["deductions"]>(
    input.teams.map((team) => [team.id, []]),
  );
  for (const deduction of input.deductions) {
    const teamDeductions = deductionsByTeam.get(deduction.teamId);
    if (!teamDeductions) {
      throw new Error(`El equipo "${deduction.teamId}" de un descuento no pertenece a la liga.`);
    }
    teamDeductions.push({ points: deduction.points, reason: deduction.reason });
  }

  const unranked = input.teams.map((team) => {
    const { matchPoints, ...tally } = tallies.get(team.id)!;
    const deductions = deductionsByTeam.get(team.id)!;
    const deducted = deductions.reduce((sum, deduction) => sum + deduction.points, 0);
    return {
      teamId: team.id,
      teamName: team.name,
      ...tally,
      goalDifference: tally.goalsFor - tally.goalsAgainst,
      points: matchPoints - deducted,
      deductions,
    };
  });

  return rank(unranked, input.matches);
}

export type ScorerPlayer = {
  id: string;
  name: string;
  /** Equipo actual del jugador; puede no ser el equipo para el que marcó (RF-40). */
  teamId: string;
};

/** Fila de la tabla de goleadores (RF-71). */
export type TopScorerRow = {
  /** Posición; los jugadores con los mismos goles la comparten (RF-72). */
  position: number;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
};

/**
 * Tabla de goleadores: cada jugador con al menos un gol en partidos terminados,
 * con su equipo actual (RF-71). Los goles sin autor no suman a nadie (RF-56).
 */
export function computeTopScorers(input: {
  teams: readonly StandingsTeam[];
  players: readonly ScorerPlayer[];
  matches: readonly Match[];
}): TopScorerRow[] {
  const playersById = new Map(input.players.map((player) => [player.id, player]));
  const teamNames = new Map(input.teams.map((team) => [team.id, team.name]));

  const goalsByPlayer = new Map<string, number>();
  for (const match of input.matches) {
    if (match.status !== "finished") continue;
    for (const goal of match.goals) {
      if (goal.scorerId === null) continue;
      if (!playersById.has(goal.scorerId)) {
        throw new Error(`El jugador "${goal.scorerId}" de un gol no pertenece a la liga.`);
      }
      goalsByPlayer.set(goal.scorerId, (goalsByPlayer.get(goal.scorerId) ?? 0) + 1);
    }
  }

  const sorted = [...goalsByPlayer.entries()]
    .map(([playerId, goals]) => ({ player: playersById.get(playerId)!, goals }))
    .sort((a, b) => b.goals - a.goals || a.player.name.localeCompare(b.player.name, "es"));

  const rows: TopScorerRow[] = [];
  sorted.forEach(({ player, goals }, index) => {
    const teamName = teamNames.get(player.teamId);
    if (teamName === undefined) {
      throw new Error(
        `El equipo "${player.teamId}" del jugador "${player.id}" no pertenece a la liga.`,
      );
    }
    const previous = rows[index - 1];
    rows.push({
      position: previous && previous.goals === goals ? previous.position : index + 1,
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      teamName,
      goals,
    });
  });
  return rows;
}
