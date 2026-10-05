import "server-only";

import { checkFinalizeMatchday, matchesToLock } from "@/domain/matchdays";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedMatchday } from "@/server/authz";
import { db } from "@/server/db/client";
import { now } from "@/server/time";

/**
 * Finaliza una fecha abierta o incompleta: bloquea sus partidos terminados y
 * deja los pendientes libres para jugarse otro día (RF-49, RF-102; plan D4).
 */
export async function finalizeMatchday(
  leagueId: string,
  matchdayId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedMatchday(user.id, leagueId, matchdayId, {
    mustBeInProgress: true,
  });
  if (!owned.ok) return owned;

  const matches = (
    await db.match.findMany({
      where: { matchdayId },
      select: { id: true, status: true, locked: true },
    })
  ).map((match) => ({
    ...match,
    status: match.status === "FINISHED" ? ("finished" as const) : ("pending" as const),
  }));
  const allowed = checkFinalizeMatchday({
    finalized: owned.data.matchday.finalizedAt !== null,
    matches,
  });
  if (!allowed.ok) return allowed;

  await db.$transaction([
    db.match.updateMany({ where: { id: { in: matchesToLock(matches) } }, data: { locked: true } }),
    db.matchday.update({ where: { id: matchdayId }, data: { finalizedAt: now() } }),
  ]);
  return ok(null);
}
