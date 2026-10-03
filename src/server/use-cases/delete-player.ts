import "server-only";

import { checkCanDeletePlayer } from "@/domain/league-rules";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { leagueStatus, requireOwnedPlayer } from "@/server/authz";
import { db } from "@/server/db/client";
import { isForeignKeyViolation } from "@/server/db/errors";

/** Quita de la liga a un jugador sin goles registrados (RF-37, RF-38). */
export async function deletePlayer(
  leagueId: string,
  playerId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedPlayer(user.id, leagueId, playerId);
  if (!owned.ok) return owned;
  const goalCount = await db.goal.count({ where: { scorerId: playerId } });
  const allowed = checkCanDeletePlayer({ status: leagueStatus(owned.data.league), goalCount });
  if (!allowed.ok) return allowed;

  try {
    await db.player.delete({ where: { id: playerId } });
  } catch (error) {
    // Un gol registrado entre la revisión y el borrado: la base lo impide (plan, Goal.scorer).
    if (isForeignKeyViolation(error)) return fail("PLAYER_HAS_GOALS");
    throw error;
  }
  return ok(null);
}
