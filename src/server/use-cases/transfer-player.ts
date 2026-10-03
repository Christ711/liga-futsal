import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedPlayer } from "@/server/authz";
import { db } from "@/server/db/client";

/**
 * Traspasa un jugador a otro equipo de la misma liga, sin registro del equipo
 * anterior (RF-39). Sus goles guardan el equipo para el que se marcaron, así que
 * goles y marcadores no cambian (RF-40; plan D5).
 */
export async function transferPlayer(
  leagueId: string,
  playerId: string,
  input: { teamId: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedPlayer(user.id, leagueId, playerId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const target = await db.team.findFirst({ where: { id: input.teamId, leagueId } });
  if (!target) return fail("NOT_FOUND");

  await db.player.update({ where: { id: playerId }, data: { teamId: target.id } });
  return ok(null);
}
