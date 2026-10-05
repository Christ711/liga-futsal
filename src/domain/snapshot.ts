import type { Match } from "./matches";
import {
  computeStandings,
  computeTopScorers,
  type PointDeduction,
  type ScorerPlayer,
  type StandingsRow,
  type StandingsTeam,
  type TopScorerRow,
} from "./standings";

/** Tablas finales de una liga, guardadas tal cual al finalizarla (RF-74; plan D7). */
export type LeagueSnapshot = {
  standings: StandingsRow[];
  topScorers: TopScorerRow[];
};

/**
 * Calcula las tablas finales: solo cuentan los partidos terminados, así que los
 * pendientes se descartan (RF-75); cada goleador queda con su equipo actual
 * (RF-74), y una liga sin fechas queda en cero (RF-77).
 */
export function buildSnapshot(input: {
  teams: readonly StandingsTeam[];
  players: readonly ScorerPlayer[];
  matches: readonly Match[];
  deductions: readonly PointDeduction[];
}): LeagueSnapshot {
  return {
    standings: computeStandings(input),
    topScorers: computeTopScorers(input),
  };
}
