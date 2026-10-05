import "server-only";

import { checkReassignGoal } from "@/domain/matches";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedGoal } from "@/server/authz";
import { db } from "@/server/db/client";
import { DOMAIN_MATCH_SELECT, toDomainMatch } from "@/server/db/matches";

import { goalTarget } from "./goal-target";

/**
 * Reasigna un gol a otro jugador actual o a "Gol sin autor" de cualquiera de
 * los dos equipos del partido, mientras no esté bloqueado (RF-57, RF-103).
 */
export async function reassignGoal(
  leagueId: string,
  goalId: string,
  input: { teamId: string; scorerId: string | null },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedGoal(user.id, leagueId, goalId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const target = await goalTarget(leagueId, input);
  if (!target.ok) return target;
  const match = await db.match.findUniqueOrThrow({
    where: { id: owned.data.goal.matchId },
    select: DOMAIN_MATCH_SELECT,
  });
  const allowed = checkReassignGoal(toDomainMatch(match), target.data);
  if (!allowed.ok) return allowed;

  await db.goal.update({
    where: { id: goalId },
    data: { teamId: input.teamId, scorerId: input.scorerId },
  });
  return ok(null);
}
