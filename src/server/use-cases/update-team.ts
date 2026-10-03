import "server-only";

import { validateName } from "@/domain/names";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedTeam } from "@/server/authz";
import { db } from "@/server/db/client";
import { isUniqueViolation } from "@/server/db/errors";

import { duplicateTeamName } from "./team-names";

/** Renombra un equipo mientras la liga está en curso, aunque ya tenga fechas (RF-25, RF-26, RF-27). */
export async function updateTeam(
  leagueId: string,
  teamId: string,
  input: { name: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedTeam(user.id, leagueId, teamId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const name = validateName("team", input.name);
  if (!name.ok) return name;

  try {
    await db.team.update({ where: { id: teamId }, data: name.data });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateTeamName();
    throw error;
  }
  return ok(null);
}
