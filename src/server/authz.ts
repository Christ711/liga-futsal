import "server-only";

import { checkLeagueEditable, type LeagueStatus } from "@/domain/league-rules";
import { fail, ok, type Result } from "@/domain/result";
import type { League, Player, PointDeduction, Team } from "@/generated/prisma/client";
import { db } from "@/server/db/client";

type Options = { mustBeInProgress?: boolean };

/** Estado de la liga en el vocabulario del dominio. */
export const leagueStatus = (league: Pick<League, "status">): LeagueStatus =>
  league.status === "FINALIZED" ? "finalized" : "in_progress";

/**
 * Autoriza una operación sobre una liga (principio 3): solo su dueño la
 * recibe (RF-13). Con `mustBeInProgress`, una liga finalizada se rechaza
 * porque ya no admite cambios (RF-76). La sesión la obtiene quien llama.
 */
export async function requireOwnedLeague(
  userId: string,
  leagueId: string,
  { mustBeInProgress = false }: Options = {},
): Promise<Result<League>> {
  const league = await db.league.findUnique({ where: { id: leagueId } });
  if (!league) return fail("NOT_FOUND");
  if (league.ownerId !== userId) return fail("FORBIDDEN");
  if (mustBeInProgress) {
    const editable = checkLeagueEditable({ status: leagueStatus(league) });
    if (!editable.ok) return editable;
  }
  return ok(league);
}

/**
 * Autoriza una operación sobre un equipo: la liga debe ser del ayudante y el
 * equipo debe pertenecer a esa liga; si no, se trata como inexistente.
 */
export async function requireOwnedTeam(
  userId: string,
  leagueId: string,
  teamId: string,
  options: Options = {},
): Promise<Result<{ league: League; team: Team }>> {
  const league = await requireOwnedLeague(userId, leagueId, options);
  if (!league.ok) return league;
  const team = await db.team.findFirst({ where: { id: teamId, leagueId } });
  if (!team) return fail("NOT_FOUND");
  return ok({ league: league.data, team });
}

/** Autoriza una operación sobre un jugador de la liga; uno de otra liga se trata como inexistente. */
export async function requireOwnedPlayer(
  userId: string,
  leagueId: string,
  playerId: string,
  options: Options = {},
): Promise<Result<{ league: League; player: Player }>> {
  const league = await requireOwnedLeague(userId, leagueId, options);
  if (!league.ok) return league;
  const player = await db.player.findFirst({ where: { id: playerId, leagueId } });
  if (!player) return fail("NOT_FOUND");
  return ok({ league: league.data, player });
}

/** Autoriza una operación sobre un descuento de un equipo de la liga. */
export async function requireOwnedDeduction(
  userId: string,
  leagueId: string,
  deductionId: string,
  options: Options = {},
): Promise<Result<{ league: League; deduction: PointDeduction }>> {
  const league = await requireOwnedLeague(userId, leagueId, options);
  if (!league.ok) return league;
  const deduction = await db.pointDeduction.findFirst({
    where: { id: deductionId, team: { leagueId } },
  });
  if (!deduction) return fail("NOT_FOUND");
  return ok({ league: league.data, deduction });
}
