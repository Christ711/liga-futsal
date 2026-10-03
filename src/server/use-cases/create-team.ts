import "server-only";

import { checkCanChangeTeams } from "@/domain/league-rules";
import { validateName } from "@/domain/names";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { leagueStatus, requireOwnedLeague } from "@/server/authz";
import { db } from "@/server/db/client";
import { isUniqueViolation } from "@/server/db/errors";

import { duplicateTeamName } from "./team-names";

/** Agrega un equipo mientras la liga está en curso y no tiene fechas (RF-23, RF-24, RF-26, RF-27). */
export async function createTeam(
  leagueId: string,
  input: { name: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const league = await requireOwnedLeague(user.id, leagueId);
  if (!league.ok) return league;
  const matchdayCount = await db.matchday.count({ where: { leagueId } });
  const allowed = checkCanChangeTeams({ status: leagueStatus(league.data), matchdayCount });
  if (!allowed.ok) return allowed;
  const name = validateName("team", input.name);
  if (!name.ok) return name;

  try {
    await db.team.create({ data: { leagueId, ...name.data } });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateTeamName();
    throw error;
  }
  return ok(null);
}
