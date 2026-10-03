import "server-only";

import { checkCanChangeTeams } from "@/domain/league-rules";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { leagueStatus, requireOwnedTeam } from "@/server/authz";
import { db } from "@/server/db/client";

/**
 * Elimina un equipo con sus jugadores y su escudo mientras la liga no tiene
 * fechas (RF-23, RF-24, RF-96). El borrado en cascada lo hace la base.
 */
export async function deleteTeam(
  leagueId: string,
  teamId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedTeam(user.id, leagueId, teamId);
  if (!owned.ok) return owned;
  const matchdayCount = await db.matchday.count({ where: { leagueId } });
  const allowed = checkCanChangeTeams({ status: leagueStatus(owned.data.league), matchdayCount });
  if (!allowed.ok) return allowed;

  await db.team.delete({ where: { id: teamId } });
  return ok(null);
}
