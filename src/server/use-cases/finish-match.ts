import "server-only";

import { checkFinishMatch } from "@/domain/matches";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedMatch } from "@/server/authz";
import { db } from "@/server/db/client";
import { DOMAIN_MATCH_SELECT, toDomainMatch } from "@/server/db/matches";

/**
 * Termina un partido con el marcador que tenga, incluido 0-0 (RF-58). Las
 * tablas se calculan al leer, así que lo cuentan desde ya (RF-60; ADR 009).
 */
export async function finishMatch(
  leagueId: string,
  matchId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedMatch(user.id, leagueId, matchId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const match = await db.match.findUniqueOrThrow({
    where: { id: matchId },
    select: DOMAIN_MATCH_SELECT,
  });
  const allowed = checkFinishMatch(toDomainMatch(match));
  if (!allowed.ok) return allowed;

  await db.match.update({ where: { id: matchId }, data: { status: "FINISHED" } });
  return ok(null);
}
