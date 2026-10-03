import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedMatchday } from "@/server/authz";
import { db } from "@/server/db/client";

/**
 * Elimina una fecha abierta, incompleta o finalizada con sus partidos y goles
 * (RF-50). Las tablas se calculan al leer, así que se recalculan solas (ADR 009).
 */
export async function deleteMatchday(
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

  await db.matchday.delete({ where: { id: matchdayId } });
  return ok(null);
}
