import "server-only";

import { checkAddGoal } from "@/domain/matches";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedMatch } from "@/server/authz";
import { db } from "@/server/db/client";
import { DOMAIN_MATCH_SELECT, toDomainMatch } from "@/server/db/matches";

import { goalTarget } from "./goal-target";

/**
 * Registra un gol de un jugador actual de cualquiera de los dos equipos, o un
 * "Gol sin autor", y lo guarda en ese momento (RF-53, RF-54, RF-56, RF-103).
 */
export async function addGoal(
  leagueId: string,
  input: { matchId: string; teamId: string; scorerId: string | null },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedMatch(user.id, leagueId, input.matchId, {
    mustBeInProgress: true,
  });
  if (!owned.ok) return owned;
  const target = await goalTarget(leagueId, input);
  if (!target.ok) return target;
  const match = await db.match.findUniqueOrThrow({
    where: { id: input.matchId },
    select: DOMAIN_MATCH_SELECT,
  });
  const allowed = checkAddGoal(toDomainMatch(match), target.data);
  if (!allowed.ok) return allowed;

  await db.goal.create({
    data: { matchId: input.matchId, teamId: input.teamId, scorerId: input.scorerId },
  });
  return ok(null);
}
