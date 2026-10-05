import "server-only";

import { checkRemoveGoal } from "@/domain/matches";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedGoal } from "@/server/authz";
import { db } from "@/server/db/client";
import { DOMAIN_MATCH_SELECT, toDomainMatch } from "@/server/db/matches";

/** Quita un gol registrado mientras su partido no está bloqueado (RF-57, RF-103). */
export async function removeGoal(
  leagueId: string,
  goalId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedGoal(user.id, leagueId, goalId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const match = await db.match.findUniqueOrThrow({
    where: { id: owned.data.goal.matchId },
    select: DOMAIN_MATCH_SELECT,
  });
  const allowed = checkRemoveGoal(toDomainMatch(match));
  if (!allowed.ok) return allowed;

  // Si otro dispositivo ya lo quitó, el resultado es el mismo (RF-85).
  await db.goal.deleteMany({ where: { id: goalId } });
  return ok(null);
}
