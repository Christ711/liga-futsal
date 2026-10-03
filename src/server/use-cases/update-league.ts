import "server-only";

import { validateLeagueData } from "@/domain/league-rules";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedLeague } from "@/server/authz";
import { db } from "@/server/db/client";
import { isUniqueViolation } from "@/server/db/errors";

import { duplicateLeagueName } from "./league-names";

/** Edita el nombre y el semestre de una liga en curso (RF-18, RF-20, RF-76). */
export async function updateLeague(
  leagueId: string,
  input: { name: string; semester: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const league = await requireOwnedLeague(user.id, leagueId, { mustBeInProgress: true });
  if (!league.ok) return league;
  const data = validateLeagueData(input);
  if (!data.ok) return data;

  try {
    await db.league.update({ where: { id: leagueId }, data: data.data });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateLeagueName(data.data.semester);
    throw error;
  }
  return ok(null);
}
