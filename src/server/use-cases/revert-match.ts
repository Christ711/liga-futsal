import "server-only";

import { checkRevertMatch } from "@/domain/matches";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedMatch } from "@/server/authz";
import { db } from "@/server/db/client";
import { DOMAIN_MATCH_SELECT, toDomainMatch } from "@/server/db/matches";

/** Devuelve a pendiente un partido terminado no bloqueado, conservando sus goles (RF-84). */
export async function revertMatch(
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
  const allowed = checkRevertMatch(toDomainMatch(match));
  if (!allowed.ok) return allowed;

  await db.match.update({ where: { id: matchId }, data: { status: "PENDING" } });
  return ok(null);
}
