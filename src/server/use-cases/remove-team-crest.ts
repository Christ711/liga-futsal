import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedTeam } from "@/server/authz";
import { db } from "@/server/db/client";

/** Quita el escudo de un equipo; desde ahí se muestra el genérico con la inicial (RF-31, RF-32). */
export async function removeTeamCrest(
  leagueId: string,
  teamId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedTeam(user.id, leagueId, teamId, { mustBeInProgress: true });
  if (!owned.ok) return owned;

  await db.teamCrest.deleteMany({ where: { teamId } });
  return ok(null);
}
