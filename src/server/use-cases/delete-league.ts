import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedLeague } from "@/server/authz";
import { db } from "@/server/db/client";

/**
 * Elimina una liga, en curso o finalizada, con todos sus datos y escudos
 * (RF-78, RF-79). El borrado en cascada lo hace la base.
 */
export async function deleteLeague(
  leagueId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const league = await requireOwnedLeague(user.id, leagueId);
  if (!league.ok) return league;

  await db.league.delete({ where: { id: leagueId } });
  return ok(null);
}
