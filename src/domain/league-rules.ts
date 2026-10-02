import { fail, ok, type Result } from "./result";

export type LeagueStatus = "in_progress" | "finalized";

/** Mínimo de equipos para generar una fecha (RF-41). */
export const MIN_TEAMS_FOR_MATCHDAY = 3;

/** Una liga finalizada no admite ninguna modificación; solo se puede eliminar completa (RF-76). */
export function checkLeagueEditable(league: { status: LeagueStatus }): Result<null> {
  return league.status === "finalized" ? fail("LEAGUE_FINALIZED") : ok(null);
}

/** Agregar o eliminar equipos solo se permite mientras la liga no tiene fechas (RF-23, RF-24). */
export function checkCanChangeTeams(league: {
  status: LeagueStatus;
  matchdayCount: number;
}): Result<null> {
  const editable = checkLeagueEditable(league);
  if (!editable.ok) return editable;
  return league.matchdayCount > 0 ? fail("TEAMS_LOCKED") : ok(null);
}

/** Un jugador con goles registrados no se puede eliminar (RF-37). */
export function checkCanDeletePlayer(input: {
  status: LeagueStatus;
  goalCount: number;
}): Result<null> {
  const editable = checkLeagueEditable(input);
  if (!editable.ok) return editable;
  return input.goalCount > 0 ? fail("PLAYER_HAS_GOALS") : ok(null);
}

/** Generar una fecha exige al menos 3 equipos y que no haya otra fecha abierta (RF-41, RF-100). */
export function checkCanGenerateMatchday(league: {
  status: LeagueStatus;
  teamCount: number;
  hasOpenMatchday: boolean;
}): Result<null> {
  const editable = checkLeagueEditable(league);
  if (!editable.ok) return editable;
  if (league.teamCount < MIN_TEAMS_FOR_MATCHDAY) return fail("NOT_ENOUGH_TEAMS");
  if (league.hasOpenMatchday) return fail("MATCHDAY_OPEN");
  return ok(null);
}
